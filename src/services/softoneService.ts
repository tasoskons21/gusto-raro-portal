import { SoftOneOrder } from '../types';
import { supabase } from '../lib/supabase';

const S1_URL = "/api/softone";

// Interfaces για TypeScript
interface SoftOneLineItem {
  CODE: string;
  QUANTITY: number;
  PRICE: number;
}

interface SupabaseProductRow {
  Code: string;
  Description: string;
  ImageUrl: string | null;
}

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
 * 1. Φέρνει ΜΟΝΟ τα βασικά στοιχεία των τιμολογίων (Αξία, Ημερομηνία, Αριθμό) - Σφαίρα!
 */
export const fetchOrderHistoryFromSoftOne = async (customerCode?: string, daysBack: number = 30) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", orders: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

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
      return { success: false, message: "Δεν βρέθηκε πελάτης", orders: [] };
    }

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
    const ordersList = [];

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

      ordersList.push({
        TRD_AAA: String(findoc),
        TRD_DATE: String(dateStr).split(' ')[0],
        TRD_CODE: String(fincode),
        TRD_NAME: "",
        TRD_AFM: "",
        TOTAL_VALUE: Number(total || 0),
        TRD_TYPE_DESC: 'ΤΙΜΟΛΟΓΙΟ'
      });
    }

    ordersList.sort((a, b) => new Date(b.TRD_DATE).getTime() - new Date(a.TRD_DATE).getTime());
    return { success: true, orders: ordersList };

  } catch (error: any) {
    console.error("❌ fetchOrderHistory Error:", error);
    return { success: false, message: error.message, orders: [] };
  }
};

/**
 * 2. ON-DEMAND ΦΟΡΤΩΣΗ (HIGH PERFORMANCE & ΑΠΟΛΥΤΗ ΑΚΡΙΒΕΙΑ)
 * Επιλύει το πρόβλημα των κενών προϊόντων και φέρνει σωστές περιγραφές/φωτογραφίες
 */
export const fetchOrderDetailsFromSoftOne = async (trdAAA: string) => {
  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    // α) Λήψη των γραμμών χρησιμοποιώντας το MTRL (ID είδους) για σιγουριά
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
    if (rows.length === 0) return { success: true, items: [] };

    // β) Παράλληλη μετατροπή των MTRL IDs στους πραγματικούς εμπορικούς Κωδικούς (SoftOne MTRL)
    const softonePromises = rows.map(async (r: any) => {
      const mtrlId = Array.isArray(r) ? String(r[0] || '') : String(r.MTRL || '');
      const qty = Array.isArray(r) ? Number(r[1] || 0) : Number(r.QTY1 || 0);
      const price = Array.isArray(r) ? Number(r[2] || 0) : Number(r.PRICE || 0);

      let realCode = mtrlId;
      let tempDescription = `Προϊόν ${mtrlId}`;

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
          tempDescription = Array.isArray(iRow) ? String(iRow[1] || tempDescription) : String(iRow.NAME || tempDescription);
        }
      }

      return {
        CODE: realCode.trim(),
        DESCRIPTION: tempDescription,
        QUANTITY: qty,
        PRICE: price
      };
    });

    // Εκτέλεση όλων των ερωτημάτων κωδικών SoftOne ταυτόχρονα
    const localItems = await Promise.all(softonePromises);

    // γ) ΜΑΖΙΚΟ QUERY ΣΤΟ SUPABASE (1 ΜΟΝΟ ΚΛΗΣΗ ΓΙΑ ΟΛΑ): Φέρνουμε Φωτογραφίες και Τελικές Περιγραφές
    const allCodes = localItems.map(item => item.CODE).filter(Boolean);

    const { data: supabaseProducts, error: sbError } = await supabase
      .from('products')
      .select('Code, Description, ImageUrl')
      .in('Code', allCodes) as { data: SupabaseProductRow[] | null, error: any };

    if (sbError) {
      console.error('⚠️ Supabase bulk fetch error:', sbError);
    }

    // δ) In-memory merge των σωστών δεδομένων
    const finalItems = localItems.map((s1Item) => {
      const matchedProduct = supabaseProducts?.find(
        (sp: SupabaseProductRow) => String(sp.Code).trim().toLowerCase() === String(s1Item.CODE).toLowerCase()
      );

      return {
        CODE: s1Item.CODE,
        DESCRIPTION: matchedProduct?.Description || s1Item.DESCRIPTION, // Προτεραιότητα στην καθαρή περιγραφή του Supabase
        QUANTITY: s1Item.QUANTITY,
        PRICE: s1Item.PRICE,
        IMAGE_URL: matchedProduct?.ImageUrl || null
      };
    });

    return { success: true, items: finalItems };

  } catch (error: any) {
    console.error("❌ fetchOrderDetailsFromSoftOne Error:", error);
    return { success: false, message: error.message, items: [] };
  }
};

/**
 * Στέλνει μια παραγγελία στο SoftOne
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