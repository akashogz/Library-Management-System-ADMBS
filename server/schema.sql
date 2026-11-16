CREATE SCHEMA IF NOT EXISTS lms;
SET search_path TO lms, public;

CREATE TABLE IF NOT EXISTS authors (
  author_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  biography TEXT,
  nationality VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS books (
  book_id SERIAL PRIMARY KEY,
  isbn VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  author_id INT NOT NULL REFERENCES authors(author_id) ON DELETE RESTRICT,
  category VARCHAR(100) NOT NULL,
  publication_year INT NOT NULL CHECK (publication_year >= 1400 AND publication_year <= 2100)
);

CREATE TABLE IF NOT EXISTS book_copies (
  copy_id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(book_id) ON DELETE RESTRICT,
  barcode VARCHAR(50) NOT NULL UNIQUE,
  shelf_location VARCHAR(50) NOT NULL,
  condition_status VARCHAR(50) NOT NULL DEFAULT 'GOOD',
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BORROWED', 'RESERVED', 'MAINTENANCE'))
);

CREATE TABLE IF NOT EXISTS members (
  member_id SERIAL PRIMARY KEY,
  card_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  membership_type VARCHAR(20) NOT NULL DEFAULT 'STUDENT' CHECK (membership_type IN ('STUDENT', 'FACULTY')),
  max_borrow_limit INT NOT NULL DEFAULT 5 CHECK (max_borrow_limit > 0)
);

CREATE TABLE IF NOT EXISTS book_loans (
  loan_id SERIAL PRIMARY KEY,
  loan_reference VARCHAR(20) NOT NULL UNIQUE,
  copy_id INT NOT NULL REFERENCES book_copies(copy_id) ON DELETE RESTRICT,
  member_id INT NOT NULL REFERENCES members(member_id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL CHECK (due_date >= issue_date),
  return_date DATE CHECK (return_date IS NULL OR return_date >= issue_date),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETURNED', 'OVERDUE')),
  fine_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (fine_amount >= 0.00)
);

CREATE TABLE IF NOT EXISTS book_holds (
  hold_id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(book_id) ON DELETE RESTRICT,
  member_id INT NOT NULL REFERENCES members(member_id) ON DELETE RESTRICT,
  hold_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED'))
);

CREATE TABLE IF NOT EXISTS fine_payments (
  payment_id SERIAL PRIMARY KEY,
  loan_id INT NOT NULL REFERENCES book_loans(loan_id) ON DELETE RESTRICT,
  member_id INT NOT NULL REFERENCES members(member_id) ON DELETE RESTRICT,
  amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
  receipt_no VARCHAR(50) NOT NULL UNIQUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_copy_loan ON book_loans (copy_id) WHERE status IN ('ACTIVE', 'OVERDUE');
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_member_hold ON book_holds (member_id, book_id) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_copies_book_id ON book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_member_id ON book_loans(member_id);
CREATE INDEX IF NOT EXISTS idx_holds_book_id ON book_holds(book_id);
