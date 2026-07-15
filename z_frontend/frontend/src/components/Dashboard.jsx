import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldAlert, TrendingUp, HelpCircle, Save, CheckCircle, Play, Calendar } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function Dashboard({ analysis, profile, onUpdateProfile, token }) {
  const [income, setIncome] = useState(profile?.monthly_income || 0);
  const [expenses, setExpenses] = useState(profile?.monthly_expenses || 0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulation State
  const [extraPayment, setExtraPayment] = useState(0);
  const [strategy, setStrategy] = useState('avalanche');
  const [simulationData, setSimulationData] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);

  useEffect(() => {
    setIncome(profile?.monthly_income || 0);
    setExpenses(profile?.monthly_expenses || 0);
  }, [profile]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile(parseFloat(income), parseFloat(expenses));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const runSimulation = async () => {
    if (!token) return;
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/repayment-simulation?extra_payment=${extraPayment}&strategy=${strategy}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to calculate simulation');
      }
      setSimulationData(data);
    } catch (err) {
      console.error(err);
      setSimError(err.message);
      setSimulationData(null);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    if (token && analysis?.total_debt > 0) {
      runSimulation();
    }
  }, [token, extraPayment, strategy, analysis?.total_debt]);

  const dsiVal = analysis?.debt_stress_index ?? 0;
  const dsiLabel = analysis?.debt_stress_label ?? 'Low';
  const dti = analysis?.debt_to_income_ratio ?? 0;
  const surplus = analysis?.monthly_surplus ?? 0;
  const totalDebt = analysis?.total_debt ?? 0;
  const totalEmi = analysis?.total_emi ?? 0;

  // Gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (dsiVal / 100) * circumference;

  const getDsiColor = (label) => {
    switch (label) {
      case 'Low': return '#10b981';
      case 'Moderate': return '#f59e0b';
      case 'High': return '#f97316';
      case 'Critical': return '#ef4444';
      default: return '#10b981';
    }
  };

  const dsiColor = getDsiColor(dsiLabel);

  return (
    <div className="dashboard-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label">Total Outstanding Debt</span>
            <span className="stat-value danger">₹{totalDebt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Monthly EMI</span>
            <span className="stat-value warning">₹{totalEmi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Debt-to-Income (DTI)</span>
            <span className="stat-value primary">{dti.toFixed(1)}%</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Monthly Savings Surplus</span>
            <span className={`stat-value ${surplus >= 0 ? 'success' : 'danger'}`}>
              ₹{surplus.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Repayment Timeline Simulation */}
        <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <h3 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} className="primary" /> Debt Repayment Simulator
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Dynamic Playback</span>
          </h3>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Additional Monthly Contribution (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                className="form-input"
                value={extraPayment}
                onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                placeholder="Enter extra payment e.g. 5000"
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Payoff Strategy</label>
              <select
                className="form-input"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', cursor: 'pointer' }}
              >
                <option value="avalanche">Debt Avalanche (Highest Interest First)</option>
                <option value="snowball">Debt Snowball (Smallest Balance First)</option>
              </select>
            </div>
          </div>

          {simLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : simError ? (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              {simError}
            </div>
          ) : simulationData ? (
            <div>
              <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Projected Payoff Time</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{simulationData.total_months} Months</span>
                </div>
                <div style={{ borderLeft: '1px solid var(--glass-border)' }}></div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Initial Debt Load</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>₹{simulationData.total_initial_debt.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Payoff Timeline Progression</h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <th style={{ padding: '0.5rem 1rem' }}>Month</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Payment Made</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationData.timeline.filter((_, idx) => idx % Math.max(1, Math.floor(simulationData.timeline.length / 10)) === 0 || idx === simulationData.timeline.length - 1).map((m) => (
                      <tr key={m.month}>
                        <td style={{ padding: '0.6rem 1rem' }}>Month {m.month}</td>
                        <td style={{ padding: '0.6rem 1rem' }}>₹{m.payment_made.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.6rem 1rem', color: m.total_balance === 0 ? 'var(--success)' : 'inherit', fontWeight: m.total_balance === 0 ? 800 : 400 }}>
                          {m.total_balance === 0 ? 'CLEARED' : `₹${m.total_balance.toLocaleString('en-IN')}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
              Add a loan portfolio and input standard financial data to calculate payoffs.
            </p>
          )}
        </div>

        {/* Dynamic Financial Health Card */}
        <div className="card">
          <h3 className="card-title"><TrendingUp size={20} className="primary" /> Financial Health Analysis</h3>
          {dsiLabel === 'Low' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                Your financial profile indicates a <strong>Low Debt Stress Level</strong>. Your current debt-to-income ratio and regular repayments are within standard healthy guidelines. 
              </p>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Proactive Measures:</h4>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  <li>Maintain an emergency fund equivalent to 3–6 months of mandatory living expenses.</li>
                  <li>Consider paying extra principal on loans with the highest interest rates (Debt Avalanche method).</li>
                  <li>Avoid taking on any new non-essential liabilities.</li>
                </ul>
              </div>
            </div>
          )}
          {dsiLabel === 'Moderate' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                Your financial profile indicates a <strong>Moderate Debt Stress Level</strong>. While currently manageable, your margins are getting thinner. If your monthly surplus is low, any sudden expense could push you into arrears.
              </p>
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--warning)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Action Guidelines:</h4>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  <li>Audit your monthly spending to identify at least 10-15% in non-essential budget cuts.</li>
                  <li>If interest rates are high, evaluate options for debt consolidation at a lower rate.</li>
                  <li>Contact lenders to inquire about tenure extension options to lower your monthly EMIs.</li>
                </ul>
              </div>
            </div>
          )}
          {dsiLabel === 'High' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                Your financial profile indicates a <strong>High Debt Stress Level</strong>. Your debt servicing absorbs a large portion of your income, leaving you with very little or negative monthly surplus. Immediate intervention is required to avoid persistent defaults.
              </p>
              <div style={{ background: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: '#f97316', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Urgent Actions Recommended:</h4>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  <li>Prioritize repayments: maintain accounts that have not defaulted, while seeking terms restructuring on defaulted accounts.</li>
                  <li>Generate and send **Hardship Relief** or **Interest Concession Request** letters to your lenders.</li>
                  <li>Stop all credit cards usage immediately and switch entirely to cash or debit.</li>
                </ul>
              </div>
            </div>
          )}
          {dsiLabel === 'Critical' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                Your financial profile indicates a <strong>Critical Debt Stress Level</strong>. You have significant overdue accounts, a massive DTI ratio, or a highly negative monthly surplus. You are in severe default, and aggressive debt resolution is necessary.
              </p>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Mandatory Recovery Actions:</h4>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  <li>Utilize the platform's **Settlement Proposal Generator** to draft one-time settlement letters to lenders. Target a settlement between 35% and 50% of the principal balance.</li>
                  <li>Consult a non-profit credit counseling agency or financial lawyer if legal threats are received from creditors.</li>
                  <li>Maintain documentation of all communications, hardship proofs, and written settlement agreements from lenders.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Stress Meter Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 className="card-title" style={{ width: '100%' }}><ShieldAlert size={20} className="warning" /> Debt Stress Index</h3>
          
          <div className="stress-meter-container">
            <div className="stress-gauge">
              <svg className="stress-svg" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={radius} className="stress-bg-circle" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r={radius} 
                  className="stress-val-circle" 
                  stroke={dsiColor}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="stress-label-overlay">
                <span className="stress-label-value" style={{ color: dsiColor }}>{dsiVal.toFixed(0)}</span>
                <span className={`stress-label-text stress-text-${dsiLabel}`}>{dsiLabel}</span>
              </div>
            </div>
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
            The Debt Stress Index measures financial risk based on DTI, outstanding balances, overdue months, and monthly surplus.
          </p>
        </div>

        {/* Profile Editor Card */}
        <div className="card">
          <h3 className="card-title">₹ Financial Profile</h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Monthly Take-Home Income (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                min="0"
                step="1"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Living Expenses (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                min="0"
                step="1"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Excluding active loan EMIs
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Save size={16} /> Save Profile
              </button>
              {saveSuccess && (
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <CheckCircle size={16} /> Saved!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
