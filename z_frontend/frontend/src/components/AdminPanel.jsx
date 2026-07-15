import React, { useState, useEffect } from 'react';
import { Shield, User, Save, RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function AdminPanel({ token, onLogout, username }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers: fetchHeaders });
      if (!res.ok) throw new Error('Failed to fetch user list');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve user directory. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      setSuccessMsg('');
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: fetchHeaders,
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update user role');
      }

      setSuccessMsg(`Successfully updated role for user ID: ${userId}`);
      // Refresh local state list
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Workspace Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={24} className="primary" />
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>System Administrator Panel</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Account: <strong>{username}</strong> (Superuser)
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={fetchUsers} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <RefreshCw size={14} /> Refresh Directory
          </button>
          <button onClick={onLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="card">
        <h3 className="card-title">User Account Directory</h3>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--success)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            {successMsg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(255,255,255,0.05)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              display: 'inline-block'
            }}></div>
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Current Role</th>
                  <th>Action / Assign Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{u.id}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      <User size={14} className="primary" /> {u.username}
                      {u.username === username && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'rgba(6, 182, 212, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          You
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-danger' : 
                        u.role === 'advisor' ? 'badge-warning' : 'badge-primary'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 
                         u.role === 'advisor' ? 'Financial Advisor' : 'Borrower'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <select
                          className="form-input"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updatingUserId === u.id || u.username === username}
                          style={{
                            maxWidth: '220px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            cursor: u.username === username ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="borrower">Borrower</option>
                          <option value="advisor">Financial Advisor</option>
                          <option value="admin">System Administrator</option>
                        </select>
                        {updatingUserId === u.id && (
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255,255,255,0.1)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite'
                          }}></div>
                        )}
                      </div>
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
