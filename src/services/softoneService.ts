import { SoftOneOrder } from '../types';
import { supabase } from '../lib/supabase';

const S1_URL = "/api/softone";

interface SoftOneLineItem {
  CODE: string;
  DESCRIPTION: string;
  QUANTITY: number;
  PRICE: number;
  DISCOUNT_PERCENT: number;
}

interface SupabaseProductRow {
  Code: string;
  Description: string;
  ImageUrl: string | null;
}

const s1Request = async (payload: any) => {
  console.log(`s1Request starting for service: ${payload.service}`);

  try {
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
      const result = JSON.parse(text);
      console.log(`s1Request finished for service: ${payload.service}`);
      return result;
    } catch (e) {
      console.error("❌ JSON Parse Error:", text);
      throw new Error("Invalid JSON response from SoftOne");
    }
  } catch (error: any) {
    throw error;
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
      appId: "157",
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
      appId: "157",
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
      appId: "157",
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

export const fetchOrderDetailsFromSoftOne = async (trdAAA: string) => {
  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const linesRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "MTRLINES",
      KEYNAME: "FINDOC",
      KEYVALUE: trdAAA,
      RESULTFIELDS: "MTRL,QTY1,PRICE,DISC1PRC"
    });

    const rows = linesRes?.rows || [];
    if (rows.length === 0) return { success: true, items: [] };

    const softonePromises = rows.map(async (r: any) => {
      const mtrlId = Array.isArray(r) ? String(r[0] || '') : String(r.MTRL || '');
      const qty = Array.isArray(r) ? Number(r[1] || 0) : Number(r.QTY1 || 0);
      const price = Array.isArray(r) ? Number(r[2] || 0) : Number(r.PRICE || 0);
      const discount = Array.isArray(r) ? Number(r[3] || 0) : Number(r.DISC1PRC || 0);

      let realCode = mtrlId;
      let tempDescription = `Προϊόν ${mtrlId}`;

      if (mtrlId) {
        const itemInfoRes = await s1Request({
          service: "selectorFields",
          clientID: auth.clientID,
          appId: "157",
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
        PRICE: price,
        DISCOUNT_PERCENT: discount
      };
    });

    const localItems: SoftOneLineItem[] = await Promise.all(softonePromises);

    const allCodes = localItems.map(item => item.CODE).filter(Boolean);

    const { data: supabaseProducts, error: sbError } = await supabase
      .from('products')
      .select('Code, Description, ImageUrl')
      .in('Code', allCodes) as { data: SupabaseProductRow[] | null, error: any };

    if (sbError) {
      console.error('⚠️ Supabase bulk fetch error:', sbError);
    }

    const finalItems = localItems.map((s1Item) => {
      const matchedProduct = supabaseProducts?.find(
        (sp: SupabaseProductRow) => String(sp.Code).trim().toLowerCase() === String(s1Item.CODE).toLowerCase()
      );

      return {
        CODE: s1Item.CODE,
        DESCRIPTION: matchedProduct?.Description || s1Item.DESCRIPTION,
        QUANTITY: s1Item.QUANTITY,
        PRICE: s1Item.PRICE,
        DISCOUNT_PERCENT: s1Item.DISCOUNT_PERCENT,
        IMAGE_URL: matchedProduct?.ImageUrl || null
      };
    });

    return { success: true, items: finalItems };

  } catch (error: any) {
    console.error("❌ fetchOrderDetailsFromSoftOne Error:", error);
    return { success: false, message: error.message, items: [] };
  }
};

