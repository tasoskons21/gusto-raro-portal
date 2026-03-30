import { supabase } from '../lib/supabase';
import { Customer, Product, Brand, CartItem } from '../types';
import XLSX from 'xlsx-js-style';

/**
 * DataService: Υβριδική διαχείριση δεδομένων.
 * Πελάτες από τοπικό JSON, Brands και Προϊόντα από Supabase.
 */
class DataService {
  private baseDataUrl = '/data';

  // Helper for Excel Export
  exportToExcel(customer: Customer, items: CartItem[], total: number, notes?: string) {
    const wb = XLSX.utils.book_new();
    
    // Header Info (Customer Details)
    const customerRows = [
      ['ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ'],
      ['Κωδικός:', customer.customer_code || customer.code || ''],
      ['Όνομα:', customer.name],
      ['ΑΦΜ:', customer.afm],
      ['Διεύθυνση:', customer.address],
      ['Πόλη:', customer.city]
    ];

    let headerRowsCount = customerRows.length;
    const finalData: any[][] = [...customerRows];

    // If notes exist, add them below city (Row 7)
    if (notes && notes.trim()) {
      finalData.push(['Παρατηρήσεις:', notes]);
      headerRowsCount++;
    }

    // Add spacer and Product List Title
    finalData.push(['']);
    finalData.push(['ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ']);
    
    // Products Header (Row 9 or 10)
    const productsHeader = ['ΚΩΔΙΚΟΣ', 'ΠΕΡΙΓΡΑΦΗ', 'ΠΟΣΟΤΗΤΑ'];
    finalData.push(productsHeader);

    // Products Data
    items.forEach(item => {
      finalData.push([
        item.code,
        item.description,
        item.quantity
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(finalData);

    // --- APPLY STYLES ---
    
    // 1. Bold "ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ"
    ws['A1'].s = { font: { bold: true, sz: 12 } };

    // 2. Bold labels for customer info
    for (let r = 1; r < 6; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: 0 });
      if (ws[cellRef]) ws[cellRef].s = { font: { bold: true } };
    }

    // 3. Style for Notes (Red Color)
    if (notes && notes.trim()) {
      const notesRowIndex = 6; // Row 7
      const labelRef = XLSX.utils.encode_cell({ r: notesRowIndex, c: 0 });
      const valRef = XLSX.utils.encode_cell({ r: notesRowIndex, c: 1 });
      if (ws[labelRef]) ws[labelRef].s = { font: { bold: true, color: { rgb: "FF0000" } } };
      if (ws[valRef]) ws[valRef].s = { font: { bold: true, color: { rgb: "FF0000" } } };
    }

    // 4. Bold "ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ"
    const listTitleRow = notes && notes.trim() ? 8 : 7;
    const listTitleRef = XLSX.utils.encode_cell({ r: listTitleRow, c: 0 });
    if (ws[listTitleRef]) ws[listTitleRef].s = { font: { bold: true, sz: 12 } };

    // 5. Products Header Styles
    const prodHeaderRow = listTitleRow + 1;
    for (let c = 0; c < 3; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: prodHeaderRow, c });
      if (ws[cellRef]) {
        ws[cellRef].s = { 
          fill: { fgColor: { rgb: "F8FAFC" } }, 
          font: { bold: true },
          border: { bottom: { style: 'thin' }, top: { style: 'thin' } },
          alignment: { horizontal: 'center' }
        };
      }
    }

    // 6. Data Row Alignment
    const dataStartRow = prodHeaderRow + 1;
    for (let r = dataStartRow; r < dataStartRow + items.length; r++) {
      // Qty center
      const qtyRef = XLSX.utils.encode_cell({ r, c: 2 });
      if (ws[qtyRef]) ws[qtyRef].s = { alignment: { horizontal: 'center' } };
    }

    // Column Widths
    ws['!cols'] = [
      { wch: 15 }, // ΚΩΔΙΚΟΣ
      { wch: 60 }, // ΠΕΡΙΓΡΑΦΗ
      { wch: 15 }  // ΠΟΣΟΤΗΤΑ
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Παραγγελία");
    
    const fileName = `${customer.name.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

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