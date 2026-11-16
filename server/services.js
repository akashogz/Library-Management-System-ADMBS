const { query, getClient } = require('./db');

const getStats = async () => {
  const booksRes = await query('SELECT COUNT(*) AS total_books FROM lms.books');
  const copiesRes = await query('SELECT COUNT(*) AS total_copies, COUNT(CASE WHEN status = \'AVAILABLE\' THEN 1 END) AS available_copies FROM lms.book_copies');
  const loansRes = await query('SELECT COUNT(CASE WHEN status = \'ACTIVE\' THEN 1 END) AS active_loans, COUNT(CASE WHEN status = \'OVERDUE\' THEN 1 END) AS overdue_loans FROM lms.book_loans');
  const membersRes = await query('SELECT COUNT(*) AS total_members FROM lms.members');

  return {
    totalBooks: parseInt(booksRes.rows[0].total_books, 10),
    totalCopies: parseInt(copiesRes.rows[0].total_copies, 10),
    availableCopies: parseInt(copiesRes.rows[0].available_copies, 10),
    activeLoans: parseInt(loansRes.rows[0].active_loans, 10),
    overdueLoans: parseInt(loansRes.rows[0].overdue_loans, 10),
    totalMembers: parseInt(membersRes.rows[0].total_members, 10)
  };
};

const getCatalog = async ({ search = '', category = '' } = {}) => {
  let sql = `
    SELECT 
      b.book_id,
      b.isbn,
      b.title,
      b.category,
      b.publication_year,
      a.name AS author_name,
      COUNT(c.copy_id) AS total_copies,
      COUNT(CASE WHEN c.status = 'AVAILABLE' THEN 1 END) AS available_copies
    FROM lms.books b
    JOIN lms.authors a ON b.author_id = a.author_id
    LEFT JOIN lms.book_copies c ON b.book_id = c.book_id
    WHERE 1=1
  `;
  const params = [];

  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    sql += ` AND (b.title ILIKE $${params.length} OR b.isbn ILIKE $${params.length} OR a.name ILIKE $${params.length})`;
  }

  if (category.trim()) {
    params.push(category.trim());
    sql += ` AND b.category = $${params.length}`;
  }

  sql += `
    GROUP BY b.book_id, b.isbn, b.title, b.category, b.publication_year, a.name
    ORDER BY b.title ASC
  `;

  const { rows } = await query(sql, params);
  return rows;
};

const getBookDetails = async (bookId) => {
  const bookRes = await query(`
    SELECT 
      b.book_id,
      b.isbn,
      b.title,
      b.category,
      b.publication_year,
      a.author_id,
      a.name AS author_name,
      a.biography,
      a.nationality
    FROM lms.books b
    JOIN lms.authors a ON b.author_id = a.author_id
    WHERE b.book_id = $1
  `, [bookId]);

  if (bookRes.rows.length === 0) {
    return null;
  }

  const copiesRes = await query(`
    SELECT 
      copy_id,
      barcode,
      shelf_location,
      condition_status,
      status
    FROM lms.book_copies
    WHERE book_id = $1
    ORDER BY copy_id ASC
  `, [bookId]);

  const holdsRes = await query(`
    SELECT 
      h.hold_id,
      h.hold_date,
      h.status,
      m.full_name AS member_name,
      ROW_NUMBER() OVER (ORDER BY h.hold_date ASC) AS queue_position
    FROM lms.book_holds h
    JOIN lms.members m ON h.member_id = m.member_id
    WHERE h.book_id = $1 AND h.status = 'PENDING'
    ORDER BY h.hold_date ASC
  `, [bookId]);

  return {
    ...bookRes.rows[0],
    copies: copiesRes.rows,
    holds: holdsRes.rows
  };
};

