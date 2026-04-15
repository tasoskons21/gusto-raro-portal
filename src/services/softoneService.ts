export interface SoftOneOrder {
  TRD_AAA: string;
  TRD_DATE: string;
  TRD_CODE: string;
  TRD_NAME: string;
  TRD_AFM: string;
  TOTAL_VALUE: number;
  TRD_TYPE_DESC: string;
}

export const fetchOrderHistoryFromSoftOne = async (customerCode?: string, daysBack: number = 30) => {
  // Έλεγχος αν υπάρχει κωδικός
  if (!customerCode) {
    console.warn("⚠️ SoftOne History: No customerCode provided.");
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", orders: [] };
  }

  const S1_URL = "https://gustoraro.oncloud.gr/s1services";
  
  try {
    const s1Request = async (payload: any) => {
      const response = await fetch(S1_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('windows-1253'); // Για σωστά Ελληνικά από SoftOne
      const text = decoder.decode(buffer);
      return JSON.parse(text);
    };

    // 1. Login
    const login = await s1Request({ 
      SERVICE: "login", 
      USERNAME: "web", 
      PASSWORD: "gustoraro", 
      APPID: "157", 
      LANGUAGE: "GRE" 
    });
    
    if (!login.success) throw new Error("SoftOne Login Failed");

    // 2. Authenticate
    const auth = await s1Request({ 
      service: "authenticate", 
      clientID: login.clientID, 
      appId: "156", 
      COMPANY: "500", 
      BRANCH: "1000", 
      MODULE: "0", 
      REFID: "1", 
      USERID: "1", 
      WEBACCOUNT: "1" 
    });

    if (!auth.success) throw new Error("SoftOne Auth Failed");

    // 3. SQL Query 
    // Χρησιμοποιούμε SODTYPE=13 για Πωλήσεις. 
    // Αν θέλεις να περιορίσεις τις ημέρες, πρόσθεσε στο WHERE: 
    // AND f.TRNDATE >= TO_CHAR(CURRENT_DATE - ${daysBack}, 'YYYYMMDD')
  const sql = `
      SELECT 
        f.SALDOC as TRD_AAA, 
        f.TRNDATE as TRD_DATE, 
        f.FINCODE as TRD_CODE, 
        t.NAME as TRD_NAME, 
        t.AFM as TRD_AFM, 
        f.SUMAMNT as TOTAL_VALUE,
        'ΠΑΡΑΣΤΑΤΙΚΟ' as TRD_TYPE_DESC
      FROM SALDOC f
      INNER JOIN TRDR t ON f.CUSTOMER = t.TRDR
      WHERE t.CODE = '${customerCode}'
      ORDER BY f.TRNDATE DESC
    `;

    console.log(`🔍 Αναζήτηση ιστορικού για: ${customerCode}`);

    const result = await s1Request({
      service: "execSQL",
      clientID: auth.clientID,
      appId: "156",
      SQL: sql
    });

    // Το SoftOne επιστρέφει τα δεδομένα στο result.rows
    const rows = result.rows || [];
    
    if (rows.length === 0) {
      console.log("ℹ️ SoftOne: Δεν βρέθηκαν παραγγελίες για αυτόν τον κωδικό.");
    }

    return { 
      success: true, 
      orders: rows.map((r: any) => ({
        TRD_AAA: String(r.TRD_AAA || r[0] || ''),
        TRD_DATE: String(r.TRD_DATE || r[1] || ''),
        TRD_CODE: String(r.TRD_CODE || r[2] || ''),
        TRD_NAME: String(r.TRD_NAME || r[3] || ''),
        TRD_AFM: String(r.TRD_AFM || r[4] || ''),
        TOTAL_VALUE: Number(r.TOTAL_VALUE || r[5] || 0),
        TRD_TYPE_DESC: String(r.TRD_TYPE_DESC || r[6] || 'Παραστατικό')
      }))
    };

  } catch (error: any) {
    console.error("❌ SoftOne Service Error:", error.message);
    return { success: false, message: error.message, orders: [] };
  }
};