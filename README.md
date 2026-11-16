# Library Management System

A database-backed web application for searching a library catalog and managing the circulation of physical book copies: borrowing, returns, fines and hold queues. Built as a project for **Advanced Data Management System (DBMS)**, B.E. Computer Science and Engineering, Chandigarh University.

> Academic demonstration only. All data is fictional. It is not connected to any real library, payment or identity system.

## Features

- **Catalog search** by title, author, ISBN and category, with available-copy counts per title
- **Physical copy tracking**: every copy has its own barcode, shelf location, condition and status
- **Borrowing** with a transaction and a row lock, so one copy can never be issued to two members
- **Returns and fines**: Rs. 2 per overdue day, with the fine saved on the loan
- **Fine payments** with receipt numbers and balance checks
- **Hold queue**: first-come, first-served, with the queue rank calculated by `ROW_NUMBER()`
- **JWT login** with two roles, `MEMBER` and `LIBRARIAN`
- **Librarian panel**: return desk, add authors, books, copies and members, set copy status, integrity audit

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL 8.0.16 or newer (MySQL Workbench for setup) |
| Backend | Node.js 18+, Express, `mysql2` (connection pool) |
| Auth | `jsonwebtoken` (JWT), `bcryptjs` (password hashing) |
| Frontend | React 18, Tailwind CSS, Axios (loaded from CDN, no build step) |

## Project Structure

```
lms/
├── schema.sql      # Tables, constraints, indexes, seed data (run in MySQL Workbench)
├── server.js       # Express REST API + transaction logic
├── index.html      # React single-page application
├── race_test.js    # Concurrency test: two users, one copy
├── package.json
└── README.md
```

## Prerequisites

