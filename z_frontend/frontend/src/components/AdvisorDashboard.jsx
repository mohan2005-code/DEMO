import React, { useState, useEffect } from 'react';
import { 
  User, ShieldAlert, DollarSign, Sparkles, Copy, 
  Check, FileText, Calendar, RefreshCw, Briefcase, ChevronRight 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function AdvisorDashboard({ token, onLogout, username }) {
  const [borrowers, setBorrowers] = useState([]);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [borrowerAnalysis, setBorrowerAnalysis] = useState(null);
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [borrowerHistory, setBorrowerHistory] = useState([]);
  
  // Negotiation Strategy State (on behalf of borrower)
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [strategy, setStrategy] = useState('hardship');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  const fetchHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchBorrowersList = async () => {
    try {
      setLoadingList(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/advisor/borrowers`, { headers: fetchHeaders });
      if (!res.ok) throw new Error('Failed to fetch borrowers list');
      const data = await res.json();
      setBorrowers(data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch borrower profiles.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchBorrowersList();
  }, []);

  const handleSelectBorrower = async (borrower) => {
    setSelectedBorrower(borrower);
    setLoadingDetail(true);
    setGeneratedLetter('');
    setSelectedLoanId('');
    
    try {
      // 1. Fetch analysis
      const analysisRes = await fetch(`${API_BASE_URL}/api/advisor/borrowers/${borrower.user_id}/analysis`, { headers: fetchHeaders });
      if (!analysisRes.ok) throw new Error('Failed to fetch analysis details');
      const analysisData = await analysisRes.json();
      setBorrowerAnalysis(analysisData);

      // 2. Fetch loans
      const loansRes = await fetch(`${API_BASE_URL}/api/advisor/borrowers/${borrower.user_id}/loans`, { headers: fetchHeaders });
      if (!loansRes.ok) throw new Error('Failed to fetch borrower loans');
      const loansData = await loansRes.json();
      setBorrowerLoans(loansData);

      // 3. Fetch history
      const historyRes = await fetch(`${API_BASE_URL}/api/advisor/borrowers/${borrower.user_id}/negotiation-history`, { headers: fetchHeaders });
      if (!historyRes.ok) throw new Error('Failed to fetch borrower history');
      const historyData = await historyRes.json();
      setBorrowerHistory(historyData);

    } catch (err) {
      console.error(err);
      alert('Error fetching details for ' + borrower.username);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGenerateLetter = async (e) => {
    e.preventDefault();
    if (!selectedLoanId || !selectedBorrower) return;
    
    try {
      setIsGenerating(true);
      setGeneratedLetter('');
      
      const res = await fetch(`${API_BASE_URL}/api/negotiate`, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          loan_id: parseInt(selectedLoanId),
          strategy_type: strategy,
          borrower_id: selectedBorrower.user_id
        })
      });
      
      if (!res.ok) throw new Error('AI Generation failed');
      const data = await res.json();
      setGeneratedLetter(data.generated_letter);
      
      // Refresh history list
      const historyRes = await fetch(`${API_BASE_URL}/api/advisor/borrowers/${selectedBorrower.user_id}/negotiation-history`, { headers: fetchHeaders });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setBorrowerHistory(historyData);
      }
      
      // Refresh borrowers list to capture stress changes
      fetchBorrowersList();
      
    } catch (err) {
      console.error(err);
      alert('Failed to generate letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const getDsiBadge = (label) => {
    switch (label) {
      case 'Low': return 'badge-success';
      case 'Moderate': return 'badge-warning';
      case 'High': return 'badge-danger';
      case 'Critical': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  const getDsiColor = (label) => {
    switch (label) {
      case 'Low': return '#10b981';
      case 'Moderate': return '#f59e0b';
      case 'High': return '#f97316';
      case 'Critical': return '#ef4444';
      default: return '#10b981';
    }
  };

  // Stress Index Gauge values
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dsiVal = borrowerAnalysis?.debt_stress_index ?? 0;
  const dsiLabel = borrowerAnalysis?.debt_stress_label ?? 'Low';
  const dsiOffset = circumference - (dsiVal / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Dashboard Top Area */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={24} className="primary" />
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Financial Advisor Workspace</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Logged in as: <strong>{username}</strong></p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={fetchBorrowersList} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <RefreshCw size={14} /> Refresh List
          </button>
          <button onClick={onLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Borrowers Registry */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="card-title" style={{ justifyContent: 'space-between' }}>
            <span>Borrower Database</span>
            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
              Total: {borrowers.length}
            </span>
          </h3>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {loadingList ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></div>
            </div>
          ) : borrowers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              No registered borrowers found in database.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {borrowers.map((b) => (
                <div 
                  key={b.user_id} 
                  onClick={() => handleSelectBorrower(b)}
                  style={{
                    background: selectedBorrower?.user_id === b.user_id ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${selectedBorrower?.user_id === b.user_id ? 'var(--primary)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-full)',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      <User size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{b.username}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Debt: ${b.total_debt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${getDsiBadge(b.debt_stress_label)}`} style={{ fontSize: '0.7rem' }}>
                      {b.debt_stress_label}
                    </span>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Borrower Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {!selectedBorrower ? (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px', textAlign: 'center' }}>
              <div>
                <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h4>No Borrower Selected</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px', margin: '0.5rem auto 0' }}>
                  Please choose a borrower account from the left database panel to analyze statistics.
                </p>
              </div>
            </div>
          ) : loadingDetail ? (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
              {/* Borrower Financial Summary Overview */}
              <div className="card">
                <h3 className="card-title"><User size={20} className="primary" /> Financial Profile: {selectedBorrower.username}</h3>
                
                <div className="stats-grid" style={{ marginBottom: 0 }}>
                  <div className="stat-box">
                    <span className="stat-label">Total Debt Balance</span>
                    <span className="stat-value danger">
                      ${borrowerAnalysis?.total_debt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Total Monthly EMI</span>
                    <span className="stat-value warning">
                      ${borrowerAnalysis?.total_emi.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Debt-to-Income (DTI)</span>
                    <span className="stat-value primary">
                      {borrowerAnalysis?.debt_to_income_ratio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Monthly Savings Surplus</span>
                    <span className={`stat-value ${borrowerAnalysis?.monthly_surplus >= 0 ? 'success' : 'danger'}`}>
                      ${borrowerAnalysis?.monthly_surplus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stress Index & Recommendations Row */}
              <div className="grid-cols-2">
                {/* Stress Index Gauge */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h4 className="card-title" style={{ width: '100%' }}><ShieldAlert size={18} className="warning" /> Stress Gauge</h4>
                  <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
                    <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r={radius} style={{ fill: 'none', stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: 10 }} />
                      <circle 
                        cx="70" 
                        cy="70" 
                        r={radius} 
                        style={{ 
                          fill: 'none', 
                          strokeWidth: 10, 
                          strokeLinecap: 'round', 
                          transition: 'stroke-dashoffset 0.8s ease' 
                        }}
                        stroke={getDsiColor(dsiLabel)}
                        strokeDasharray={circumference}
                        strokeDashoffset={dsiOffset}
                      />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getDsiColor(dsiLabel) }}>{dsiVal.toFixed(0)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getDsiColor(dsiLabel), textTransform: 'uppercase' }}>{dsiLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations summary */}
                <div className="card">
                  <h4 className="card-title"><FileText size={18} className="primary" /> Action Plan & Recs</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {borrowerAnalysis?.recommendations.map((item, index) => (
                      <div key={index} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 700 }}>{item.loan_name}</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{item.suggested_action}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{item.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loans list table */}
              <div className="card">
                <h4 className="card-title">Borrower Loan Accounts ({borrowerLoans.length})</h4>
                {borrowerLoans.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No loans added by this borrower.</p>
                ) : (
                  <div className="custom-table-container">
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Lender</th>
                          <th>Outstanding</th>
                          <th>EMI</th>
                          <th>Rate</th>
                          <th>Delinquency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {borrowerLoans.map(loan => (
                          <tr key={loan.id}>
                            <td style={{ fontWeight: 600 }}>{loan.loan_name}</td>
                            <td>{loan.lender_name}</td>
                            <td style={{ color: 'var(--danger)' }}>${loan.outstanding_amount.toLocaleString()}</td>
                            <td>${loan.emi.toLocaleString()}</td>
                            <td>{loan.interest_rate}%</td>
                            <td>
                              {loan.overdue_duration_months > 0 ? (
                                <span className="badge badge-warning">{loan.overdue_duration_months} Months</span>
                              ) : (
                                <span className="badge badge-success">Current</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* AI Negotiation Letter Generator */}
              <div className="dashboard-grid">
                {/* Form */}
                <div className="card">
                  <h4 className="card-title"><Sparkles size={18} className="primary" /> Generate Negotiation Letter</h4>
                  <form onSubmit={handleGenerateLetter}>
                    <div className="form-group">
                      <label className="form-label">Select Loan Account</label>
                      <select 
                        className="form-input" 
                        value={selectedLoanId}
                        onChange={(e) => setSelectedLoanId(e.target.value)}
                        style={{ appearance: 'none', background: 'rgba(0,0,0,0.4)', cursor: 'pointer' }}
                        required
                      >
                        <option value="">-- Choose Account --</option>
                        {borrowerLoans.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.loan_name} ({l.lender_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Select Negotiation Strategy</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name="adv_strategy" checked={strategy === 'hardship'} onChange={() => setStrategy('hardship')} />
                          Hardship Concession Request
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name="adv_strategy" checked={strategy === 'lump_sum'} onChange={() => setStrategy('lump_sum')} />
                          Lump-sum Settlement Offer
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name="adv_strategy" checked={strategy === 'interest_rate_reduction'} onChange={() => setStrategy('interest_rate_reduction')} />
                          Interest Rate Concession
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name="adv_strategy" checked={strategy === 'extension'} onChange={() => setStrategy('extension')} />
                          Tenure Extension / Restructure
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: '0.5rem' }}
                      disabled={isGenerating || !selectedLoanId}
                    >
                      <Sparkles size={14} /> {isGenerating ? 'Generating Letter...' : 'Generate on Behalf'}
                    </button>
                  </form>
                </div>

                {/* Generated letter output */}
                {generatedLetter && (
                  <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Generated Letter</span>
                      <button 
                        onClick={handleCopy} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {copiedLetter ? <Check size={12} className="success" /> : <Copy size={12} />} {copiedLetter ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <textarea 
                      readOnly 
                      className="form-input" 
                      style={{ height: '220px', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'none', background: 'rgba(0,0,0,0.3)' }}
                      value={generatedLetter}
                    />
                  </div>
                )}
              </div>

              {/* Negotiation Letters Log */}
              <div className="card">
                <h4 className="card-title">Shared Negotiation Logs ({borrowerHistory.length})</h4>
                {borrowerHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No generated correspondence logs found.</p>
                ) : (
                  <div className="timeline" style={{ marginTop: '0.5rem' }}>
                    {borrowerHistory.map((item) => (
                      <div key={item.id} className="timeline-item" style={{ paddingLeft: '1.5rem' }}>
                        <div className="timeline-header">
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Proposal to {item.lender_name}</span>
                            <span className="badge badge-primary" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                              {item.strategy_type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="timeline-date" style={{ fontSize: '0.75rem' }}>
                            <Calendar size={10} /> {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <pre className="timeline-body" style={{ marginTop: '0.5rem', maxHeight: '120px', fontSize: '0.8rem' }}>{item.generated_letter}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
