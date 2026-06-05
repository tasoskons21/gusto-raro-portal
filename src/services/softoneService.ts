import { SoftOneOrder } from '../types';
import { supabase } from '../lib/supabase'; // Χρήση του δικού σου Supabase Client

const S1_URL = "/api/softone"; // Χρήση του proxy για αποφυγή CORS

/**
 * Κοινή συνάρτηση για αιτήματα στο SoftOne API
 */
const s1Request = async (payload: any) => {
  const response = await fetch(S1_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SoftOne API Error: ${response.status} - ${errorText}`);
  }

  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('windows-1253');
  const text = decoder.decode(buffer);

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("❌ JSON Parse Error:", text);
    throw new Error("Invalid JSON response from SoftOne");
  }
};

/**
 * Διαχείριση Login και Authentication
 */
export const getSoftOneAuth = async () => {
  try {
    const login = await s1Request({
      service: "login",
      username: "web",
      password: "gustoraro",
      appId: "157",
      language: "GRE"
    });

    if (!login.success) throw new Error("SoftOne Login Failed");

    const auth = await s1Request({
      service: "authenticate",
      clientID: login.clientID,
      appId: "156",
      company: "500",
      branch: "1000",
      module: "0",
      refId: "1",
      userId: "1"
    });

    if (!auth.success) throw new Error("SoftOne Auth Failed");

    return { ...auth, clientID: auth.sessionToken || auth.clientID || login.clientID };
  } catch (error) {
    console.error("❌ SoftOne Auth Error:", error);
    return null;
  }
};

/**
 * Βοηθητική συνάρτηση για την ανάκτηση στοιχείων από το Supabase βάσει Κωδικού είδους.
 * Χρησιμοποιεί τα ακριβή ονόματα των στηλών (Case-Sensitive): Code, Description, ImageUrl
 */
const getProductDetailsFromSupabase = async (productCode: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('Description, ImageUrl')
      .eq('Code', productCode)
      .maybeSingle(); // Επιστρέφει null αν δεν βρεθεί, χωρίς να πετάξει error 400/406

    if (error || !data) {
      return null;
    }

    return {
      description: data.Description,
      imageUrl: data.ImageUrl
    };
  } catch (err) {
    console.error(`⚠️ Σφάλμα Supabase για τον κωδικό ${productCode}:`, err);
    return null;
  }
};

/**
 * Ανακτά το ιστορικό παραγγελιών με δεδομένα (περιγραφή & photo) από το Supabase
 */
export const fetchOrderHistoryFromSoftOne = async (customerCode?: string, daysBack: number = 30) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", orders: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    console.log(`🔍 Αναζήτηση Παραγγελιών/Τιμολογίων τελευταίων ${daysBack} ημερών για τον κωδικό: ${customerCode}`);

    // 1. Βρες το TRDR του πελάτη βάσει του CODE
    const custRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "156",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: customerCode,
      RESULTFIELDS: "TRDR"
    });

    const targetTrdr = custRes?.rows?.[0] ? (Array.isArray(custRes.rows[0]) ? custRes.rows[0][0] : custRes.rows[0].TRDR) : null;
    if (!targetTrdr) {
      console.warn("⚠️ Δεν βρέθηκε ο πελάτης (TRDR) στο SoftOne");
      return { success: false, message: "Δεν βρέθηκε πελάτης", orders: [] };
    }

    // 2. Πάρε τα παραστατικά από το SALDOC για το συγκεκριμένο TRDR
    const selectorRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "156",
      TABLENAME: "SALDOC",
      KEYNAME: "TRDR",
      KEYVALUE: targetTrdr,
      RESULTFIELDS: "FINDOC,FINCODE,TRNDATE,SUMAMNT"
    });

    const rows = selectorRes?.rows || [];
    const ordersMap = new Map();

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - daysBack);

    for (const r of rows) {
      const row = r as any;
      const findoc = Array.isArray(row) ? row[0] : row.FINDOC;
      const fincode = Array.isArray(row) ? row[1] : row.FINCODE;
      const dateStr = Array.isArray(row) ? row[2] : row.TRNDATE;
      const total = Array.isArray(row) ? row[3] : row.SUMAMNT;

      const rDate = new Date(dateStr);
      if (rDate < limitDate) continue;

      // 3. Λήψη γραμμών παραγγελίας από το SoftOne (MTRLINES)
      const linesRes = await s1Request({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "156",
        TABLENAME: "MTRLINES",
        KEYNAME: "FINDOC",
        KEYVALUE: findoc,
        RESULTFIELDS: "MTRL,QTY1,PRICE"
      });

      const lines = linesRes?.rows || [];
      const items = [];

      for (const l of lines) {
        const line = l as any;
        const mtrlId = Array.isArray(line) ? String(line[0]) : String(line.MTRL || '');
        const qty = Array.isArray(line) ? Number(line[1] || 0) : Number(line.QTY1 || 0);
        const price = Array.isArray(line) ? Number(line[2] || 0) : Number(line.PRICE || 0);

        let realCode = mtrlId;
        let finalDescription = `Προϊόν ${mtrlId}`;
        let finalImage = null;

        if (mtrlId) {
          // Λήψη του εμπορικού κωδικού (π.χ. KE-2008) από το SoftOne (MTRL)
          const itemInfoRes = await s1Request({
            service: "selectorFields",
            clientID: auth.clientID,
            appId: "156",
            TABLENAME: "MTRL",
            KEYNAME: "MTRL",
            KEYVALUE: mtrlId,
            RESULTFIELDS: "CODE,NAME"
          });

          if (itemInfoRes?.rows?.[0]) {
            const iRow = itemInfoRes.rows[0];
            realCode = Array.isArray(iRow) ? String(iRow[0] || mtrlId) : String(iRow.CODE || mtrlId);
            finalDescription = Array.isArray(iRow) ? String(iRow[1] || '') : String(iRow.NAME || '');

            // 4. Αναζήτηση στο Supabase χρησιμοποιώντας τον καθαρό εμπορικό κωδικό
            const supabaseProduct = await getProductDetailsFromSupabase(realCode);
            if (supabaseProduct) {
              if (supabaseProduct.description) finalDescription = supabaseProduct.description;
              finalImage = supabaseProduct.imageUrl;
            }
          }
        }

        items.push({
          CODE: realCode,
          DESCRIPTION: finalDescription,
          QUANTITY: qty,
          PRICE: price,
          IMAGE_URL: finalImage // Επιστρέφεται για χρήση στο UI (π.χ. <img src={item.IMAGE_URL} />)
        });
      }

      ordersMap.set(fincode, {
        TRD_AAA: String(findoc),
        TRD_DATE: String(dateStr).split(' ')[0],
        TRD_CODE: String(fincode),
        TRD_NAME: "",
        TRD_AFM: "",
        TOTAL_VALUE: Number(total || 0),
        TRD_TYPE_DESC: 'ΤΙΜΟΛΟΓΙΟ',
        items: items
      });
    }

    const finalOrders = Array.from(ordersMap.values()).sort((a, b) => {
      return new Date(b.TRD_DATE).getTime() - new Date(a.TRD_DATE).getTime();
    });

    return { success: true, orders: finalOrders };

  } catch (error: any) {
    console.error("❌ fetchOrderHistory Error:", error);
    return { success: false, message: error.message, orders: [] };
  }
};

/**
 * Ανακτά τις γραμμές μιας παραγγελίας με δεδομένα από το Supabase
 */
export const fetchOrderDetailsFromSoftOne = async (trdAAA: string) => {
  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const linesRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "156",
      TABLENAME: "MTRLINES",
      KEYNAME: "FINDOC",
      KEYVALUE: trdAAA,
      RESULTFIELDS: "MTRL,QTY1,PRICE"
    });

    const rows = linesRes?.rows || [];
    const items = [];

    for (const r of rows) {
      const mtrlId = Array.isArray(r) ? String(r[0]) : String(r.MTRL || '');
      const qty = Array.isArray(r) ? Number(r[1] || 0) : Number(r.QTY1 || 0);
      const price = Array.isArray(r) ? Number(r[2] || 0) : Number(r.PRICE || 0);

      let realCode = mtrlId;
      let finalDescription = `Προϊόν ${mtrlId}`;
      let finalImage = null;

      if (mtrlId) {
        const itemInfoRes = await s1Request({
          service: "selectorFields",
          clientID: auth.clientID,
          appId: "156",
          TABLENAME: "MTRL",
          KEYNAME: "MTRL",
          KEYVALUE: mtrlId,
          RESULTFIELDS: "CODE,NAME"
        });

        if (itemInfoRes?.rows?.[0]) {
          const iRow = itemInfoRes.rows[0];
          realCode = Array.isArray(iRow) ? String(iRow[0] || mtrlId) : String(iRow.CODE || mtrlId);
          finalDescription = Array.isArray(iRow) ? String(iRow[1] || '') : String(iRow.NAME || '');

          const supabaseProduct = await getProductDetailsFromSupabase(realCode);
          if (supabaseProduct) {
            if (supabaseProduct.description) finalDescription = supabaseProduct.description;
            finalImage = supabaseProduct.imageUrl;
          }
        }
      }

      items.push({
        CODE: realCode,
        DESCRIPTION: finalDescription,
        QUANTITY: qty,
        PRICE: price,
        IMAGE_URL: finalImage
      });
    }

    return { success: true, items };
  } catch (error: any) {
    console.error("❌ fetchOrderDetailsFromSoftOne Error:", error);
    return { success: false, message: error.message, items: [] };
  }
};

/**
 * Στέλνει μια παραγγελία στο SoftOne (Διατηρείται πλήρως η λογική σας)
 */
export const sendOrderToSoftOne = async (order: any) => {
  if (!order || !order.customer_code) {
    return { success: false, message: "Δεν παρέχεται παραγγελία ή κωδικός πελάτη" };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const orderDate = new Date(order.date || order.created_at || new Date());
    const formattedDate = orderDate.toISOString().split('T')[0].replace(/-/g, '');
    const docNumber = order.id || `WEB${Date.now()}`;

    const headerResult = await s1Request({
      service: "insertDoc",
      clientID: auth.clientID,
      appId: "156",
      DOCTYPE: "ΠΑΡΑΣΤΑΤΙΚΟ",
      DOCDATE: formattedDate,
      DOCDUEDATE: formattedDate,
      CUSTOMER: order.customer_code,
      DESCRIPTION: order.notes || `Web order ${docNumber}`,
      AMOUNT: order.total_value || 0
    });

    if (!headerResult.success) {
      throw new Error(`Failed to insert order header: ${headerResult.message}`);
    }

    const docNum = headerResult.docnum || docNumber;

    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        await s1Request({
          service: "insertDocLine",
          clientID: auth.clientID,
          appId: "156",
          DOCTYPE: "ΠΑΡΑΣΤΑΤΙΚΟ",
          DOCNUM: docNum,
          CODE: item.code || item.Code || '',
          DESCRIPTION: item.description || item.Description || '',
          QUANTITY: item.quantity || 1,
          PRICE: item.price || item.Price || 0,
          DISCOUNT: 0
        });
      }
    }

    return {
      success: true,
      message: `Παραγγελία ${docNum} στάλθηκε επιτυχώς στο SoftOne`,
      documentNumber: docNum
    };

  } catch (error: any) {
    console.error("❌ sendOrderToSoftOne Error:", error);
    return { success: false, message: error.message };
  }
};