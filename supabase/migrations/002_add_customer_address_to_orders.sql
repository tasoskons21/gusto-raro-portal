-- Προσθήκη πεδίων address και city στον πίνακα orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS customer_city TEXT;
