import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Clock, ShieldCheck, Layers, BookMarked, Library, Users, CheckCircle } from 'lucide-react';
import Catalog from './components/Catalog';
import LoanLookup from './components/LoanLookup';
import MyLoans from './components/MyLoans';
import AdminConsole from './components/AdminConsole';
import DatabaseAudit from './components/DatabaseAudit';
import { fetchStats } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalCopies: 0,
    availableCopies: 0,
    activeLoans: 0,
    overdueLoans: 0,
    totalMembers: 0
  });

  const loadStats = async () => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div>
      <header className="navbar">
        <div className="container navbar-content">
          <div className="logo-group">
            <div className="logo-badge">
              <Library size={20} />
            </div>
            <div>
              <h1 className="logo-title">Library Management System</h1>
              <p className="logo-sub">Advanced DBMS • PostgreSQL Concurrency & Invariants</p>
            </div>
          </div>

          <nav className="nav-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <BookOpen size={16} /> Catalog
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'lookup' ? 'active' : ''}`}
              onClick={() => setActiveTab('lookup')}
            >
              <Search size={16} /> Loan Lookup
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'my-loans' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-loans')}
            >
              <Clock size={16} /> Member Loans
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Layers size={16} /> Admin Console
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <ShieldCheck size={16} /> DBMS Audit
            </button>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingBottom: '4rem' }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <BookMarked size={20} />
            </div>
            <div>
              <div className="stat-val">{stats.totalBooks}</div>
              <div className="stat-lbl">Book Titles</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
              <Layers size={20} />
            </div>
            <div>
              <div className="stat-val">{stats.totalCopies}</div>
              <div className="stat-lbl">Total Copies</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="stat-val">{stats.availableCopies}</div>
              <div className="stat-lbl">Available Copies</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Clock size={20} />
            </div>
            <div>
              <div className="stat-val">{stats.activeLoans}</div>
              <div className="stat-lbl">Active Loans</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="stat-val">{stats.totalMembers}</div>
              <div className="stat-lbl">Patron Members</div>
            </div>
          </div>
        </div>

        {activeTab === 'catalog' && <Catalog onActionCompleted={loadStats} />}
        {activeTab === 'lookup' && <LoanLookup onActionCompleted={loadStats} />}
        {activeTab === 'my-loans' && <MyLoans onActionCompleted={loadStats} />}
        {activeTab === 'admin' && <AdminConsole onActionCompleted={loadStats} />}
        {activeTab === 'audit' && <DatabaseAudit />}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Advanced Data Management System (DBMS) Project
          </p>
          <p>
            Chandigarh University • Department of Computer Science & Engineering
          </p>
        </div>
      </footer>
    </div>
  );
}
