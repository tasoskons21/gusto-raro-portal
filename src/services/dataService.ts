import { Customer, Product, Brand } from '../types';

/**
 * DataService: Διαχειρίζεται την άντληση δεδομένων.
 * Αυτή τη στιγμή διαβάζει από στατικά JSON, αλλά η δομή επιτρέπει 
 * την εύκολη μετάβαση σε API (Soft1) αλλάζοντας μόνο τις μεθόδους εδώ.
 */
class DataService {
  private baseDataUrl = '/data'; // Στην παραγωγή θα είναι το API URL

  async fetchCustomers(): Promise<Customer[]> {
    try {
      console.log('Fetching customers from:', `${this.baseDataUrl}/customers.json`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s
      
      const response = await fetch(`${this.baseDataUrl}/customers.json`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Failed to load customers: ${response.statusText}`);
      
      const rawData = await response.json();
      console.log('Customers raw data loaded:', rawData ? rawData.length : 'null', 'items');
      
      if (!Array.isArray(rawData)) {
        console.error('Customers data is not an array:', rawData);
        return [];
      }
      
      return rawData.flatMap((obj: any, index: number) => {
        const keys = Object.keys(obj);
        if (keys.length === 0) return [];
        const key = keys[0];
        const val = obj[key];
        if (val && Array.isArray(val) && val.length >= 3) {
          // Καθαρισμός ονόματος από διπλά quotes και backslashes
          const cleanName = typeof val[2] === 'string' ? val[2].replace(/\\"/g, '').replace(/""/g, '').replace(/"/g, '').trim() : '';
          return [{
            id: val[0],
            code: val[1],
            name: cleanName,
            afm: val[3] || '',
            address: val[4] || '',
            city: val[5] || ''
          }];
        } else {
          console.warn(`Invalid customer format at index ${index}:`, obj);
        }
        return [];
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Fetch customers aborted due to timeout.');
      }
      return [];
    }
  }

  async fetchBrands(): Promise<Brand[]> {
    try {
      const response = await fetch(`${this.baseDataUrl}/brands.json`);
      if (!response.ok) throw new Error('Could not load brands.json');
      return await response.json();
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  }

  async fetchProducts(): Promise<Product[]> {
    let allProducts: Product[] = [];
    
    try {
      // 1. Φορτώνουμε τη λίστα με τα διαθέσιμα brands (αρχεία)
      const brandsResponse = await fetch(`${this.baseDataUrl}/brands.json`);
      if (!brandsResponse.ok) throw new Error('Could not load brands.json');
      const brands: Brand[] = await brandsResponse.json();

      // 2. Φορτώνουμε κάθε αρχείο brand δυναμικά
      for (const brand of brands) {
        const fileName = brand.name;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s per brand file
          const response = await fetch(`${this.baseDataUrl}/${fileName}.json`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            const items = await response.json();
            if (Array.isArray(items)) {
              const mappedItems = items.map((i: any) => ({
                code: i.Code || i.code || '',
                description: i.Description || i.description || '',
                brand: i.Brand || i.brand || fileName, // Αν το Brand είναι κενό, παίρνουμε το όνομα του αρχείου
                price: Number(i.Price || i.price) || 0,
                imageUrl: i.ImageUrl || i.imageUrl || ''
              }));
              
              // Deduplicate within the file and against existing products
              const newItems = mappedItems.filter(newItem => 
                !allProducts.some(existing => existing.code === newItem.code)
              );
              
              allProducts = [...allProducts, ...newItems];
            }
          }
        } catch (error) {
          console.warn(`Could not load products from ${fileName}.json`);
        }
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    }
    
    return allProducts;
  }

  async submitOrder(order: any): Promise<boolean> {
    console.log('Sending order to Soft1 ERP...', order);
    // Εδώ θα μπει το αυθεντικό API call στο μέλλον
    return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  }
}

export const dataService = new DataService();
