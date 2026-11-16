SET search_path TO lms, public;

INSERT INTO authors (name, biography, nationality) VALUES
('Abraham Silberschatz', 'Professor of Computer Science at Yale University specializing in database systems and operating systems.', 'American'),
('Martin Kleppmann', 'Researcher in distributed systems and author at the University of Cambridge.', 'British'),
('Robert C. Martin', 'Software engineer and author recognized for software craftsmanship and agile principles.', 'American'),
('Thomas H. Cormen', 'Emeritus Professor of Computer Science at Dartmouth College and algorithms researcher.', 'American'),
('Donald E. Knuth', 'Professor Emeritus of the Art of Computer Programming at Stanford University.', 'American')
ON CONFLICT DO NOTHING;

INSERT INTO books (isbn, title, author_id, category, publication_year) VALUES
('9780078022159', 'Database System Concepts', 1, 'Computer Science', 2019),
('9781449373320', 'Designing Data-Intensive Applications', 2, 'Distributed Systems', 2017),
('9780132350884', 'Clean Code', 3, 'Software Engineering', 2008),
('9780262046305', 'Introduction to Algorithms', 4, 'Algorithms', 2022),
('9780201896831', 'The Art of Computer Programming', 5, 'Computer Science', 2011)
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO book_copies (book_id, barcode, shelf_location, condition_status, status) VALUES
(1, 'BC-DBS-001', 'SHELF-A1-01', 'EXCELLENT', 'AVAILABLE'),
(1, 'BC-DBS-002', 'SHELF-A1-02', 'GOOD', 'AVAILABLE'),
(1, 'BC-DBS-003', 'SHELF-A1-03', 'GOOD', 'AVAILABLE'),
(2, 'BC-DDIA-001', 'SHELF-B2-01', 'EXCELLENT', 'AVAILABLE'),
(2, 'BC-DDIA-002', 'SHELF-B2-02', 'GOOD', 'AVAILABLE'),
(3, 'BC-CC-001', 'SHELF-C3-01', 'GOOD', 'AVAILABLE'),
(3, 'BC-CC-002', 'SHELF-C3-02', 'FAIR', 'AVAILABLE'),
(4, 'BC-CLRS-001', 'SHELF-D4-01', 'EXCELLENT', 'AVAILABLE'),
(4, 'BC-CLRS-002', 'SHELF-D4-02', 'EXCELLENT', 'AVAILABLE'),
(5, 'BC-TAOCP-001', 'SHELF-E5-01', 'EXCELLENT', 'AVAILABLE')
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO members (card_number, full_name, email, phone, membership_type, max_borrow_limit) VALUES
('LIB-STU-1001', 'Aarav Sharma', 'aarav.sharma@cumail.in', '+91 9876543210', 'STUDENT', 5),
('LIB-STU-1002', 'Diya Patel', 'diya.patel@cumail.in', '+91 9876543211', 'STUDENT', 5),
('LIB-FAC-2001', 'Prof. Rajesh Mehra', 'rajesh.mehra@cumail.in', '+91 9876543212', 'FACULTY', 10),
('LIB-STU-1003', 'Rohan Gupta', 'rohan.gupta@cumail.in', '+91 9876543213', 'STUDENT', 5)
ON CONFLICT (card_number) DO UPDATE 
SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;
