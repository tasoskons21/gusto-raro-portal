-- Δημιουργία table orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'seller', 'customer')),
  customer_id TEXT,
  customer_name TEXT,
  customer_code TEXT,
  customer_afm TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_value NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes για γρήγορη αναζήτηση
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Admin βλέπει ΟΛΕΣ τις παραγγελίες
CREATE POLICY "admin_view_all_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Seller βλέπει ΜΟΝΟ τις δικές του παραγγελίες
CREATE POLICY "seller_view_own_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'seller'
      AND orders.user_id = auth.uid()
    )
  );

-- Customer βλέπει ΜΟΝΟ τις δικές του παραγγελίες
CREATE POLICY "customer_view_own_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer'
      AND orders.user_id = auth.uid()
    )
  );

-- Όλοι μπορούν να δημιουργούν παραγγελίες
CREATE POLICY "all_create_orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Όλοι μπορούν να επεξεργάζονται τις δικές τους παραγγελίες
CREATE POLICY "all_update_own_orders" ON orders
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Όλοι μπορούν να διαγράφουν τις δικές τους παραγγελίες
CREATE POLICY "all_delete_own_orders" ON orders
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Cron job για auto-delete καθημερινά στις 03:00
-- Σημείωση: Απαιτείται pg_cron extension (ενεργοποιημένο σε Supabase Pro plan)
-- Αν έχεις Pro plan, αφαίρεσε τα σχόλια από τα παρακάτω:

-- SELECT cron.schedule(
--   'delete-old-orders-daily',
--   '0 3 * * *',
--   $$DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 day'$$
-- );

-- Εναλλακτικά, μπορείς να χρησιμοποιήσεις Supabase Edge Function
-- Δες: supabase/functions/delete-old-orders/index.ts

-- Function για updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
