import React, { useState, useEffect } from 'react';
import { User, Book, RotateCcw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { fetchMembers, fetchMemberLoans, returnCopy } from '../api';

export default function MyLoans({ onActionCompleted }) {
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returnMessage, setReturnMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      loadLoans(selectedMemberId);
    }
  }, [selectedMemberId]);

  const loadMembers = async () => {
    try {
      const data = await fetchMembers();
      setMembers(data);
      if (data.length > 0) {
        setSelectedMemberId(data[0].member_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLoans = async (memberId) => {
    setLoading(true);
    try {
      const data = await fetchMemberLoans(memberId);
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanReference) => {
    setError(null);
    setReturnMessage(null);
    try {
      const res = await returnCopy(loanReference);
      setReturnMessage(res);
      loadLoans(selectedMemberId);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  const pastLoans = loans.filter(l => l.status === 'RETURNED');

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Member Circulation Dashboard</h2>
          <p className="section-subtitle">Track active borrowings, due dates, fines, and historical circulation records</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
          Select Member Profile:
        </label>
        <select
          className="input-box"
          style={{ width: '100%' }}
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.member_id} value={m.member_id}>
              {m.full_name} ({m.membership_type}) - Card: {m.card_number} [Active: {m.active_borrowed_count || 0}/{m.max_borrow_limit}]
            </option>
          ))}
        </select>
      </div>

      {returnMessage && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <div>
            <strong>Book Returned Successfully!</strong> Ref: <code className="code-badge">{returnMessage.loanReference}</code> | Copy <code className="code-badge">{returnMessage.barcode}</code> returned.
          </div>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} color="var(--primary)" /> Currently Borrowed ({activeLoans.length})
        </h3>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading circulation records...</p>
        ) : activeLoans.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No active borrowed books for this member.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table card" style={{ padding: 0 }}>
              <thead>
                <tr>
                  <th>LRN Reference</th>
                  <th>Book Title</th>
                  <th>Copy Barcode</th>
                  <th>Shelf</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((l) => (
                  <tr key={l.loan_id}>
                    <td><code className="code-badge">{l.loan_reference}</code></td>
                    <td style={{ fontWeight: 600 }}>{l.title}</td>
                    <td><code className="code-badge">{l.barcode}</code></td>
                    <td>{l.shelf_location}</td>
                    <td>{new Date(l.issue_date).toLocaleDateString()}</td>
                    <td><strong style={{ color: 'var(--accent-amber)' }}>{new Date(l.due_date).toLocaleDateString()}</strong></td>
                    <td>
                      <span className={`badge ${l.status === 'ACTIVE' ? 'badge-available' : 'badge-borrowed'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                        onClick={() => handleReturn(l.loan_reference)}
                      >
                        <RotateCcw size={14} /> Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Book size={18} color="var(--accent-emerald)" /> Returned Loan History ({pastLoans.length})
        </h3>

        {pastLoans.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No past loan history on record.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table card" style={{ padding: 0 }}>
              <thead>
                <tr>
                  <th>LRN Reference</th>
                  <th>Book Title</th>
                  <th>Barcode</th>
                  <th>Issued</th>
                  <th>Returned</th>
                  <th>Fine Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pastLoans.map((l) => (
                  <tr key={l.loan_id}>
                    <td><code className="code-badge">{l.loan_reference}</code></td>
                    <td>{l.title}</td>
                    <td><code className="code-badge">{l.barcode}</code></td>
                    <td>{new Date(l.issue_date).toLocaleDateString()}</td>
                    <td>{new Date(l.return_date).toLocaleDateString()}</td>
                    <td>INR {parseFloat(l.fine_amount || 0).toFixed(2)}</td>
                    <td>
                      <span className="badge badge-available">RETURNED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
