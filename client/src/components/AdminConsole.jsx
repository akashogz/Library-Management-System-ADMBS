import React, { useState, useEffect } from 'react';
import { PlusCircle, UserPlus, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { createBook, createMember, fetchMembers } from '../api';

export default function AdminConsole({ onActionCompleted }) {
  const [subTab, setSubTab] = useState('add-book');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [bookForm, setBookForm] = useState({
    title: '',
    isbn: '',
    authorName: '',
    category: 'Computer Science',
    publicationYear: 2024,
    shelfLocation: 'SHELF-X1',
    copyCount: 2
  });

  const [memberForm, setMemberForm] = useState({
    cardNumber: '',
    fullName: '',
    email: '',
    phone: '',
    membershipType: 'STUDENT'
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await createBook(bookForm);
      setSuccessMsg(`Book "${res.book.title}" created with ${res.copies.length} physical copies in PostgreSQL!`);
      setBookForm({
        title: '',
        isbn: '',
        authorName: '',
        category: 'Computer Science',
        publicationYear: 2024,
        shelfLocation: 'SHELF-X1',
        copyCount: 2
      });
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await createMember(memberForm);
      setSuccessMsg(`Member ${res.full_name} (${res.card_number}) registered successfully!`);
      setMemberForm({
        cardNumber: '',
        fullName: '',
        email: '',
        phone: '',
        membershipType: 'STUDENT'
      });
      loadMembers();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Librarian Management Console</h2>
          <p className="section-subtitle">Catalog expansion, physical inventory batching, and patron membership provisioning</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${subTab === 'add-book' ? '' : 'btn-secondary'}`}
          onClick={() => { setSubTab('add-book'); setSuccessMsg(null); setErrorMsg(null); }}
        >
          <PlusCircle size={16} /> Add Book & Physical Copies
        </button>
        <button
          className={`btn ${subTab === 'add-member' ? '' : 'btn-secondary'}`}
          onClick={() => { setSubTab('add-member'); setSuccessMsg(null); setErrorMsg(null); }}
        >
          <UserPlus size={16} /> Register Member
        </button>
        <button
          className={`btn ${subTab === 'members-list' ? '' : 'btn-secondary'}`}
          onClick={() => { setSubTab('members-list'); setSuccessMsg(null); setErrorMsg(null); }}
        >
          <Users size={16} /> Member Directory
        </button>
      </div>

      {successMsg && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <div>{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} />
          <div>{errorMsg}</div>
        </div>
      )}

      {subTab === 'add-book' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Catalog Insertion & Physical Barcode Generation
          </h3>
          <form onSubmit={handleBookSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. Operating System Concepts"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Author Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. Abraham Silberschatz"
                  value={bookForm.authorName}
                  onChange={(e) => setBookForm({ ...bookForm, authorName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  ISBN (13 Digits) *
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  placeholder="e.g. 9781119800361"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Category / Subject *
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Publication Year *
                </label>
                <input
                  type="number"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  min="1400"
                  max="2100"
                  value={bookForm.publicationYear}
                  onChange={(e) => setBookForm({ ...bookForm, publicationYear: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Shelf Location Base *
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. SHELF-A2"
                  value={bookForm.shelfLocation}
                  onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Number of Physical Copies to Add *
                </label>
                <input
                  type="number"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  min="1"
                  max="10"
                  value={bookForm.copyCount}
                  onChange={(e) => setBookForm({ ...bookForm, copyCount: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button type="submit" className="btn">
                <PlusCircle size={16} /> Save Book & Generate Inventory Copies
              </button>
            </div>
          </form>
        </div>
      )}

      {subTab === 'add-member' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Register New Patron Member
          </h3>
          <form onSubmit={handleMemberSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Library Card Number *
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  placeholder="e.g. LIB-STU-1005"
                  value={memberForm.cardNumber}
                  onChange={(e) => setMemberForm({ ...memberForm, cardNumber: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. Ananya Verma"
                  value={memberForm.fullName}
                  onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="input-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. ananya.v@cumail.in"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="input-box"
                  style={{ width: '100%' }}
                  placeholder="e.g. +91 9876500000"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  Membership Classification *
                </label>
                <select
                  className="input-box"
                  style={{ width: '100%' }}
                  value={memberForm.membershipType}
                  onChange={(e) => setMemberForm({ ...memberForm, membershipType: e.target.value })}
                >
                  <option value="STUDENT">Student (5 Books Max Limit)</option>
                  <option value="FACULTY">Faculty (10 Books Max Limit)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button type="submit" className="btn">
                <UserPlus size={16} /> Register Member Account
              </button>
            </div>
          </form>
        </div>
      )}

      {subTab === 'members-list' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Card Number</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Max Limit</th>
                <th>Active Borrowed</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.member_id}>
                  <td><code className="code-badge">{m.card_number}</code></td>
                  <td style={{ fontWeight: 600 }}>{m.full_name}</td>
                  <td>{m.email}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                      {m.membership_type}
                    </span>
                  </td>
                  <td>{m.max_borrow_limit} books</td>
                  <td>
                    <strong style={{ color: parseInt(m.active_borrowed_count, 10) >= m.max_borrow_limit ? '#f87171' : 'var(--accent-emerald)' }}>
                      {m.active_borrowed_count || 0} / {m.max_borrow_limit}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