const borrowCopy = async ({ copyId, memberId, loanDays = 14 }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const memberCheck = await client.query(`
      SELECT member_id, full_name, max_borrow_limit,
        (SELECT COUNT(*) FROM lms.book_loans WHERE member_id = $1 AND status IN ('ACTIVE', 'OVERDUE')) AS active_count
      FROM lms.members 
      WHERE member_id = $1
    `, [memberId]);

    if (memberCheck.rows.length === 0) {
      throw new Error('Member not found');
    }

    const member = memberCheck.rows[0];
    if (parseInt(member.active_count, 10) >= member.max_borrow_limit) {
      throw new Error(`Member loan limit reached (${member.max_borrow_limit} books maximum)`);
    }

    const copyRes = await client.query(`
      SELECT copy_id, book_id, barcode, shelf_location, status 
      FROM lms.book_copies 
      WHERE copy_id = $1 
      FOR UPDATE
    `, [copyId]);

    if (copyRes.rows.length === 0) {
      throw new Error('Book copy not found');
    }

    const copy = copyRes.rows[0];
    if (copy.status !== 'AVAILABLE') {
      throw new Error(`Copy ${copy.barcode} is currently ${copy.status.toLowerCase()} and cannot be borrowed`);
    }

    const rawRef = 'LRN-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const loanInsert = await client.query(`
      INSERT INTO lms.book_loans (
        loan_reference, copy_id, member_id, issue_date, due_date, status, fine_amount
      ) VALUES (
        $1, $2, $3, CURRENT_DATE, CURRENT_DATE + ($4 || ' days')::INTERVAL, 'ACTIVE', 0.00
      ) RETURNING loan_id, loan_reference, issue_date, due_date, status
    `, [rawRef, copyId, memberId, loanDays]);

    await client.query(`
      UPDATE lms.book_copies 
      SET status = 'BORROWED' 
      WHERE copy_id = $1
    `, [copyId]);

    await client.query('COMMIT');
    return {
      loan: loanInsert.rows[0],
      copy,
      member
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const returnCopy = async ({ loanReference }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const loanRes = await client.query(`
      SELECT 
        l.loan_id,
        l.loan_reference,
        l.copy_id,
        l.member_id,
        l.issue_date,
        l.due_date,
        l.status,
        c.book_id,
        c.barcode,
        b.title,
        m.full_name AS member_name
      FROM lms.book_loans l
      JOIN lms.book_copies c ON l.copy_id = c.copy_id
      JOIN lms.books b ON c.book_id = b.book_id
      JOIN lms.members m ON l.member_id = m.member_id
      WHERE l.loan_reference = $1
      FOR UPDATE OF l
    `, [loanReference]);

    if (loanRes.rows.length === 0) {
      throw new Error('Loan reference not found');
    }

    const loan = loanRes.rows[0];
    if (loan.status === 'RETURNED') {
      throw new Error('This loan has already been returned');
    }

    const fineCalc = await client.query(`
      SELECT GREATEST(0, (CURRENT_DATE - $1::DATE) * 10.00) AS fine_amount,
             (CURRENT_DATE - $1::DATE) AS overdue_days
    `, [loan.due_date]);

    const fineAmount = parseFloat(fineCalc.rows[0].fine_amount);
    const overdueDays = Math.max(0, parseInt(fineCalc.rows[0].overdue_days, 10));

    await client.query(`
      UPDATE lms.book_loans 
      SET status = 'RETURNED', 
          return_date = CURRENT_DATE, 
          fine_amount = $1 
      WHERE loan_id = $2
    `, [fineAmount, loan.loan_id]);

    const holdCheck = await client.query(`
      SELECT hold_id, member_id 
      FROM lms.book_holds 
      WHERE book_id = $1 AND status = 'PENDING' 
      ORDER BY hold_date ASC 
      LIMIT 1 
      FOR UPDATE
    `, [loan.book_id]);

    let newCopyStatus = 'AVAILABLE';
    let holdFulfilled = null;

    if (holdCheck.rows.length > 0) {
      newCopyStatus = 'RESERVED';
      holdFulfilled = holdCheck.rows[0];
      await client.query(`
        UPDATE lms.book_holds 
        SET status = 'FULFILLED' 
        WHERE hold_id = $1
      `, [holdFulfilled.hold_id]);
    }

    await client.query(`
      UPDATE lms.book_copies 
      SET status = $1 
      WHERE copy_id = $2
    `, [newCopyStatus, loan.copy_id]);

    await client.query('COMMIT');

    return {
      loanId: loan.loan_id,
      loanReference: loan.loan_reference,
      bookTitle: loan.title,
      barcode: loan.barcode,
      memberName: loan.member_name,
      returnDate: new Date().toISOString().split('T')[0],
      overdueDays,
      fineAmount,
      nextStatus: newCopyStatus,
      holdFulfilled: !!holdFulfilled
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const lookupLoan = async (loanReference) => {
  const { rows } = await query(`
    SELECT 
      l.loan_id,
      l.loan_reference,
      l.issue_date,
      l.due_date,
      l.return_date,
      l.status,
      l.fine_amount,
      c.copy_id,
      c.barcode,
      c.shelf_location,
      b.book_id,
      b.title,
      b.isbn,
      a.name AS author_name,
      m.member_id,
      m.card_number,
      m.full_name AS member_name,
      m.email AS member_email,
      CASE 
        WHEN l.status = 'ACTIVE' AND CURRENT_DATE > l.due_date THEN (CURRENT_DATE - l.due_date) * 10.00
        ELSE l.fine_amount
      END AS estimated_fine
    FROM lms.book_loans l
    JOIN lms.book_copies c ON l.copy_id = c.copy_id
    JOIN lms.books b ON c.book_id = b.book_id
    JOIN lms.authors a ON b.author_id = a.author_id
    JOIN lms.members m ON l.member_id = m.member_id
    WHERE l.loan_reference = $1
  `, [loanReference]);

  return rows.length ? rows[0] : null;
};

const getMemberLoans = async (memberId) => {
  const { rows } = await query(`
    SELECT 
      l.loan_id,
      l.loan_reference,
      l.issue_date,
      l.due_date,
      l.return_date,
      l.status,
      l.fine_amount,
      c.barcode,
      c.shelf_location,
      b.title,
      a.name AS author_name
    FROM lms.book_loans l
    JOIN lms.book_copies c ON l.copy_id = c.copy_id
    JOIN lms.books b ON c.book_id = b.book_id
    JOIN lms.authors a ON b.author_id = a.author_id
    WHERE l.member_id = $1
    ORDER BY l.loan_id DESC
  `, [memberId]);

  return rows;
};

const placeHold = async ({ bookId, memberId }) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  const { rows } = await query(`
    INSERT INTO lms.book_holds (book_id, member_id, expiry_date, status)
    VALUES ($1, $2, $3, 'PENDING')
    RETURNING hold_id, book_id, member_id, hold_date, expiry_date, status
  `, [bookId, memberId, expiryDate.toISOString().split('T')[0]]);

  return rows[0];
};

const runDatabaseAudit = async () => {
  const duplicateActive = await query(`
    SELECT copy_id, COUNT(*) AS active_count
    FROM lms.book_loans
    WHERE status IN ('ACTIVE', 'OVERDUE')
    GROUP BY copy_id
    HAVING COUNT(*) > 1
  `);

  const copyStatusMismatch = await query(`
    SELECT c.copy_id, c.barcode, c.status AS copy_status, l.status AS loan_status
    FROM lms.book_copies c
    JOIN lms.book_loans l ON c.copy_id = l.copy_id
    WHERE l.status IN ('ACTIVE', 'OVERDUE') AND c.status = 'AVAILABLE'
  `);

  const orphanCopies = await query(`
    SELECT copy_id, barcode FROM lms.book_copies WHERE book_id NOT IN (SELECT book_id FROM lms.books)
  `);

  const summary = await query(`
    SELECT 
      (SELECT COUNT(*) FROM lms.authors) AS authors_count,
      (SELECT COUNT(*) FROM lms.books) AS books_count,
      (SELECT COUNT(*) FROM lms.book_copies) AS copies_count,
      (SELECT COUNT(*) FROM lms.members) AS members_count,
      (SELECT COUNT(*) FROM lms.book_loans) AS loans_count,
      (SELECT COUNT(*) FROM lms.book_holds) AS holds_count
  `);

  return {
    passed: duplicateActive.rows.length === 0 && copyStatusMismatch.rows.length === 0 && orphanCopies.rows.length === 0,
    duplicateActiveLoans: duplicateActive.rows,
    copyStatusMismatches: copyStatusMismatch.rows,
    orphanCopies: orphanCopies.rows,
    counts: summary.rows[0],
    checkedAt: new Date().toISOString()
  };
};

const addBook = async ({ title, isbn, authorName, category, publicationYear, shelfLocation, copyCount = 1 }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    let authorId;
    const authorRes = await client.query('SELECT author_id FROM lms.authors WHERE name = $1', [authorName]);
    if (authorRes.rows.length > 0) {
      authorId = authorRes.rows[0].author_id;
    } else {
      const newAuthor = await client.query(
        'INSERT INTO lms.authors (name) VALUES ($1) RETURNING author_id',
        [authorName]
      );
      authorId = newAuthor.rows[0].author_id;
    }

    const bookRes = await client.query(`
      INSERT INTO lms.books (isbn, title, author_id, category, publication_year)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING book_id, isbn, title
    `, [isbn, title, authorId, category, publicationYear]);

    const book = bookRes.rows[0];
    const copies = [];

    for (let i = 1; i <= copyCount; i++) {
      const barcode = `BC-${isbn.slice(-4)}-${String(i).padStart(3, '0')}`;
      const copyRes = await client.query(`
        INSERT INTO lms.book_copies (book_id, barcode, shelf_location, condition_status, status)
        VALUES ($1, $2, $3, 'EXCELLENT', 'AVAILABLE')
        RETURNING copy_id, barcode, shelf_location, status
      `, [book.book_id, barcode, `${shelfLocation}-${String(i).padStart(2, '0')}`]);
      copies.push(copyRes.rows[0]);
    }

    await client.query('COMMIT');
    return { book, copies };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const addMember = async ({ cardNumber, fullName, email, phone, membershipType = 'STUDENT' }) => {
  const maxLimit = membershipType === 'FACULTY' ? 10 : 5;
  const { rows } = await query(`
    INSERT INTO lms.members (card_number, full_name, email, phone, membership_type, max_borrow_limit)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING member_id, card_number, full_name, email, membership_type, max_borrow_limit
  `, [cardNumber, fullName, email, phone, membershipType, maxLimit]);
  return rows[0];
};

const getMembers = async () => {
  const { rows } = await query(`
    SELECT 
      m.member_id,
      m.card_number,
      m.full_name,
      m.email,
      m.membership_type,
      m.max_borrow_limit,
      (SELECT COUNT(*) FROM lms.book_loans WHERE member_id = m.member_id AND status IN ('ACTIVE', 'OVERDUE')) AS active_borrowed_count
    FROM lms.members m
    ORDER BY m.member_id ASC
  `);
  return rows;
};

module.exports = {
  getStats,
  getCatalog,
  getBookDetails,
  borrowCopy,
  returnCopy,
  lookupLoan,
  getMemberLoans,
  placeHold,
  runDatabaseAudit,
  addBook,
  addMember,
  getMembers
};
