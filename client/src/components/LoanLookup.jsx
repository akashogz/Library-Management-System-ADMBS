import React, { useState } from 'react';
import { Search, RotateCcw, CheckCircle2, AlertTriangle, FileText, User, Calendar, MapPin } from 'lucide-react';
import { lookupLoan, returnCopy } from '../api';

export default function LoanLookup({ onActionCompleted }) {
  const [loanRefInput, setLoanRefInput] = useState('');
  const [loanData, setLoanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [returnMessage, setReturnMessage] = useState(null);
  const [returning, setReturning] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!loanRefInput.trim()) return;

    setLoading(true);
    setError(null);
    setReturnMessage(null);
    try {
      const data = await lookupLoan(loanRefInput.trim().toUpperCase());
      setLoanData(data);
    } catch (err) {
      setError(err.message);
      setLoanData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!loanData) return;
    setReturning(true);
    setError(null);
    try {
      const res = await returnCopy(loanData.loan_reference);
      setReturnMessage(res);
      const updated = await lookupLoan(loanData.loan_reference);
      setLoanData(updated);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setReturning(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Loan Reference Lookup (LRN)</h2>
          <p className="section-subtitle">Query verified circulation records, shelf allocation, and return transactions</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-box"
              style={{ width: '100%', paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)' }}
              placeholder="Enter 10-character Loan Reference (e.g., LRN-XXXXXXXX)..."
              value={loanRefInput}
              onChange={(e) => setLoanRefInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Querying PostgreSQL...' : 'Lookup Loan'}
          </button>
        </form>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {returnMessage && (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} />
          <div>
            <strong>Book Returned Successfully!</strong> Copy <code className="code-badge">{returnMessage.barcode}</code> status reset to <strong>{returnMessage.nextStatus}</strong>.
            {returnMessage.holdFulfilled && <span> Active reservation queue hold fulfilled!</span>}
            {returnMessage.fineAmount > 0 && (
              <span> Overdue Fine: <strong>INR {returnMessage.fineAmount.toFixed(2)}</strong> ({returnMessage.overdueDays} days overdue).</span>
            )}
          </div>
        </div>
      )}

      {loanData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loan Reference Record</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                {loanData.loan_reference}
              </h3>
            </div>
            <span className={`badge ${loanData.status === 'ACTIVE' ? 'badge-available' : loanData.status === 'OVERDUE' ? 'badge-borrowed' : 'badge-reserved'}`} style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>
              Status: {loanData.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <FileText size={16} /> Book & Physical Inventory
              </h4>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{loanData.title}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>by {loanData.author_name}</p>
              <p style={{ fontSize: '0.85rem' }}>ISBN: <code className="code-badge">{loanData.isbn}</code></p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Barcode: <code className="code-badge">{loanData.barcode}</code></p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#60a5fa' }}>
                <MapPin size={14} /> Shelf Location: <strong>{loanData.shelf_location}</strong>
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <User size={16} /> Patron Information
              </h4>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{loanData.member_name}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Library Card: <code className="code-badge">{loanData.card_number}</code></p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email: {loanData.member_email}</p>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Calendar size={16} /> Circulation Dates & Invariants
              </h4>
              <p style={{ fontSize: '0.85rem' }}>Issue Date: <strong>{new Date(loanData.issue_date).toLocaleDateString()}</strong></p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Due Date: <strong style={{ color: 'var(--accent-amber)' }}>{new Date(loanData.due_date).toLocaleDateString()}</strong></p>
              {loanData.return_date && (
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Return Date: <strong>{new Date(loanData.return_date).toLocaleDateString()}</strong></p>
              )}
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: parseFloat(loanData.estimated_fine) > 0 ? '#f87171' : 'var(--text-muted)' }}>
                Fine Accumulated: <strong>INR {parseFloat(loanData.estimated_fine || 0).toFixed(2)}</strong>
              </p>
            </div>
          </div>

          {loanData.status !== 'RETURNED' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button
                className="btn btn-success"
                disabled={returning}
                onClick={handleReturn}
              >
                <RotateCcw size={16} />
                {returning ? 'Processing Return Transaction...' : 'Process Return & Release Copy'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
