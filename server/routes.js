const express = require('express');
const router = express.Router();
const services = require('./services');

router.get('/stats', async (req, res) => {
  try {
    const data = await services.getStats();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog', async (req, res) => {
  try {
    const { search, category } = req.query;
    const data = await services.getCatalog({ search, category });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/books/:id', async (req, res) => {
  try {
    const data = await services.getBookDetails(req.params.id);
    if (!data) return res.status(404).json({ error: 'Book not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/loans/borrow', async (req, res) => {
  try {
    const { copyId, memberId, loanDays } = req.body;
    if (!copyId || !memberId) {
      return res.status(400).json({ error: 'copyId and memberId are required' });
    }
    const result = await services.borrowCopy({ copyId, memberId, loanDays });
    res.status(201).json(result);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Conflict: This book copy already has an active loan (Enforced by partial unique index)' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.post('/loans/return', async (req, res) => {
  try {
    const { loanReference } = req.body;
    if (!loanReference) {
      return res.status(400).json({ error: 'loanReference is required' });
    }
    const result = await services.returnCopy({ loanReference });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/loans/lookup/:ref', async (req, res) => {
  try {
    const data = await services.lookupLoan(req.params.ref);
    if (!data) return res.status(404).json({ error: 'Loan reference not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/members', async (req, res) => {
  try {
    const data = await services.getMembers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/members/:id/loans', async (req, res) => {
  try {
    const data = await services.getMemberLoans(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/holds', async (req, res) => {
  try {
    const { bookId, memberId } = req.body;
    if (!bookId || !memberId) {
      return res.status(400).json({ error: 'bookId and memberId are required' });
    }
    const data = await services.placeHold({ bookId, memberId });
    res.status(201).json(data);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Conflict: You already have a pending hold on this book title' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.get('/admin/audit', async (req, res) => {
  try {
    const data = await services.runDatabaseAudit();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/books', async (req, res) => {
  try {
    const { title, isbn, authorName, category, publicationYear, shelfLocation, copyCount } = req.body;
    const result = await services.addBook({
      title,
      isbn,
      authorName,
      category,
      publicationYear: parseInt(publicationYear, 10),
      shelfLocation,
      copyCount: parseInt(copyCount, 10) || 1
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/admin/members', async (req, res) => {
  try {
    const result = await services.addMember(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
