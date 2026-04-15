import { supabase } from '../lib/supabase';
import { Customer, Product, Brand, CartItem } from '../types';
import XLSX from 'xlsx-js-style';

class DataService {
  // Ιδιωτική μέθοδος για τα αιτήματα στο SoftOne για ασφάλεια και επαναχρησιμοποίηση
private async s1Request(payload: any) {
  // Χρησιμοποιούμε το URL από το .env (δηλαδή το /api/softone)
  const response = await fetch(import.meta.env.VITE_SOFTONE_URL, {
    method: 'POST',
    // Στέλνουμε το payload ως string
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("Proxy connection failed");

  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('windows-1253');
  const text = decoder.decode(buffer);
  
  return JSON.parse(text);
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
    if (notes && notes.trim()) finalData.push(['Παρατηρήσεις:', notes]);
    finalData.push([''], ['ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ'], ['ΚΩΔΙΚΟΣ', 'ΠΕΡΙΓΡΑΦΗ', 'ΠΟΣΟΤΗΤΑ']);
    
    items.forEach(item => finalData.push([item.code, item.description, item.quantity]));

    const ws = XLSX.utils.aoa_to_sheet(finalData);
    XLSX.utils.book_append_sheet(wb, ws, "Παραγγελία");
    XLSX.writeFile(wb, `${customer.name.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`);
  }

  // 3. BRANDS & PRODUCTS ΑΠΟ SUPABASE
  async fetchBrands(): Promise<Brand[]> {
    try {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('"Code", "Description", "Brand", "Price", "ImageUrl"')
        .order('Code');
      if (error) throw error;
      return (data || []).map(p => ({
        code: p.Code,
        description: p.Description,
        brand: p.Brand,
        price: Number(p.Price || 0),
        imageUrl: p.ImageUrl
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async submitOrder(order: any): Promise<boolean> {
    try {
      const { error } = await supabase.from('orders').insert([order]);
      return !error;
    } catch (error) {
      return false;
    }
  }

  async addBrand(brand: Partial<Brand>): Promise<void> {
    await supabase.from('brands').insert([brand]);
  }

  async addProduct(product: Partial<Product>): Promise<void> {
    await supabase.from('products').insert([{
      Code: product.code,
      Description: product.description,
      Brand: product.brand,
      Price: product.price,
      ImageUrl: product.imageUrl
    }]);
  }
}

export const dataService = new DataService();