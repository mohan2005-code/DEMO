import React from 'react';
import { Percent, Info, BadgeAlert } from 'lucide-react';

export default function SettlementPredictor({ analysis }) {
  const recommendations = analysis?.recommendations || [];

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'badge-danger';
      case 'Medium': return 'badge-warning';
      case 'Low': return 'badge-primary';
      default: return 'badge-primary';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 2rem' }}>
        <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: '50%' }}>
          <Percent size={32} className="primary" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>AI-Powered Settlement Predictor</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Calculates optimal settlement percentages, recovery discounts, and prioritization levels for each credit account.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="card">
        <h3 className="card-title">Settlement Recommendations & Priorities</h3>
        
        {recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <BadgeAlert size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No active loans found to predict settlement. Please add your loans in the Loans Manager first.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {recommendations.map((rec) => (
              <div 
                key={rec.loan_id} 
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{rec.loan_name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lender: {rec.lender_name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span className={`badge ${getPriorityBadgeClass(rec.priority)}`}>
                      {rec.priority} Repayment Urgency
                    </span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: 0 }} />

                {/* Recommendation Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Suggested Strategy Action
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{rec.suggested_action}</span>
                  </div>
                  
                  {rec.settlement_target_pct ? (
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Optimal Settlement Offer
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--success)' }}>
                        {rec.settlement_target_pct}% of balance (₹{rec.settlement_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Settlement Availability
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not applicable (repay normally)</span>
                    </div>
                  )}

                  <div style={{ gridColumn: 'span 1' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Repayment Status
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {rec.suggested_action === 'Regular Repayment' ? 'Account Current' : 'In Delinquency'}
                    </span>
                  </div>
                </div>

                {/* Analysis Reasoning */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem'
                }}>
                  <Info size={16} className="primary" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {rec.reasoning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