export const fetchProductPriceHistoryFromSoftOne = async (customerCode?: string, daysBack: number = 365) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", priceHistory: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const custRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: customerCode,
      RESULTFIELDS: "TRDR"
    });

    const targetTrdr = custRes?.rows?.[0] ? (Array.isArray(custRes.rows[0]) ? custRes.rows[0][0] : custRes.rows[0].TRDR) : null;
    if (!targetTrdr) {
      return { success: false, message: "Δεν βρέθηκε πελάτης", priceHistory: [] };
    }

    const selectorRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "SALDOC",
      KEYNAME: "TRDR",
      KEYVALUE: targetTrdr,
      RESULTFIELDS: "FINDOC,TRNDATE"
    });

    const orderRows = selectorRes?.rows || [];
    if (orderRows.length === 0) {
      return { success: true, priceHistory: [] };
    }

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - daysBack);

    const allProductEntries: { mtrlId: string; CODE: string; DESCRIPTION: string; PRICE: number; DISCOUNT_PERCENT: number; TRD_DATE: string }[] = [];

    for (const orderRow of orderRows) {
      const orderId = Array.isArray(orderRow) ? orderRow[0] : orderRow.FINDOC;
      const orderDate = Array.isArray(orderRow) ? orderRow[1] : orderRow.TRNDATE;

      if (!orderId || !orderDate) continue;

      const rDate = new Date(String(orderDate).split(' ')[0]);
      if (rDate < limitDate) continue;

      const linesRes = await s1Request({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "157",
        TABLENAME: "MTRLINES",
        KEYNAME: "FINDOC",
        KEYVALUE: orderId,
        RESULTFIELDS: "MTRL,QTY1,PRICE,DISC1PRC"
      });

      const lineRows = linesRes?.rows || [];

      for (const lineRow of lineRows) {
        const mtrlId = Array.isArray(lineRow) ? String(lineRow[0] || '') : String(lineRow.MTRL || '');
        const price = Array.isArray(lineRow) ? Number(lineRow[2] || 0) : Number(lineRow.PRICE || 0);
        const discount = Array.isArray(lineRow) ? Number(lineRow[3] || 0) : Number(lineRow.DISC1PRC || 0);

        if (!mtrlId) continue;

        allProductEntries.push({
          mtrlId: mtrlId,
          CODE: mtrlId,
          DESCRIPTION: `Προϊόν ${mtrlId}`,
          PRICE: price,
          DISCOUNT_PERCENT: discount,
          TRD_DATE: String(orderDate).split(' ')[0]
        });
      }
    }

    const softonePromises = allProductEntries.map(async (entry) => {
      const itemInfoRes = await s1Request({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "157",
        TABLENAME: "MTRL",
        KEYNAME: "MTRL",
        KEYVALUE: entry.mtrlId,
        RESULTFIELDS: "CODE,NAME"
      });

      let realCode = entry.mtrlId;
      let description = `Προϊόν ${entry.mtrlId}`;

      if (itemInfoRes?.rows?.[0]) {
        const iRow = itemInfoRes.rows[0];
        realCode = Array.isArray(iRow) ? String(iRow[0] || entry.mtrlId) : String(iRow.CODE || entry.mtrlId);
        description = Array.isArray(iRow) ? String(iRow[1] || description) : String(iRow.NAME || description);
      }

      return {
        ...entry,
        CODE: realCode.trim(),
        DESCRIPTION: description
      };
    });

    const entriesWithCodes = await Promise.all(softonePromises);

    const uniqueCodes = [...new Set(entriesWithCodes.map(e => e.CODE))];

    const { data: supabaseProducts, error: sbError } = await supabase
      .from('products')
      .select('Code, Description, ImageUrl')
      .in('Code', uniqueCodes) as { data: SupabaseProductRow[] | null, error: any };

    if (sbError) {
      console.error('⚠️ Supabase bulk fetch error:', sbError);
    }

    const productMap = new Map<string, { CODE: string; DESCRIPTION: string; PRICE: number; DISCOUNT_PERCENT: number; TRD_DATE: string; IMAGE_URL?: string }>();

    for (const entry of entriesWithCodes) {
      const matchedProduct = supabaseProducts?.find(
        (sp: SupabaseProductRow) => String(sp.Code).trim().toLowerCase() === String(entry.CODE).toLowerCase()
      );

      const finalEntry = {
        ...entry,
        DESCRIPTION: matchedProduct?.Description || entry.DESCRIPTION,
        IMAGE_URL: matchedProduct?.ImageUrl || undefined
      };

      delete (finalEntry as any).mtrlId;

      const existing = productMap.get(finalEntry.CODE);
      if (!existing) {
        productMap.set(finalEntry.CODE, finalEntry as any);
      } else {
        const existingDate = new Date(existing.TRD_DATE);
        const entryDate = new Date(finalEntry.TRD_DATE);
        if (entryDate > existingDate) {
          productMap.set(finalEntry.CODE, finalEntry as any);
        }
      }
    }

    const priceHistory = Array.from(productMap.values());
    priceHistory.sort((a, b) => a.CODE.localeCompare(b.CODE));

    return { success: true, priceHistory };

  } catch (error: any) {
    console.error("❌ fetchProductPriceHistoryFromSoftOne Error:", error);
    return { success: false, message: error.message, priceHistory: [] };
  }
};

