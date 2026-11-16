const API_BASE = 'http://localhost:5000/api';

export const fetchStats = async () => {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
};

export const fetchCatalog = async (search = '', category = '') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  const res = await fetch(`${API_BASE}/catalog?${params.toString()}`);
  return res.json();
};

export const fetchBookDetails = async (bookId) => {
  const res = await fetch(`${API_BASE}/books/${bookId}`);
  return res.json();
};

export const borrowCopy = async (copyId, memberId, loanDays = 14) => {
  const res = await fetch(`${API_BASE}/loans/borrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ copyId, memberId, loanDays })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Borrow failed');
  }
  return data;
};

export const returnCopy = async (loanReference) => {
  const res = await fetch(`${API_BASE}/loans/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loanReference })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Return failed');
  }
  return data;
};

export const lookupLoan = async (loanReference) => {
  const res = await fetch(`${API_BASE}/loans/lookup/${loanReference}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Loan lookup failed');
  }
  return res.json();
};

export const fetchMembers = async () => {
  const res = await fetch(`${API_BASE}/members`);
  return res.json();
};

export const fetchMemberLoans = async (memberId) => {
  const res = await fetch(`${API_BASE}/members/${memberId}/loans`);
  return res.json();
};

export const placeHold = async (bookId, memberId) => {
  const res = await fetch(`${API_BASE}/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId, memberId })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Place hold failed');
  }
  return data;
};

export const runDatabaseAudit = async () => {
  const res = await fetch(`${API_BASE}/admin/audit`);
  return res.json();
};

export const createBook = async (bookData) => {
  const res = await fetch(`${API_BASE}/admin/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Create book failed');
  }
  return data;
};

export const createMember = async (memberData) => {
  const res = await fetch(`${API_BASE}/admin/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Create member failed');
  }
  return data;
};
