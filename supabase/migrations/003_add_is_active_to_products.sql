-- Προσθήκη πεδίου διαθεσιμότητας στον πίνακα products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS "IsActive" BOOLEAN DEFAULT true;

-- Ενημέρωση υπαρχόντων προϊόντων ως ενεργά
UPDATE products SET "IsActive" = true WHERE "IsActive" IS NULL;
