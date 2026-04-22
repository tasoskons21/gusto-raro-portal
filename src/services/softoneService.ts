import { SoftOneOrder } from '../types';

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
    throw new Error(`SoftOne API Error: ${response.status}`);
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
    // 1. Login
    const login = await s1Request({
      service: "login",
      username: "web",
      password: "gustoraro",
      appId: "157",
      language: "GRE"
    });

    if (!login.success) throw new Error("SoftOne Login Failed");

    // 2. Authenticate
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

    return auth;
  } catch (error) {
    console.error("❌ SoftOne Auth Error:", error);
    return null;
  }
};

/**
 * Ανακτά το ιστορικό παραγγελιών
 */
export const fetchOrderHistoryFromSoftOne = async (customerCode?: string, daysBack: number = 30) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", orders: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    console.log(`🔍 Αναζήτηση Τιμολογίων (7062) τελευταίων ${daysBack} ημερών για: ${customerCode}`);

    /**
     * SQL Query:
     * 1. Φιλτράρουμε τη σειρά 7062.
     * 2. Φιλτράρουμε τις τελευταίες 30 ημέρες (GETDATE() - 30).
     * 3. Ταξινομούμε DESC (Φθίνουσα σειρά) για να είναι το πιο πρόσφατο πρώτο.
     */
    const sqlQuery = `
      SELECT 
        f.FINDOC as TRD_AAA, 
        f.TRNDATE as TRD_DATE, 
        f.FINCODE as TRD_CODE, 
        t.NAME as TRD_NAME, 
        t.AFM as TRD_AFM, 
        f.SUMAMNT as TOTAL_VALUE,
        'ΤΙΜΟΛΟΓΙΟ' as TRD_TYPE_DESC
      FROM FINDOC f 
      INNER JOIN TRDR t ON f.TRDR = t.TRDR 
      WHERE t.CODE = '${customerCode}' 
      AND f.SERIES = 7062 
      AND f.TRNDATE > GETDATE() - ${daysBack}
      ORDER BY f.TRNDATE DESC`;

    let result = await s1Request({
      service: "execSQL",
      clientID: auth.clientID,
      appId: "156",
      sql: sqlQuery
    });

    let rows: any[] = [];

    if (result && result.success !== false) {
      rows = result.rows || result.data || (Array.isArray(result) ? result : []);
    }
    else {
      console.warn("⚠️ Το execSQL απέτυχε, δοκιμή με selectorFields...");

      const selectorRes = await s1Request({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "156",
        TABLENAME: "SALDOC",
        KEYNAME: "SERIES",
        KEYVALUE: "7062",
        RESULTFIELDS: "FINCODE,SUMAMNT,TRNDATE,TRDR",
        OBJECTPARAMS: { "BGMOBILECHECK": "0" }
      });

      const allRows = Array.isArray(selectorRes) ? selectorRes : (selectorRes?.rows || []);

      const custRes = await s1Request({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "156",
        TABLENAME: "CUSTOMER",
        KEYNAME: "CODE",
        KEYVALUE: customerCode,
        RESULTFIELDS: "TRDR"
      });

      let targetTrdr = null;
      const cRows = Array.isArray(custRes) ? custRes : (custRes?.rows || []);
      if (cRows.length > 0) {
        const firstRow = cRows[0];
        targetTrdr = Array.isArray(firstRow) ? String(firstRow[0]) : String(firstRow.TRDR || '');
      }

      if (targetTrdr) {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - daysBack);

        rows = allRows
          .filter((r: any) => {
            const rTrdr = Array.isArray(r) ? String(r[3]) : String(r.TRDR || '');
            const rDateStr = Array.isArray(r) ? String(r[2]) : String(r.TRNDATE || '');
            const rDate = new Date(rDateStr);
            return rTrdr.trim() === targetTrdr?.trim() && rDate >= limitDate;
          })
          // Χειροκίνητη ταξινόμηση στο fallback για σιγουριά
          .sort((a: any, b: any) => {
            const dateA = new Date(Array.isArray(a) ? a[2] : a.TRNDATE).getTime();
            const dateB = new Date(Array.isArray(b) ? b[2] : b.TRNDATE).getTime();
            return dateB - dateA;
          })
          .map((r: any) => ({
            TRD_AAA: Array.isArray(r) ? String(r[0]) : String(r.FINCODE || ''),
            TRD_DATE: Array.isArray(r) ? String(r[2]).split(' ')[0] : String(r.TRNDATE || '').split(' ')[0],
            TRD_CODE: Array.isArray(r) ? String(r[0]) : String(r.FINCODE || ''),
            TOTAL_VALUE: Array.isArray(r) ? Number(r[1]) : Number(r.SUMAMNT || 0),
            TRD_TYPE_DESC: 'ΤΙΜΟΛΟΓΙΟ'
          }));
      }
    }

    return {
      success: true,
      orders: rows.map((r: any) => ({
        TRD_AAA: String(r.TRD_AAA || r[0] || ''),
        TRD_DATE: String(r.TRD_DATE || r[1] || '').split(' ')[0],
        TRD_CODE: String(r.TRD_CODE || r[2] || ''),
        TRD_NAME: String(r.TRD_NAME || r[3] || ''),
        TRD_AFM: String(r.TRD_AFM || r[4] || ''),
        TOTAL_VALUE: Number(r.TOTAL_VALUE || r[5] || r.SUMAMNT || 0),
        TRD_TYPE_DESC: String(r.TRD_TYPE_DESC || 'ΤΙΜΟΛΟΓΙΟ')
      }))
    };

  } catch (error: any) {
    console.error("❌ fetchOrderHistory Error:", error);
    return { success: false, message: error.message, orders: [] };
  }
};

/**
 * Ανακτά τις γραμμές (είδη) μιας παραγγελίας
 */
export const fetchOrderDetailsFromSoftOne = async (trdAAA: string) => {
  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const sql = `SELECT i.CODE, i.NAME, l.QTY1, l.PRICE FROM MTRLINES l INNER JOIN MTRL i ON l.MTRL = i.MTRL WHERE l.FINDOC = ${trdAAA} AND l.MODULE = 13 AND l.QTY1 <> 0`;

    const result = await s1Request({
      service: "execSQL",
      clientID: auth.clientID,
      appId: "156",
      sql: sql
    });

    let rows = result.rows || result || [];

    if (!result || result.success === false) {
      const selectorRes = await s1Request({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "156",
        TABLENAME: "ITELINES",
        KEYNAME: "FINDOC",
        KEYVALUE: trdAAA,
        RESULTFIELDS: "MTRL_ITEM_CODE,MTRL_ITEM_NAME,QTY1,PRICE"
      });
      rows = selectorRes.rows || selectorRes || [];
    }

    return {
      success: true,
      items: rows.map((r: any) => ({
        CODE: Array.isArray(r) ? String(r[0]) : String(r.CODE || r.MTRL_ITEM_CODE || ''),
        DESCRIPTION: Array.isArray(r) ? String(r[1]) : String(r.NAME || r.MTRL_ITEM_NAME || ''),
        QUANTITY: Array.isArray(r) ? Number(r[2]) : Number(r.QTY1 || 0),
        PRICE: Array.isArray(r) ? Number(r[3]) : Number(r.PRICE || 0)
      }))
    };
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

    // Insert document header
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