import React, { useState, useEffect } from 'react';
import { Search, BookOpen, AlertCircle, CheckCircle2, X, ShieldAlert, Bookmark } from 'lucide-react';
import { fetchCatalog, fetchBookDetails, borrowCopy, placeHold, fetchMembers } from '../api';

export default function Catalog({ onActionCompleted }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState(null);
  const [borrowMessage, setBorrowMessage] = useState(null);
  const [borrowError, setBorrowError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCatalog();
    loadMembersList();
  }, [searchTerm, categoryFilter]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await fetchCatalog(searchTerm, categoryFilter);
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembersList = async () => {
    try {
      const data = await fetchMembers();
      setMembers(data);
      if (data.length > 0 && !selectedMemberId) {
        setSelectedMemberId(data[0].member_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBookModal = async (bookId) => {
    setModalLoading(true);
    setSelectedBook(null);
    setBorrowMessage(null);
    setBorrowError(null);
    setSelectedCopyId(null);
    try {
      const data = await fetchBookDetails(bookId);
      setSelectedBook(data);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!selectedCopyId || !selectedMemberId) {
      setBorrowError('Please select a physical book copy and a member.');
      return;
    }
    setSubmitting(true);
    setBorrowError(null);
    setBorrowMessage(null);
    try {
      const res = await borrowCopy(selectedCopyId, selectedMemberId, 14);
      setBorrowMessage({
        ref: res.loan.loan_reference,
        due: res.loan.due_date.split('T')[0],
        barcode: res.copy.barcode
      });
      const updatedBook = await fetchBookDetails(selectedBook.book_id);
      setSelectedBook(updatedBook);
      loadCatalog();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setBorrowError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHold = async () => {
    if (!selectedMemberId) {
      setBorrowError('Please select a member to place a hold.');
      return;
    }
    setSubmitting(true);
    setBorrowError(null);
    setBorrowMessage(null);
    try {
      const res = await placeHold(selectedBook.book_id, selectedMemberId);
      setBorrowMessage({
        holdSuccess: true,
        expiry: res.expiry_date.split('T')[0]
      });
      const updatedBook = await fetchBookDetails(selectedBook.book_id);
      setSelectedBook(updatedBook);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setBorrowError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = Array.from(new Set(books.map(b => b.category))).filter(Boolean);

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Library Book Catalog</h2>
          <p className="section-subtitle">Real-time copy availability, inventory shelf lookup, and atomic borrowing</p>
        </div>
      </div>

      <div className="search-bar-row">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-box"
            style={{ width: '100%', paddingLeft: '2.5rem' }}
            placeholder="Search by book title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="input-box"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading catalog from PostgreSQL...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No books match your search query.</p>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((b) => (
            <div key={b.book_id} className="book-card">
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', marginBottom: '0.75rem' }}>
                  {b.category}
                </span>
                <h3 className="book-title">{b.title}</h3>
                <p className="book-author">by {b.author_name}</p>
              </div>

              <div>
                <div className="book-meta-row">
                  <span>ISBN: <code className="code-badge">{b.isbn}</code></span>
                  <span>Year: {b.publication_year}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span className={`badge ${parseInt(b.available_copies, 10) > 0 ? 'badge-available' : 'badge-borrowed'}`}>
                    {b.available_copies} of {b.total_copies} Available
                  </span>
                  <button
                    className="btn"
                    style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}
                    onClick={() => handleOpenBookModal(b.book_id)}
                  >
                    <BookOpen size={14} /> Copies
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBook && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedBook.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Author: {selectedBook.author_name} ({selectedBook.nationality || 'Academic'})</p>
              </div>
              <button
                className="btn-secondary"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setSelectedBook(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {borrowMessage && (
                <div className="alert-box alert-success">
                  <CheckCircle2 size={18} />
                  <div>
                    {borrowMessage.holdSuccess ? (
                      <p><strong>Hold Placed Successfully!</strong> Valid until {borrowMessage.expiry}. You will receive top priority when a copy is returned.</p>
                    ) : (
                      <p>
                        <strong>Loan Confirmed!</strong> Reference: <code className="code-badge">{borrowMessage.ref}</code> | Copy Barcode: <code className="code-badge">{borrowMessage.barcode}</code> | Due Date: <strong>{borrowMessage.due}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {borrowError && (
                <div className="alert-box alert-error">
                  <AlertCircle size={18} />
                  <div>
                    <strong>Action Blocked:</strong> {borrowError}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Physical Copies Inventory</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Copy Barcode</th>
                        <th>Shelf Location</th>
                        <th>Condition</th>
                        <th>Status</th>
                        <th>Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBook.copies && selectedBook.copies.map((copy) => (
                        <tr key={copy.copy_id} style={{ backgroundColor: selectedCopyId === copy.copy_id ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}>
                          <td><code className="code-badge">{copy.barcode}</code></td>
                          <td>{copy.shelf_location}</td>
                          <td>{copy.condition_status}</td>
                          <td>
                            <span className={`badge ${copy.status === 'AVAILABLE' ? 'badge-available' : copy.status === 'BORROWED' ? 'badge-borrowed' : 'badge-reserved'}`}>
                              {copy.status}
                            </span>
                          </td>
                          <td>
                            {copy.status === 'AVAILABLE' ? (
                              <input
                                type="radio"
                                name="select_copy"
                                checked={selectedCopyId === copy.copy_id}
                                onChange={() => setSelectedCopyId(copy.copy_id)}
                              />
                            ) : (
                              <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>Locked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedBook.holds && selectedBook.holds.length > 0 && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bookmark size={14} /> Active Reservation Queue ({selectedBook.holds.length} waiting)
                  </h4>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', paddingLeft: '1.25rem' }}>
                    {selectedBook.holds.map((h) => (
                      <li key={h.hold_id}>Rank #{h.queue_position}: {h.member_name} (Requested on {new Date(h.hold_date).toLocaleDateString()})</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Borrowing / Holding Member:
                </label>
                <select
                  className="input-box"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.full_name} ({m.membership_type} - {m.card_number}) [Active: {m.active_borrowed_count || 0}/{m.max_borrow_limit}]
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  {selectedBook.copies && selectedBook.copies.some(c => c.status === 'AVAILABLE') ? (
                    <button
                      className="btn"
                      disabled={!selectedCopyId || submitting}
                      onClick={handleBorrow}
                    >
                      <CheckCircle2 size={16} />
                      {submitting ? 'Executing Transaction...' : 'Confirm Atomic Checkout'}
                    </button>
                  ) : (
                    <button
                      className="btn"
                      style={{ backgroundColor: 'var(--accent-amber)' }}
                      disabled={submitting}
                      onClick={handleHold}
                    >
                      <Bookmark size={16} />
                      {submitting ? 'Placing Hold...' : 'Place Hold Reservation'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
