import { supabase } from '../lib/supabase';
import { Customer, Product, Brand } from '../types';

/**
 * DataService: Υβριδική διαχείριση δεδομένων.
 * Πελάτες από τοπικό JSON, Brands και Προϊόντα από Supabase.
 */
class DataService {
  private baseDataUrl = '/data';

  async fetchCustomers(): Promise<Customer[]> {
    try {
      let allData: any[] = [];
      let fetchedAll = false;
      let from = 0;
      const step = 1000; // Το μέγιστο επιτρεπτό όριο ανά request

      while (!fetchedAll) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name', { ascending: true })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < step) {
            fetchedAll = true; // Τελείωσαν οι εγγραφές
          } else {
            from += step; // Πάμε στο επόμενο πακέτο (1001-2000 κλπ)
          }
        } else {
          fetchedAll = true;
        }
      }

      // Επιστρέφουμε όλα τα δεδομένα (1634+) κάνοντας mapping
      return allData.map(c => ({
        ...c,
        code: c.customer_code || c.code
      }));

    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async fetchBrands(): Promise<Brand[]> {
    try {
      // Τραβάμε ΜΟΝΟ από το Supabase
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  // 3. Φόρτωση Προϊόντων από το Supabase (Πίνακας 'products')
  async fetchProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('"Code", "Description", "Brand", "Price", "ImageUrl"')
        // Προσθήκη ταξινόμησης βάσει Code
        .order('Code', { ascending: true });

      if (error) throw error;

      // Αντιστοίχιση των κεφαλαίων ονομάτων της βάσης στα πεζά του Frontend
      return (data || []).map(p => ({
        // Χρησιμοποιούμε p.Code (όπως έρχεται από το select)
        code: p.Code,
        description: p.Description,
        brand: p.Brand,
        // Διασφάλιση ότι η τιμή είναι αριθμός
        price: Number(p.Price || 0),
        imageUrl: p.ImageUrl
      }));
    } catch (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }
  }

  // 4. Υποβολή παραγγελίας στη βάση δεδομένων
  async submitOrder(order: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .insert([order]);

      return !error;
    } catch (error) {
      console.error('Order submission error:', error);
      return false;
    }
  }
  // Προσθήκη νέου Brand
  async addBrand(brand: Partial<Brand>): Promise<void> {
    const { error } = await supabase
      .from('brands')
      .insert([brand]);
    if (error) throw error;
  }

  // Προσθήκη νέου Προϊόντος
  async addProduct(product: Partial<Product>): Promise<void> {
    // Προσέχουμε τα κεφαλαία ονόματα των στηλών της βάσης
    const { error } = await supabase
      .from('products')
      .insert([{
        Code: product.code,
        Description: product.description,
        Brand: product.brand,
        Price: product.price,
        ImageUrl: product.imageUrl
      }]);
    if (error) throw error;
  }
}
export const dataService = new DataService();