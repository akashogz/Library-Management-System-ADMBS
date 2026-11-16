import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { runDatabaseAudit } from '../api';

export default function DatabaseAudit() {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    setLoading(true);
    try {
      const data = await runDatabaseAudit();
      setAuditData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Database Concurrency & Invariant Verification</h2>
          <p className="section-subtitle">Real-time PostgreSQL engine assertion against double-allocations, race conditions, and orphan records</p>
        </div>
        <button className="btn" onClick={runAudit} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Executing Assertions...' : 'Run Live Audit'}
        </button>
      </div>

      {auditData && (
        <div>
          <div className={`alert-box ${auditData.passed ? 'alert-success' : 'alert-error'}`} style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <ShieldCheck size={24} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {auditData.passed ? 'All PostgreSQL Invariants & Integrity Constraints Satisfied' : 'Database Discrepancy Detected'}
              </h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Verified against live Neon PostgreSQL cluster at {new Date(auditData.checkedAt).toLocaleTimeString()}.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Active Copy Exclusivity</h4>
                <span className="badge badge-available">
                  <CheckCircle2 size={12} /> Protected
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Enforced by partial unique index: <code className="code-badge">UNIQUE(copy_id) WHERE status IN ('ACTIVE', 'OVERDUE')</code>.
              </p>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                Duplicate Active Loans Detected: <strong style={{ color: 'var(--accent-emerald)' }}>{auditData.duplicateActiveLoans.length}</strong>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Copy State Synchronization</h4>
                <span className="badge badge-available">
                  <CheckCircle2 size={12} /> Synchronized
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Verifies no physical book copy is flagged as AVAILABLE while simultaneously linked to an active loan.
              </p>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                State Mismatches: <strong style={{ color: 'var(--accent-emerald)' }}>{auditData.copyStatusMismatches.length}</strong>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Referential Integrity</h4>
                <span className="badge badge-available">
                  <CheckCircle2 size={12} /> Enforced
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Foreign keys enforce <code className="code-badge">ON DELETE RESTRICT</code> so historical loans can never become orphans.
              </p>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                Orphan Copies: <strong style={{ color: 'var(--accent-emerald)' }}>{auditData.orphanCopies.length}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} /> Relational Schema Entity Breakdown (Schema: <code className="code-badge">lms</code>)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{auditData.counts.authors_count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Authors</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{auditData.counts.books_count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Books</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{auditData.counts.copies_count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Physical Copies</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{auditData.counts.members_count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Members</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{auditData.counts.loans_count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Loans Recorded</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{auditData.counts.holds_count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hold Requests</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
