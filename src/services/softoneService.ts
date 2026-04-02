const SOFTONE_API_URL = import.meta.env.VITE_SOFTONE_API_URL || '';
const SOFTONE_USERNAME = import.meta.env.VITE_SOFTONE_USERNAME || '';
const SOFTONE_PASSWORD = import.meta.env.VITE_SOFTONE_PASSWORD || '';
const SOFTONE_COMPANY = import.meta.env.VITE_SOFTONE_COMPANY || '1';

interface SoftOneOrderPayload {
  TRD_DOC: {
    TRD_DOC: {
      TRD_SER: string;
      TRD_TYPE: string;
      TRD_CODE: string;
      TRD_DATE: string;
      TRD_AAA: string;
      COMMENTS: string;
    };
    TRD_DOC_ITEMS: Array<{
      MTRL_CODE: string;
      QTY1: number;
      PRICE: number;
      COMMENTS: string;
    }>;
  };
}

async function loginToSoftOne(): Promise<string | null> {
  try {
    const response = await fetch(`${SOFTONE_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: SOFTONE_USERNAME,
        password: SOFTONE_PASSWORD,
        company: SOFTONE_COMPANY,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token || data.sessionId || null;
  } catch (error) {
    console.error('SoftOne login failed:', error);
    return null;
  }
}

export async function sendOrderToSoftOne(order: any): Promise<{ success: boolean; message: string; docNumber?: string }> {
  if (!SOFTONE_API_URL) {
    return {
      success: false,
      message: 'Δεν έχει ρυθμιστεί το SoftOne API URL. Επικοινώνησε με τον διαχειριστή.',
    };
  }

  try {
    const token = await loginToSoftOne();
    if (!token) {
      return {
        success: false,
        message: 'Αποτυχία σύνδεσης στο SoftOne. Έλεγξε τα credentials.',
      };
    }

    const orderDate = new Date(order.created_at || order.date || Date.now());
    const formattedDate = orderDate.toISOString().split('T')[0];

    const payload: SoftOneOrderPayload = {
      TRD_DOC: {
        TRD_DOC: {
          TRD_SER: 'Π.ΠΟΛ',
          TRD_TYPE: '1',
          TRD_CODE: order.customer_code || '',
          TRD_DATE: formattedDate,
          TRD_AAA: '',
          COMMENTS: order.notes || `Παραγγελία από B2B Portal - ${order.customer_name || ''}`,
        },
        TRD_DOC_ITEMS: (order.items || []).map((item: any) => ({
          MTRL_CODE: item.code || '',
          QTY1: item.quantity || 1,
          PRICE: item.price || 0,
          COMMENTS: item.description || '',
        })),
      },
    };

    const response = await fetch(`${SOFTONE_API_URL}/trd_docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const docNumber = result.docNumber || result.TRD_AAA || 'N/A';

    return {
      success: true,
      message: `Η παραγγελία καταχωρήθηκε επιτυχώς στο SoftOne (ΑΑΑ: ${docNumber})`,
      docNumber,
    };
  } catch (error: any) {
    console.error('Failed to send order to SoftOne:', error);
    return {
      success: false,
      message: `Αποτυχία αποστολής: ${error?.message || 'Άγνωστο σφάλμα'}`,
    };
  }
}
