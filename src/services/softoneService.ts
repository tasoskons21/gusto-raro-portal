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

interface SoftOneSelectorPayload extends Record<string, unknown> {
  service: string;
  clientID: string;
  appId: string;
  TABLENAME: string;
  KEYNAME: string;
  KEYVALUE: string;
  RESULTFIELDS: string;
}

interface SoftOneSetDataPayload extends Record<string, unknown> {
  service: string;
  clientID: string;
  appId: string;
  object: string;
  KEY: string;
  data: Record<string, unknown>;
}

interface SoftOneOrderPayload {
  customer_code: string;
  items: { code: string; quantity: number }[];
  date?: string;
  created_at?: string;
  notes?: string;
}

interface SoftOneAuthResponse {
  success: boolean;
  sessionToken?: string;
  clientID?: string;
}

const s1Request = async <T>(payload: SoftOneSelectorPayload | SoftOneSetDataPayload): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(S1_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SoftOne API Error: ${response.status} - ${errorText}`);
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1253');
    const text = decoder.decode(buffer);

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Invalid JSON response from SoftOne");
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`SoftOne API timeout after 10 seconds for service: ${(payload as any).service}`);
    }
    throw error;
  }
};

let authCache: { clientID: string; fetchedAt: number } | null = null;
const AUTH_CACHE_TTL_MS = 5 * 60 * 1000;

export const getSoftOneAuth = async () => {
  const now = Date.now();
  if (authCache && now - authCache.fetchedAt < AUTH_CACHE_TTL_MS) {
    return { clientID: authCache.clientID };
  }

  try {
    const login = await s1Request<{ success: boolean; clientID: string }>({
      service: "login",
      username: "web",
      password: "gustoraro",
      appId: "157",
      language: "GRE",
      clientID: "",
      TABLENAME: "",
      KEYNAME: "",
      KEYVALUE: "",
      RESULTFIELDS: ""
    });

    if (!login.success) throw new Error("SoftOne Login Failed");

    const auth = await s1Request<SoftOneAuthResponse>({
      service: "authenticate",
      clientID: login.clientID,
      appId: "157",
      company: "500",
      branch: "1000",
      module: "0",
      refId: "1",
      userId: "1",
      TABLENAME: "",
      KEYNAME: "",
      KEYVALUE: "",
      RESULTFIELDS: ""
    });

    if (!auth.success) throw new Error("SoftOne Auth Failed");

    authCache = {
      clientID: auth.sessionToken || auth.clientID || login.clientID,
      fetchedAt: now
    };

    return { clientID: authCache.clientID };
  } catch {
    return null;
  }
};

interface SoftOneSelectorResult {
  rows?: unknown[];
}

const getSelectorField = <T>(res: SoftOneSelectorResult | undefined, index: number): T | null => {
  if (!res?.rows?.[0]) return null;
  const row = res.rows[0];
  if (Array.isArray(row)) return (row as T[])[index] ?? null;
  return (row as Record<string, T>)?.[Object.keys(row)[index]] ?? null;
};

const getArrayValue = <T>(row: unknown, index: number, fallback: T): T => {
  if (Array.isArray(row)) return (row as T[])[index] ?? fallback;
  return fallback;
};

const getObjectValue = <T>(row: unknown, key: string, fallback: T): T => {
  if (row && typeof row === 'object' && key in (row as Record<string, unknown>)) {
    return (row as Record<string, T>)[key] ?? fallback;
  }
  return fallback;
};

export const fetchOrderHistoryFromSoftOne = async (customerCode?: string, daysBack: number = 30) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", orders: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const custRes = await s1Request<SoftOneSelectorResult>({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: customerCode,
      RESULTFIELDS: "TRDR"
    });

    const targetTrdr = getSelectorField<string>(custRes, 0) ?? getObjectValue<string>(custRes?.rows?.[0], 'TRDR', null);
    if (!targetTrdr) {
      return { success: false, message: "Δεν βρέθηκε πελάτης", orders: [] };
    }

    const selectorRes = await s1Request<SoftOneSelectorResult>({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "SALDOC",
      KEYNAME: "TRDR",
      KEYVALUE: targetTrdr,
      RESULTFIELDS: "FINDOC,FINCODE,TRNDATE,SUMAMNT"
    });

    const rows = selectorRes?.rows || [];
    const ordersList: SoftOneOrder[] = [];

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - daysBack);

    for (const r of rows) {
      const findoc = getArrayValue<string>(r, 0, '') || getObjectValue<string>(r, 'FINDOC', '');
      const fincode = getArrayValue<string>(r, 1, '') || getObjectValue<string>(r, 'FINCODE', '');
      const dateStr = getArrayValue<string>(r, 2, '') || getObjectValue<string>(r, 'TRNDATE', '');
      const total = getArrayValue<number>(r, 3, 0) || getObjectValue<number>(r, 'SUMAMNT', 0);

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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message, orders: [] };
  }
};

export const fetchOrderDetailsFromSoftOne = async (trdAAA: string) => {
  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const linesRes = await s1Request<SoftOneSelectorResult>({
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

    const softonePromises = rows.map(async (r: unknown) => {
      const mtrlId = getArrayValue<string>(r, 0, '') || getObjectValue<string>(r, 'MTRL', '');
      const qty = getArrayValue<number>(r, 1, 0) || getObjectValue<number>(r, 'QTY1', 0);
      const price = getArrayValue<number>(r, 2, 0) || getObjectValue<number>(r, 'PRICE', 0);
      const discount = getArrayValue<number>(r, 3, 0) || getObjectValue<number>(r, 'DISC1PRC', 0);

      let realCode = mtrlId;
      let tempDescription = `Προϊόν ${mtrlId}`;

      if (mtrlId) {
        const itemInfoRes = await s1Request<SoftOneSelectorResult>({
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
          realCode = getArrayValue<string>(iRow, 0, mtrlId) || getObjectValue<string>(iRow, 'CODE', mtrlId);
          tempDescription = getArrayValue<string>(iRow, 1, tempDescription) || getObjectValue<string>(iRow, 'NAME', tempDescription);
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
      .in('Code', allCodes) as { data: (Pick<import('../types').Product, 'Code' | 'Description' | 'ImageUrl'>)[] | null, error: unknown };

    if (sbError) {
      console.error('Supabase bulk fetch error:', sbError);
    }

    const finalItems = localItems.map((s1Item) => {
      const matchedProduct = supabaseProducts?.find(
        (sp) => String(sp.Code).trim().toLowerCase() === String(s1Item.CODE).toLowerCase()
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message, items: [] };
  }
};

export const fetchProductPriceHistoryFromSoftOne = async (customerCode?: string, daysBack: number = 365) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", priceHistory: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const custRes = await s1Request<SoftOneSelectorResult>({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: customerCode,
      RESULTFIELDS: "TRDR"
    });

    const targetTrdr = getSelectorField<string>(custRes, 0) ?? getObjectValue<string>(custRes?.rows?.[0], 'TRDR', null);
    if (!targetTrdr) {
      return { success: false, message: "Δεν βρέθηκε πελάτης", priceHistory: [] };
    }

    const selectorRes = await s1Request<SoftOneSelectorResult>({
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
      const orderId = getArrayValue<string>(orderRow, 0, '') || getObjectValue<string>(orderRow, 'FINDOC', '');
      const orderDate = getArrayValue<string>(orderRow, 1, '') || getObjectValue<string>(orderRow, 'TRNDATE', '');

      if (!orderId || !orderDate) continue;

      const rDate = new Date(String(orderDate).split(' ')[0]);
      if (rDate < limitDate) continue;

      const linesRes = await s1Request<SoftOneSelectorResult>({
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
        const mtrlId = getArrayValue<string>(lineRow, 0, '') || getObjectValue<string>(lineRow, 'MTRL', '');
        const price = getArrayValue<number>(lineRow, 2, 0) || getObjectValue<number>(lineRow, 'PRICE', 0);
        const discount = getArrayValue<number>(lineRow, 3, 0) || getObjectValue<number>(lineRow, 'DISC1PRC', 0);

        if (!mtrlId) continue;

        allProductEntries.push({
          mtrlId,
          CODE: mtrlId,
          DESCRIPTION: `Προϊόν ${mtrlId}`,
          PRICE: price,
          DISCOUNT_PERCENT: discount,
          TRD_DATE: String(orderDate).split(' ')[0]
        });
      }
    }

    const softonePromises = allProductEntries.map(async (entry) => {
      const itemInfoRes = await s1Request<SoftOneSelectorResult>({
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
        realCode = getArrayValue<string>(iRow, 0, entry.mtrlId) || getObjectValue<string>(iRow, 'CODE', entry.mtrlId);
        description = getArrayValue<string>(iRow, 1, description) || getObjectValue<string>(iRow, 'NAME', description);
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
      .in('Code', uniqueCodes) as { data: (Pick<import('../types').Product, 'Code' | 'Description' | 'ImageUrl'>)[] | null, error: unknown };

    if (sbError) {
      console.error('Supabase bulk fetch error:', sbError);
    }

    const productMap = new Map<string, { CODE: string; DESCRIPTION: string; PRICE: number; DISCOUNT_PERCENT: number; TRD_DATE: string; IMAGE_URL?: string }>();

    for (const entry of entriesWithCodes) {
      const matchedProduct = supabaseProducts?.find(
        (sp) => String(sp.Code).trim().toLowerCase() === String(entry.CODE).toLowerCase()
      );

      const finalEntry = {
        ...entry,
        DESCRIPTION: matchedProduct?.Description || entry.DESCRIPTION,
        IMAGE_URL: matchedProduct?.ImageUrl || undefined
      };

      const existing = productMap.get(finalEntry.CODE);
      if (!existing) {
        productMap.set(finalEntry.CODE, finalEntry);
      } else {
        const existingDate = new Date(existing.TRD_DATE);
        const entryDate = new Date(finalEntry.TRD_DATE);
        if (entryDate > existingDate) {
          productMap.set(finalEntry.CODE, finalEntry);
        }
      }
    }

    const priceHistory = Array.from(productMap.values());
    priceHistory.sort((a, b) => a.CODE.localeCompare(b.CODE));

    return { success: true, priceHistory };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message, priceHistory: [] };
  }
};

export const fetchBranchesForCustomer = async (customerCode?: string, address?: string) => {
  if (!customerCode) {
    return { success: false, message: "Δεν επιλέχθηκε πελάτης", branches: [] };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const custRes = await s1Request<SoftOneSelectorResult>({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: customerCode,
      RESULTFIELDS: "TRDR"
    });

    const trdr = getSelectorField<string>(custRes, 0) ?? getObjectValue<string>(custRes?.rows?.[0], 'TRDR', null);
    if (!trdr) {
      return { success: false, message: "Δεν βρέθηκε ο πελάτης", branches: [] };
    }

    const branchesRes = await s1Request<SoftOneSelectorResult>({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "TRDBRANCH",
      KEYNAME: "TRDR",
      KEYVALUE: trdr,
      RESULTFIELDS: "TRDBRANCH,NAME"
    });

    const rows = branchesRes?.rows || [];
    const branches = rows.map((r: unknown) => ({
      id: getArrayValue<number>(r, 0, 0) || getObjectValue<number>(r, 'TRDBRANCH', 0),
      name: getArrayValue<string>(r, 1, '') || getObjectValue<string>(r, 'NAME', '')
    }));

    const words = address ? address.trim().split(/\s+/) : [];
    const streetName = words.length > 1 ? words.slice(0, -1).join(' ') : (words[0] || 'Κεντρικό');
    const headOfficeBranch = { id: 0, name: streetName };
    const allBranches = [headOfficeBranch, ...branches];

    return { success: true, branches: allBranches };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message, branches: [] };
  }
};

export const sendOrderToSoftOne = async (order: SoftOneOrderPayload, branchId?: number | null) => {
  if (!order || !order.customer_code) {
    return { success: false, message: "Δεν παρέχεται παραγγελία ή κωδικός πελάτη" };
  }

  try {
    const auth = await getSoftOneAuth();
    if (!auth) throw new Error("Authentication failed");

    const custRes = await s1Request<SoftOneSelectorResult>({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "CUSTOMER",
      KEYNAME: "CODE",
      KEYVALUE: order.customer_code,
      RESULTFIELDS: "TRDR"
    });

    const trdr = getSelectorField<string>(custRes, 0) ?? getObjectValue<string>(custRes?.rows?.[0], 'TRDR', null);
    if (!trdr) {
      return { success: false, message: "Δεν βρέθηκε ο πελάτης" };
    }
    const trdrId = Number(trdr);

    const mtrlIds: { mtrlId: number; qty: number; discount?: number }[] = [];
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const mtrlPromises = order.items.map(async (item: { code?: string; Code?: string; quantity: number }) => {
        const code = item.code || item.Code || '';
        if (!code) return null;
        const mtrlRes = await s1Request<SoftOneSelectorResult>({
          service: "selectorFields",
          clientID: auth.clientID,
          appId: "157",
          TABLENAME: "MTRL",
          KEYNAME: "CODE",
          KEYVALUE: code,
          RESULTFIELDS: "MTRL"
        });
        const mtrlIdRaw = getSelectorField<string>(mtrlRes, 0) ?? getObjectValue<string>(mtrlRes?.rows?.[0], 'MTRL', null);
        if (mtrlIdRaw) {
          return { mtrlId: Number(mtrlIdRaw), qty: item.quantity || 1 };
        }
        return null;
      });

      const mtrlResults = await Promise.all(mtrlPromises);
      mtrlIds.push(...mtrlResults.filter((item): item is { mtrlId: number; qty: number } => item !== null));

      if (mtrlIds.length === 0) {
        return { success: false, message: "Δεν βρέθηκαν προϊόντα για την παραγγελία" };
      }
    }

    const discounts = new Map<number, { disc: number; date: string }>();
    const neededMtrlIds = mtrlIds.map(l => l.mtrlId);

    const ordersRes = await s1Request<SoftOneSelectorResult>({
      service: "selectorFields",
      clientID: auth.clientID,
      appId: "157",
      TABLENAME: "SALDOC",
      KEYNAME: "TRDR",
      KEYVALUE: String(trdrId),
      RESULTFIELDS: "FINDOC,TRNDATE"
    });

    const orderRows = ordersRes?.rows || [];
    const sortedOrders = orderRows.sort((a: unknown, b: unknown) => {
      const dateA = new Date(getArrayValue<string>(a, 1, '') || getObjectValue<string>(a, 'TRNDATE', ''));
      const dateB = new Date(getArrayValue<string>(b, 1, '') || getObjectValue<string>(b, 'TRNDATE', ''));
      return dateB.getTime() - dateA.getTime();
    });

    const linesPromises = sortedOrders.map((orderRow: unknown) => {
      const orderId = getArrayValue<string>(orderRow, 0, '') || getObjectValue<string>(orderRow, 'FINDOC', '');
      if (!orderId) return Promise.resolve(null);
      return s1Request<SoftOneSelectorResult>({
        service: "selectorFields",
        clientID: auth.clientID,
        appId: "157",
        TABLENAME: "MTRLINES",
        KEYNAME: "FINDOC",
        KEYVALUE: orderId,
        RESULTFIELDS: "MTRL,DISC1PRC"
      }).then((linesRes) => ({ linesRes, orderRow }));
    });

    const linesResults = await Promise.all(linesPromises);

    for (const result of linesResults) {
      if (!result) continue;
      if (discounts.size === neededMtrlIds.length) break;
      const { linesRes, orderRow } = result;
      const lineRows = linesRes?.rows || [];
      for (const lineRow of lineRows) {
        const mtrlId = getArrayValue<number>(lineRow, 0, 0) || getObjectValue<number>(lineRow, 'MTRL', 0);
        const disc = getArrayValue<number>(lineRow, 1, 0) || getObjectValue<number>(lineRow, 'DISC1PRC', 0);
        if (!isNaN(mtrlId) && neededMtrlIds.includes(mtrlId) && !discounts.has(mtrlId)) {
          discounts.set(mtrlId, {
            disc,
            date: getArrayValue<string>(orderRow, 1, '') || getObjectValue<string>(orderRow, 'TRNDATE', '')
          });
        }
      }
    }

    mtrlIds.forEach(l => {
      l.discount = discounts.get(l.mtrlId)?.disc || 0;
    });

    const orderDate = new Date(order.date || order.created_at || new Date());
    const formattedDate = orderDate.toISOString().split('T')[0].replace(/-/g, '/');

    const saldocData: Record<string, unknown> = {
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

    const setDataPayload: SoftOneSetDataPayload = {
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

    const result = await s1Request<{ success: boolean; data?: { FINDOC?: string }; docnum?: string }>(setDataPayload);

    if (!result.success) {
      throw new Error(`Failed to save order: ${JSON.stringify(result)}`);
    }

    const docNum = result.data?.FINDOC || result.docnum || "saved";

    return {
      success: true,
      message: `Παραγγελία ${docNum} στάλθηκε επιτυχώς στο SoftOne`,
      documentNumber: String(docNum)
    };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message };
  }
};
