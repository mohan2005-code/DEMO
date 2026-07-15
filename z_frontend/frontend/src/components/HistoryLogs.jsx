import React, { useState } from 'react';
import { Archive, Copy, Check, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export default function HistoryLogs({ history }) {
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStrategyLabel = (strategy) => {
    switch(strategy) {
      case 'hardship': return 'Hardship Relief';
      case 'lump_sum': return 'Lump-Sum Settlement';
      case 'interest_rate_reduction': return 'Rate Concession';
      case 'extension': return 'Tenure Extension';
      default: return strategy;
    }
  };

  return (
    <div className="card">
      <h3 className="card-title"><Archive size={20} className="primary" /> Correspondence & Negotiation History</h3>
      
      {history.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          No letters generated yet. Go to the <strong>Settlement & Strategy</strong> tab to generate your first AI letter.
        </p>
      ) : (
        <div className="timeline" style={{ marginTop: '1rem' }}>
          {history.map((item) => {
            const isExpanded = expandedId === item.id;
            const date = new Date(item.created_at).toLocaleString();
            
            return (
              <div key={item.id} className="timeline-item">
                <div className="timeline-header" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(item.id)}>
                  <div>
                    <h4 className="timeline-title" style={{ fontWeight: 700 }}>
                      Proposal to {item.lender_name}
                    </h4>
                    <span 
                      className={`badge badge-primary`} 
                      style={{ marginTop: '0.25rem', display: 'inline-block' }}
                    >
                      {getStrategyLabel(item.strategy_type)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="timeline-date" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {date}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-secondary" /> : <ChevronDown size={16} className="text-secondary" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                      <button 
                        onClick={() => handleCopy(item.id, item.generated_letter)} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        {copiedId === item.id ? <Check size={12} className="success" /> : <Copy size={12} />} 
                        {copiedId === item.id ? ' Copied!' : ' Copy Correspondence'}
                      </button>
                    </div>
                    <pre className="timeline-body">{item.generated_letter}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
