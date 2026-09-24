-- Προσθήκη πεδίου τεμαχίων ανά κιβώτιο στον πίνακα products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS "PiecesPerBox" INTEGER DEFAULT 1;

-- Ενημέρωση υπαρχόντων προϊόντων που δεν έχουν this τιμή
UPDATE products SET "PiecesPerBox" = 1 WHERE "PiecesPerBox" IS NULL;
