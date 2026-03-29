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
    // Χρησιμοποιούμε .range(0, 10000) για να καλύψουμε όλους τους πελάτες σας
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })
      .range(0, 9999); 

    if (error) throw error;
    
    // Επιστρέφουμε τα δεδομένα κάνοντας mapping το customer_code
    return (data || []).map(c => ({
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