export const fetchBranchesForCustomer = async (customerCode?: string, address?: string) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", branches: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const custRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: customerCode,
      RESULTFIELDS: "TRDR"
    });

    const trdr = custRes?.rows?.[0] ? (Array.isArray(custRes.rows[0]) ? custRes.rows[0][0] : custRes.rows[0].TRDR) : null;
    if (!trdr) {
      return { success: false, message: "Δεν βρέθηκε ο πελάτης", branches: [] };
    }

    const branchesRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "TRDBRANCH",
      KEYNAME: "TRDR",
      KEYVALUE: trdr,
      RESULTFIELDS: "TRDBRANCH,NAME"
    });

    const rows = branchesRes?.rows || [];
    const branches = rows.map((r: any) => ({
      id: Array.isArray(r) ? Number(r[0]) : Number(r.TRDBRANCH),
      name: Array.isArray(r) ? String(r[1] || '') : String(r.NAME || '')
    }));

    const words = address ? address.trim().split(/\s+/) : [];
    const streetName = words.length > 1 ? words.slice(0, -1).join(' ') : (words[0] || 'Κεντρικό');
    const headOfficeBranch = { id: 0, name: streetName };
    const allBranches = [headOfficeBranch, ...branches];

    return { success: true, branches: allBranches };
  } catch (error: any) {
    console.error("❌ fetchBranchesForCustomer Error:", error);
    return { success: false, message: error.message, branches: [] };
  }
};