- [MySQL Server 8.0.16+](https://dev.mysql.com/downloads/) and MySQL Workbench
- [Node.js 18+](https://nodejs.org/)
- Internet connection (the UI loads React and Tailwind from a CDN)

## Setup

**1. Create the database**
Open `schema.sql` in MySQL Workbench and run the whole script (lightning icon). It creates a database named `lms_db`, seven tables and demo data. The script can be run again safely.

**2. Install dependencies**
```bash
cd lms
npm install
```

**3. Set your MySQL password**

Windows PowerShell:
```powershell
$env:DB_PASSWORD="your_mysql_password"
```
macOS / Linux:
```bash
export DB_PASSWORD="your_mysql_password"
```
Or replace `YOUR_PASSWORD` directly in `server.js`.

Optional environment variables: `DB_HOST` (default `localhost`), `DB_USER` (default `root`), `DB_NAME` (default `lms_db`), `JWT_SECRET`.

**4. Start the server**
```bash
node server.js
```
You should see `Connected to MySQL database "lms_db"`. Then open **http://localhost:3000**.

## Demo Accounts

All passwords are `demo1234`.

| Email | Role | Type | Borrow limit |
|---|---|---|---|
| student@example.test | MEMBER | STUDENT (14-day loans) | 3 |
| student2@example.test | MEMBER | STUDENT | 3 |
| faculty@example.test | MEMBER | FACULTY (30-day loans) | 10 |
| librarian@example.test | LIBRARIAN | FACULTY | 10 |

The catalog and book pages are public. Borrowing, holds and fines need a login. The Admin page needs the librarian account.

## Quick Demo Walkthrough

1. Search the catalog for "database" and open **Database System Concepts**.
2. Log in as `student@example.test` and borrow an AVAILABLE copy. Note the loan reference (`LRN-xxxxxxxx`).
3. Open **My Loans**. The seeded loan `LRN-10000001` is overdue and shows a running fine.
4. Log in as `librarian@example.test`, open **Admin** and return `LRN-10000001` at the Return Desk.
5. Log in as the student again. The fine now appears in My Loans, ready to pay.
6. Open **1984**, whose only copy is borrowed, and place a hold. My Holds shows your queue rank.
7. In Admin, return `LRN-10000002`. The copy becomes RESERVED for the first member in the hold queue.

## Database Design

Seven relations, designed in BCNF:

| Table | Purpose |
|---|---|
| `author` | Writers of titles |
| `book` | Conceptual title (ISBN, category, year) |
| `book_copy` | One barcoded physical item and its status |
| `member` | Borrowers and librarians (role, bcrypt hash) |
| `book_loan` | One borrowing of one copy, kept after return |
| `book_hold` | A member's place in the queue for a title |
| `fine_payment` | Receipt for money paid against a loan's fine |

**Relationships:** one book has many copies; one member has many loans; a copy has many loans over time but at most one active; members and books are linked many-to-many through `book_hold`.

**Key integrity rules**

- `UNIQUE (active_copy_id)` on `book_loan`: at most one ACTIVE or OVERDUE loan per copy.
- `UNIQUE (pending_key)` on `book_hold`: at most one PENDING hold per member and title.
- CHECK constraints for 13-digit ISBN, valid status values, `due_date >= issue_date`, non-negative fines and positive payments.
- Foreign keys use `ON DELETE RESTRICT` so history cannot be deleted by accident.

> **MySQL note:** MySQL has no partial unique indexes. `active_copy_id` and `pending_key` are generated columns that are `NULL` for returned or non-pending rows. A UNIQUE index ignores NULLs, so the effect is the same as a PostgreSQL partial index.

## Concurrency Control

Borrowing and returning run as one transaction on a single pooled connection:

1. `BEGIN`
2. `SELECT … FROM book_copy WHERE copy_id = ? FOR UPDATE` locks the copy row
3. Check status, borrow limit and the hold queue
4. `UPDATE book_copy`, then `INSERT INTO book_loan`
5. `COMMIT` (or `ROLLBACK` on any error)

Two layers protect the rule "one active loan per copy": the row lock in the application and the unique index in the database. Locks are always taken in the same order (copy first, then member) to avoid deadlocks.

**Test it:** with the server running, in another terminal:
```bash
node race_test.js
```
Expected output: `Status codes: [ 201, 409 ]`, which means one winner and one rejected request. To repeat the test, return the loan from the Admin page first.

## API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/login` | Public | Returns a JWT and user info |
| GET | `/api/catalog?q=&category=` | Public | Search titles with copy counts |
| GET | `/api/categories` | Public | List categories |
| GET | `/api/books/:id` | Public | Book details and all copies |
| POST | `/api/loans` | Member | Borrow a copy `{copyId}` |
| POST | `/api/returns` | Librarian | Return a loan `{loanReference}` |
| GET | `/api/my/loans` | Member | My loans with fines and balance |
| POST | `/api/fines/pay` | Member | Pay a fine `{loanId, amount, method}` |
| POST | `/api/holds` | Member | Place a hold `{bookId}` |
| GET | `/api/my/holds` | Member | My holds with queue rank |
| DELETE | `/api/holds/:id` | Member | Cancel a pending hold |
| POST | `/api/admin/:table` | Librarian | Add to `author`, `book`, `book_copy` or `member` |
| POST | `/api/admin/copy_status` | Librarian | Set a copy's status |
| GET | `/api/admin/overview` | Librarian | Active and overdue loans, members, audits |

Error codes: `400/422` invalid input, `401` not signed in, `403` wrong role, `404` not found, `409` conflict (copy already loaned, duplicate hold), `503` database unavailable.

## Useful SQL Queries

```sql
-- Availability by category
SELECT b.category, COUNT(DISTINCT b.book_id) AS titles, SUM(c.status='AVAILABLE') AS available_copies
FROM book b LEFT JOIN book_copy c USING(book_id) GROUP BY b.category;

-- Hold queue rank
SELECT hold_id, member_id, book_id,
       ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY hold_date) AS queue_rank
FROM book_hold WHERE status = 'PENDING';

-- Integrity audit: must return 0 rows
SELECT copy_id, COUNT(*) FROM book_loan
WHERE status IN ('ACTIVE','OVERDUE') GROUP BY copy_id HAVING COUNT(*) > 1;
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Access denied for user 'root'` | `DB_PASSWORD` is wrong or not set in this terminal window. |
| `Unknown database 'lms_db'` | Run `schema.sql` in MySQL Workbench first. |
| `ECONNREFUSED` | The MySQL service is not running. Start it (Windows: Services, MySQL80). |
| CHECK constraints seem ignored or fail to create | You need MySQL 8.0.16 or newer. Check with `SELECT VERSION();`. |
| `Port 3000 already in use` | Close the other process, or change the port in the last line of `server.js`. |
| Blank page or unstyled UI | The browser cannot reach the CDNs. Check your internet connection. |
| Login fails for demo users | Restart the server once. It sets the demo passwords on startup. |

## Limitations

- One author per book, and one copy per loan request
- A single fixed fine rate (no grace period, cap or waiver)
- OVERDUE status is updated when loans are read, not by a scheduled job
- Hold notifications are manual; there is no email or payment gateway
- No JWT refresh or revocation; the only roles are MEMBER and LIBRARIAN
- Cancelling a hold while its copy is RESERVED does not release the copy automatically

## Future Work

Barcode or RFID scanning, scheduled overdue and hold emails, multi-author support through a junction table, a fine policy table, full-text search, and automated integration tests.

## Authors

Submitted by: *[Student names and UIDs]*
Guide: *[Faculty guide name]*, Department of CSE, Chandigarh University, 2026–27
