import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, FileText, History, LogOut, User, ShieldCheck, Mail, Percent } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LoansManager from './components/LoansManager';
import NegotiationEmail from './components/NegotiationEmail';
import SettlementPredictor from './components/SettlementPredictor';
import KnowYourRights from './components/KnowYourRights';
import HistoryLogs from './components/HistoryLogs';
import AuthScreen from './components/AuthScreen';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const [username, setUsername] = useState(localStorage.getItem('username') || null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState({ monthly_income: 0.0, monthly_expenses: 0.0 });
  const [loans, setLoans] = useState([]);
  const [analysis, setAnalysis] = useState({
    debt_stress_index: 0,
    debt_stress_label: 'Low',
    debt_to_income_ratio: 0,
    monthly_surplus: 0,
    total_debt: 0,
    total_emi: 0,
    recommendations: []
  });
  const [history, setHistory] = useState([]);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Authentication Handlers
  const handleLoginSuccess = (userToken, userRole, name) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('username', name);
    setToken(userToken);
    setRole(userRole);
    setUsername(name);
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setToken(null);
    setRole(null);
    setUsername(null);
    setProfile({ monthly_income: 0.0, monthly_expenses: 0.0 });
    setLoans([]);
    setHistory([]);
    setGeneratedLetter('');
  };

  // Scoped API Auth Headers
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Fetch initial database states (Borrower only)
  const fetchBorrowerData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();

      // 1. Get profile
      const profileRes = await fetch(`${API_BASE_URL}/api/profile`, { headers });
      if (profileRes.status === 401) {
        handleLogout();
        return;
      }
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setProfile(profileData);

      // 2. Get loans
      const loansRes = await fetch(`${API_BASE_URL}/api/loans`, { headers });
      if (!loansRes.ok) throw new Error('Failed to fetch loans');
      const loansData = await loansRes.json();
      setLoans(loansData);

      // 3. Get analysis
      const analysisRes = await fetch(`${API_BASE_URL}/api/settlement-analysis`, { headers });
      if (!analysisRes.ok) throw new Error('Failed to fetch analysis');
      const analysisData = await analysisRes.json();
      setAnalysis(analysisData);

      // 4. Get history
      const historyRes = await fetch(`${API_BASE_URL}/api/negotiation-history`, { headers });
      if (!historyRes.ok) throw new Error('Failed to fetch negotiation history');
      const historyData = await historyRes.json();
      setHistory(historyData);

    } catch (err) {
      console.error(err);
      setError('Could not sync data with backend. Please make sure the FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBorrowerData();
    }
  }, [token]);

  const handleUpdateProfile = async (income, expenses) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ monthly_income: income, monthly_expenses: expenses })
      });
      if (!res.ok) throw new Error('Failed to save profile');
      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      
      // Refresh analysis with new profile calculations
      const analysisRes = await fetch(`${API_BASE_URL}/api/settlement-analysis`, { headers: getAuthHeaders() });
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setAnalysis(analysisData);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
    }
  };

  const handleAddLoan = async (loanData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(loanData)
      });
      if (!res.ok) throw new Error('Failed to add loan');
      
      // Refresh all calculations
      fetchBorrowerData();
    } catch (err) {
      console.error(err);
      alert('Error adding loan');
    }
  };

  const handleDeleteLoan = async (loanId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${loanId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete loan');
      
      // Refresh all calculations
      fetchBorrowerData();
    } catch (err) {
      console.error(err);
      alert('Error deleting loan');
    }
  };

  const handleGenerateLetter = async (loanId, strategyType) => {
    try {
      setIsGenerating(true);
      setGeneratedLetter('');
      
      const res = await fetch(`${API_BASE_URL}/api/negotiate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ loan_id: loanId, strategy_type: strategyType })
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setGeneratedLetter(data.generated_letter);
      
      // Refresh history log list
      const historyRes = await fetch(`${API_BASE_URL}/api/negotiation-history`, { headers: getAuthHeaders() });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      console.error(err);
      alert('AI Generation failed. Check your backend status.');
    } finally {
      setIsGenerating(false);
    }
  };

  // If not authenticated, render login page
  if (!token) {
    return (
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-brand">
            <ShieldCheck size={28} className="success" />
            <span>FinRelief AI Platform</span>
          </div>
        </nav>
        <main className="main-content">
          <AuthScreen onLoginSuccess={handleLoginSuccess} />
        </main>
      </div>
    );
  }

  // Standard Borrower App (Admin & Advisor removed)
  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <ShieldCheck size={28} className="success" />
          <span>FinRelief AI</span>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            <Receipt size={16} /> Loans Manager
          </button>
          <button 
            className={`nav-btn ${activeTab === 'predictor' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictor')}
          >
            <Percent size={16} /> Settlement Predictor
          </button>
          <button 
            className={`nav-btn ${activeTab === 'negotiate' ? 'active' : ''}`}
            onClick={() => setActiveTab('negotiate')}
          >
            <Mail size={16} /> Negotiation Email
          </button>
          <button 
            className={`nav-btn ${activeTab === 'rights' ? 'active' : ''}`}
            onClick={() => setActiveTab('rights')}
          >
            <ShieldCheck size={16} /> Know Your Rights
          </button>
          <button 
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} /> History
          </button>
          
          <div style={{ borderLeft: '1px solid var(--glass-border)', margin: '0 0.5rem' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={14} className="primary" /> {username}
            </span>
            <button 
              onClick={handleLogout} 
              className="nav-btn" 
              style={{ color: 'var(--danger)', padding: '0.4rem 0.8rem' }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Panel */}
      <main className="main-content">
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontWeight: 700 }}>Connection Warning</h4>
            <p style={{ fontSize: '0.9rem' }}>{error}</p>
            <button onClick={fetchBorrowerData} className="btn btn-secondary" style={{ width: 'fit-content', padding: '0.4rem 1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Retry Connecting
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Syncing financial metrics...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                analysis={analysis} 
                profile={profile} 
                onUpdateProfile={handleUpdateProfile} 
                token={token}
              />
            )}
            {activeTab === 'loans' && (
              <LoansManager 
                loans={loans} 
                onAddLoan={handleAddLoan} 
                onDeleteLoan={handleDeleteLoan} 
              />
            )}
            {activeTab === 'predictor' && (
              <SettlementPredictor 
                analysis={analysis} 
              />
            )}
            {activeTab === 'negotiate' && (
              <NegotiationEmail 
                analysis={analysis} 
                onGenerateLetter={handleGenerateLetter}
                isGenerating={isGenerating}
                generatedLetter={generatedLetter}
                onClearLetter={() => setGeneratedLetter('')}
              />
            )}
            {activeTab === 'rights' && (
              <KnowYourRights />
            )}
            {activeTab === 'history' && (
              <HistoryLogs 
                history={history} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
