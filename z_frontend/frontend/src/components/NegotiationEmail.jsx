import React, { useState } from 'react';
import { Sparkles, Copy, Check, FileText, Mail } from 'lucide-react';

export default function NegotiationEmail({ analysis, onGenerateLetter, isGenerating, generatedLetter, onClearLetter }) {
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [strategy, setStrategy] = useState('hardship');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedLoanId) return;
    onGenerateLetter(parseInt(selectedLoanId), strategy);
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loans = analysis?.recommendations || [];

  return (
    <div className="dashboard-grid">
      {/* Recommendations & Action Plan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <h3 className="card-title">
            <Mail size={20} className="primary" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> 
            Settlement Action Plan
          </h3>
          {loans.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              Add your loan details in the <strong>Loans Manager</strong> to view recommended settlement targets and strategies.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {loans.map((item) => (
                <div 
                  key={item.loan_id} 
                  style={{ 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1.25rem',
                    background: 'rgba(255,255,255,0.01)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      {item.loan_name} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>({item.lender_name})</span>
                    </h4>
                    <span 
                      className={`badge ${
                        item.suggested_action === 'Lump-Sum Settlement' ? 'badge-danger' : 
                        item.suggested_action.includes('Extension') ? 'badge-warning' : 'badge-primary'
                      }`}
                    >
                      {item.suggested_action}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                    {item.reasoning}
                  </p>

                  {item.settlement_target_pct && (
                    <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Target Discount</span>
                        <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.05rem' }}>{item.settlement_target_pct}% Off</span>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--glass-border)' }}></div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Estimated Settlement Amount</span>
                        <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.05rem' }}>
                          ₹{item.settlement_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generator Side panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <h3 className="card-title"><Sparkles size={20} className="primary" /> AI Negotiation Email Generator</h3>
          <form onSubmit={handleGenerate}>
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
                {loans.map(l => (
                  <option key={l.loan_id} value={l.loan_id}>
                    {l.loan_name} ({l.lender_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Negotiation Strategy</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="strategy" 
                    value="hardship"
                    checked={strategy === 'hardship'}
                    onChange={() => setStrategy('hardship')}
                  />
                  Financial Hardship Concession
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="strategy" 
                    value="lump_sum"
                    checked={strategy === 'lump_sum'}
                    onChange={() => setStrategy('lump_sum')}
                  />
                  One-time Lump-sum Settlement
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="strategy" 
                    value="interest_rate_reduction"
                    checked={strategy === 'interest_rate_reduction'}
                    onChange={() => setStrategy('interest_rate_reduction')}
                  />
                  Interest Rate Reduction
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="strategy" 
                    value="extension"
                    checked={strategy === 'extension'}
                    onChange={() => setStrategy('extension')}
                  />
                  Tenure Extension Request
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={isGenerating || !selectedLoanId}
            >
              <Sparkles size={16} /> {isGenerating ? 'Generating Letter...' : 'Generate Letter'}
            </button>
          </form>
        </div>

        {/* Output Letter Area */}
        {generatedLetter && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Generated Letter
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleCopy} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} className="success" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button 
                  onClick={onClearLetter} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              readOnly
              className="form-input"
              style={{ 
                height: '350px', 
                fontFamily: 'monospace', 
                fontSize: '0.85rem', 
                lineHeight: '1.5',
                background: 'rgba(0,0,0,0.3)',
                resize: 'none'
              }}
              value={generatedLetter}
            />
          </div>
        )}
      </div>
    </div>
  );
}
