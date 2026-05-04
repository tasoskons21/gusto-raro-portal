import { supabase, fetchWithTimeout } from '../lib/supabase';
import { Customer, Product, Brand, CartItem } from '../types';
import XLSX from 'xlsx-js-style';

// Local cache for frequently accessed data
const cache = {
  brands: { data: null as Brand[] | null, timestamp: 0, ttl: 300000 }, // 5 min
  products: { data: null as Product[] | null, timestamp: 0, ttl: 300000 }, // 5 min
};

const isCacheValid = (timestamp: number, ttl: number) => {
  return Date.now() - timestamp < ttl;
};

class DataService {
  // Ιδιωτική μέθοδος για τα αιτήματα στο SoftOne για ασφάλεια και επαναχρησιμοποίηση
  // src/services/dataService.ts
  private async s1Request(payload: any) {
    const response = await fetch('/api/softone', { // Σιγουρέψου ότι δεν υπάρχει http://localhost εδώ
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy failed: ${response.status} ${errorText}`);
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1253');
    return JSON.parse(decoder.decode(buffer));
  }

  // 1. ΑΥΤΟΜΑΤΗ ΑΝΑΚΤΗΣΗ ΠΕΛΑΤΩΝ ΑΠΟ SOFTONE
  async fetchCustomers(): Promise<Customer[]> {
    try {
      // Βήμα 1: Login χρησιμοποιώντας το .env
      const loginData = await this.s1Request({
        SERVICE: "login",
        USERNAME: import.meta.env.VITE_SOFTONE_USERNAME,
        PASSWORD: import.meta.env.VITE_SOFTONE_PASSWORD,
        APPID: import.meta.env.VITE_SOFTONE_APPID,
        LANGUAGE: "GRE"
      });

      if (!loginData?.success) {
        console.error("❌ SoftOne Login Failed");
        return [];
      }

      // Βήμα 2: Authenticate
      const authData = await this.s1Request({
        service: "authenticate",
        clientID: loginData.clientID,
        appId: "156", // Σταθερό AppId για το module
        COMPANY: import.meta.env.VITE_SOFTONE_COMPANY,
        BRANCH: "1000",
        MODULE: "0",
        REFID: "1",
        USERID: "1",
        WEBACCOUNT: "1"
      });

      if (!authData?.success) {
        console.error("❌ SoftOne Auth Failed");
        return [];
      }

      // Βήμα 3: Λήψη Δεδομένων (SelectorFields)
      const customersRaw = await this.s1Request({
        service: "selectorFields",
        clientID: authData.clientID,
        appId: "156",
        TABLENAME: "CUSTOMER",
        KEYNAME: "COMPANY",
        KEYVALUE: import.meta.env.VITE_SOFTONE_COMPANY,
        RESULTFIELDS: "CODE,NAME,ADDRESS,PHONE01,AFM,CITY",
        OBJECTPARAMS: { "BGMOBILECHECK": "0" }
      });

      const rows = customersRaw.rows || customersRaw;

      if (Array.isArray(rows)) {
        console.log(`✅ SoftOne: Φορτώθηκαν ${rows.length} πελάτες.`);
        return rows.map((item: any) => ({
          id: String(item.CODE || ''),
          code: String(item.CODE || ''),
          customer_code: String(item.CODE || ''),
          name: String(item.NAME || ''),
          address: String(item.ADDRESS || ''),
          phone: String(item.PHONE01 || ''),
          afm: String(item.AFM || ''),
          city: String(item.CITY || '')
        }));
      }

      return [];

    } catch (error) {
      console.error('❌ SoftOne Critical Error:', error);
      return [];
    }
  }

   // 2. ΕΞΑΓΩΓΗ ΣΕ EXCEL
   exportToExcel(customer: Customer, items: CartItem[], total: number, notes?: string) {
     const wb = XLSX.utils.book_new();
     const customerRows = [
       ['ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ'],
       ['Κωδικός:', customer.customer_code || customer.code || ''],
       ['Όνομα:', customer.name],
       ['ΑΦΜ:', customer.afm],
       ['Διεύθυνση:', customer.address],
       ['Πόλη:', customer.city]
     ];

     const finalData: any[][] = [...customerRows];
     
     // Add empty row for spacing before notes/products
     finalData.push(['']);
     
     // Add notes section if notes exist (only once)
     let notesStartRow = -1;
     if (notes && notes.trim()) {
       finalData.push(['Παρατηρήσεις:', notes]);
       notesStartRow = finalData.length - 1; // Zero-based index of the notes row
       // Add empty row after notes for spacing
       finalData.push(['']);
     }
     
     finalData.push(['ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ']);
     finalData.push(['ΚΩΔΙΚΟΣ', 'ΠΕΡΙΓΡΑΦΗ', 'ΠΟΣΟΤΗΤΑ']);

     items.forEach(item => finalData.push([item.code, item.description, item.quantity]));

     const ws = XLSX.utils.aoa_to_sheet(finalData);
     
     // Style the notes row in red if notes exist
     if (notes && notes.trim() && notesStartRow >= 0) {
       // Convert zero-based index to 1-based for Excel cell reference
       const excelRowIndex = notesStartRow + 1;
       
       // Style the label "Παρατηρήσεις:" (column A)
       const labelCell = `A${excelRowIndex}`;
       if (!ws[labelCell]) ws[labelCell] = { v: 'Παρατηρήσεις:' };
       ws[labelCell].s = { font: { color: { rgb: 'FF0000' } }, bold: true };
       
       // Style the notes value (column B)
       const valueCell = `B${excelRowIndex}`;
       if (!ws[valueCell]) ws[valueCell] = { v: notes };
       ws[valueCell].s = { font: { color: { rgb: 'FF0000' } } };
     }
     
     // Auto-size columns based on content
     const range = XLSX.utils.decode_range(ws['!ref'] || '');
     const colWidths = [];
     
     for (let C = range.s.c; C <= range.e.c; ++C) {
       let maxWidth = 0;
       for (let R = range.s.r; R <= range.e.r; ++R) {
         const cellAddress = { c: C, r: R };
         const cellRef = XLSX.utils.encode_cell(cellAddress);
         const cell = ws[cellRef];
         if (cell && cell.v) {
           const cellValue = String(cell.v);
           // Calculate width based on character count with some padding
           const width = cellValue.length + 2; // Add padding
           if (width > maxWidth) maxWidth = width;
         }
       }
       // Set minimum width and cap maximum width for readability
       const adjustedWidth = Math.max(10, Math.min(50, maxWidth));
       colWidths.push({ wch: adjustedWidth });
     }
     
     ws['!cols'] = colWidths;
     
     XLSX.utils.book_append_sheet(wb, ws, "Παραγγελία");
     XLSX.writeFile(wb, `${customer.name.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`);
   }

  // 3. BRANDS & PRODUCTS ΑΠΟ SUPABASE
  async fetchBrands(): Promise<Brand[]> {
    // Check cache first
    if (cache.brands.data && isCacheValid(cache.brands.timestamp, cache.brands.ttl)) {
      console.log('📦 Using cached brands');
      return cache.brands.data;
    }

    try {
      const result = await fetchWithTimeout<Brand[]>(
        supabase.from('brands').select('*').order('name'),
        15000,
        3
      );
      if (result.error) throw result.error;
      
      // Update cache
      cache.brands.data = result.data || [];
      cache.brands.timestamp = Date.now();
      
      return cache.brands.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      // Return cached data even if expired as fallback
      return cache.brands.data || [];
    }
  }

  async fetchProducts(): Promise<Product[]> {
    // Check cache first
    if (cache.products.data && isCacheValid(cache.products.timestamp, cache.products.ttl)) {
      console.log('📦 Using cached products');
      return cache.products.data;
    }

    try {
      const result = await fetchWithTimeout<any[]>(
        supabase
          .from('products')
          .select('"Code", "Description", "Brand", "Price", "ImageUrl"')
          .order('Code'),
        15000,
        3
      );
      if (result.error) throw result.error;
      
      const products = (result.data || []).map(p => ({
        code: p.Code,
        description: p.Description,
        brand: p.Brand,
        price: Number(p.Price || 0),
        imageUrl: p.ImageUrl
      }));
      
      // Update cache
      cache.products.data = products;
      cache.products.timestamp = Date.now();
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return cached data even if expired as fallback
      return cache.products.data || [];
    }
  }

  // Invalidate cache when data changes
  invalidateCache(type: 'brands' | 'products' | 'all') {
    if (type === 'brands' || type === 'all') {
      cache.brands.data = null;
      cache.brands.timestamp = 0;
    }
    if (type === 'products' || type === 'all') {
      cache.products.data = null;
      cache.products.timestamp = 0;
    }
  }

  async submitOrder(order: any): Promise<boolean> {
    try {
      const result = await fetchWithTimeout(
        supabase.from('orders').insert([order]),
        15000,
        3
      );
      if (result.error) {
        console.error('Submit order error:', result.error);
        return false;
      }
      return !result.error;
    } catch (error) {
      console.error('Submit order failed:', error);
      return false;
    }
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const result = await fetchWithTimeout(
        supabase.from('orders').delete().eq('id', orderId),
        15000,
        3
      );
      if (result.error) {
        console.error('Delete order error:', result.error);
        return false;
      }
      return !result.error;
    } catch (error) {
      console.error('Delete order failed:', error);
      return false;
    }
  }

  async updateOrder(orderId: string, orderData: any): Promise<boolean> {
    try {
      const result = await fetchWithTimeout(
        supabase.from('orders').update(orderData).eq('id', orderId),
        15000,
        3
      );
      if (result.error) {
        console.error('Update order error:', result.error);
        return false;
      }
      return !result.error;
    } catch (error) {
      console.error('Update order failed:', error);
      return false;
    }
  }

  async addBrand(brand: Partial<Brand>): Promise<void> {
    try {
      const result = await fetchWithTimeout(
        supabase.from('brands').insert([brand]),
        15000,
        3
      );
      if (result.error) throw result.error;
      // Invalidate cache after update
      this.invalidateCache('brands');
    } catch (error) {
      console.error('Error adding brand:', error);
      throw error;
    }
  }

  async addProduct(product: Partial<Product>): Promise<void> {
    try {
      const result = await fetchWithTimeout(
        supabase.from('products').insert([{
          Code: product.code,
          Description: product.description,
          Brand: product.brand,
          Price: product.price,
          ImageUrl: product.imageUrl
        }]),
        15000,
        3
      );
      if (result.error) throw result.error;
      // Invalidate cache after update
      this.invalidateCache('products');
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();