export const sendOrderToSoftOne = async (order: any, branchId?: number | null) => {
  if (!order || !order.customer_code) {
    return { success: false, message: "Δεν παρέχεται παραγγελία ή κωδικός πελάτη" };
  }

  try {
    console.log("Starting authentication...");
    const auth = await getSoftOneAuth();
    console.log("Authentication finished...");
    if (!auth) throw new Error("Authentication failed");

    console.log("Starting customer lookup...");
    const custRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: order.customer_code,
      RESULTFIELDS: "TRDR"
    });
    console.log("Customer lookup finished...");

    const trdr = custRes?.rows?.[0] ? (Array.isArray(custRes.rows[0]) ? custRes.rows[0][0] : custRes.rows[0].TRDR) : null;
    if (!trdr) {
      return { success: false, message: "Δεν βρέθηκε ο πελάτης" };
    }
    const trdrId = Number(trdr);

    console.log("TRDR check:", trdrId, "SERIES: 7022");

    const mtrlIds: { mtrlId: number; qty: number; discount?: number }[] = [];
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      console.log("Starting item search...");
      const mtrlPromises = order.items.map(async (item: any) => {
        try {
          const code = item.code || item.Code || '';
          if (!code) return null;
          const mtrlRes = await s1Request({
            service: "selectorFields",
            clientID: auth.clientID,
            appId: "157",
            TABLENAME: "MTRL",
            KEYNAME: "CODE",
            KEYVALUE: code,
            RESULTFIELDS: "MTRL"
          });
          const mtrlIdRaw = mtrlRes?.rows?.[0] ? (Array.isArray(mtrlRes.rows[0]) ? mtrlRes.rows[0][0] : mtrlRes.rows[0].MTRL) : null;
          if (mtrlIdRaw) {
            return { mtrlId: Number(mtrlIdRaw), qty: item.quantity || 1 };
          }
          console.error(`MTRL not found for code: ${code}`);
          return null;
        } catch (mtrlError: any) {
          console.error(`Error searching MTRL: ${mtrlError?.message || mtrlError}`);
          return null;
        }
      });
      const mtrlResults = await Promise.all(mtrlPromises);
      console.log("Item search finished...");
      mtrlIds.push(...mtrlResults.filter(Boolean));
      if (mtrlIds.length === 0) {
        return { success: false, message: "Δεν βρέθηκαν προϊόντα για την παραγγελία" };
      }
    }

    const discounts = new Map<number, { disc: number; date: string }>();
    const neededMtrlIds = mtrlIds.map(l => l.mtrlId);

    const ordersRes = await s1Request({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "SALDOC",
      KEYNAME: "TRDR",
      KEYVALUE: String(trdrId),
      RESULTFIELDS: "FINDOC,TRNDATE"
    });

    const orderRows = ordersRes?.rows || [];
    const sortedOrders = orderRows.sort((a: any, b: any) => {
      const dateA = new Date(Array.isArray(a) ? a[1] : a.TRNDATE);
      const dateB = new Date(Array.isArray(b) ? b[1] : b.TRNDATE);
      return dateB.getTime() - dateA.getTime();
    });

    for (const orderRow of sortedOrders) {
      if (discounts.size === neededMtrlIds.length) break;
      const orderId = Array.isArray(orderRow) ? orderRow[0] : orderRow.FINDOC;
      if (!orderId) continue;
      const linesRes = await s1Request({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "157",
        TABLENAME: "MTRLINES",
        KEYNAME: "FINDOC",
        KEYVALUE: orderId,
        RESULTFIELDS: "MTRL,DISC1PRC"
      });
      const lineRows = linesRes?.rows || [];
      for (const lineRow of lineRows) {
        const mtrlId = Array.isArray(lineRow) ? Number(lineRow[0]) : Number(lineRow.MTRL);
        const disc = Array.isArray(lineRow) ? Number(lineRow[1] || 0) : Number(lineRow.DISC1PRC || 0);
        if (!isNaN(mtrlId) && neededMtrlIds.includes(mtrlId) && !discounts.has(mtrlId)) {
          discounts.set(mtrlId, { disc, date: Array.isArray(orderRow) ? String(orderRow[1] || '') : String(orderRow.TRNDATE || '') });
        }
      }
    }

    mtrlIds.forEach(l => {
      l.discount = discounts.get(l.mtrlId)?.disc || 0;
    });

    console.log("Preparing date and payload...");
    const orderDate = new Date(order.date || order.created_at || new Date());
    const formattedDate = orderDate.toISOString().split('T')[0].replace(/-/g, '/');

    const saldocData: any = {
      TRDR: trdrId,
      FINTYPE: 201,
      SERIES: "7022",
      TRNDATE: formattedDate,
      DISDATE: formattedDate,
      WHOUSE: 1,
      SOCRU: 1,
      CURRENCY: 0,
      COMPANY: 500,
      NOTES: order.notes || "",
      REMARKS: order.notes || ""
    };

    if (branchId) {
      saldocData.TRDBRANCH = branchId;
    }

    const setDataPayload: any = {
      service: "setData",
      clientID: auth.clientID,
      appId: "157",
      object: "SALDOC",
      KEY: "",
      data: {
        SALDOC: [saldocData],
        ITELINES: mtrlIds.map((l, index) => ({
          MTRL: l.mtrlId,
          QTY1: l.qty,
          DISC1PRC: l.discount || 0,
          LINENUM: (index + 1) * 1000
        }))
      }
    };

    console.log("setData payload:", JSON.stringify(setDataPayload, null, 2));

    console.log("Starting setData...");
    const result = await s1Request(setDataPayload);
    console.log("setData response received:", JSON.stringify(result));

    if (!result.success) {
      throw new Error(`Failed to save order: ${JSON.stringify(result)}`);
    }

    const docNum = result.data?.FINDOC || result.docnum || "saved";

    return {
      success: true,
      message: `Παραγγελία ${docNum} στάλθηκε επιτυχώς στο SoftOne`,
      documentNumber: String(docNum)
    };

  } catch (error: any) {
    console.error("❌ sendOrderToSoftOne Error:", error);
    return { success: false, message: error.message };
  }
};