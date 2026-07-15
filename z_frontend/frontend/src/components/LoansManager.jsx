import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function LoansManager({ loans, onAddLoan, onDeleteLoan }) {
  const [loanName, setLoanName] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [amount, setAmount] = useState('');
  const [emi, setEmi] = useState('');
  const [overdueMonths, setOverdueMonths] = useState(0);
  const [rate, setRate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loanName || !lenderName || !amount || !emi) return;

    onAddLoan({
      loan_name: loanName,
      lender_name: lenderName,
      outstanding_amount: parseFloat(amount),
      emi: parseFloat(emi),
      overdue_duration_months: parseInt(overdueMonths) || 0,
      interest_rate: parseFloat(rate) || 0.0
    });

    // Reset Form
    setLoanName('');
    setLenderName('');
    setAmount('');
    setEmi('');
    setOverdueMonths(0);
    setRate('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="grid-cols-2">
        {/* Form to Add Loan */}
        <div className="card">
          <h3 className="card-title"><Plus size={20} className="primary" /> Add Loan Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Loan Type / Name</label>
              <input 
                type="text" 
                placeholder="e.g. Credit Card, Personal Loan, Auto Loan"
                className="form-input" 
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Lender Name</label>
              <input 
                type="text" 
                placeholder="e.g. SBI, HDFC, ICICI Bank"
                className="form-input" 
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                required
              />
            </div>

            <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Outstanding Balance (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  step="1"
                  placeholder="0"
                  className="form-input" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Monthly EMI (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  step="1"
                  placeholder="0"
                  className="form-input" 
                  value={emi}
                  onChange={(e) => setEmi(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Interest Rate (%)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.1"
                  placeholder="e.g. 14.5"
                  className="form-input" 
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Overdue Duration (Months)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0"
                  className="form-input" 
                  value={overdueMonths}
                  onChange={(e) => setOverdueMonths(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={16} /> Add Loan Account
            </button>
          </form>
        </div>

        {/* Informative Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <ShieldAlert size={48} className="danger" style={{ marginBottom: '1rem', display: 'inline-block' }} />
            <h4 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Why accuracy matters</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              The recommendations engine uses your outstanding balance and overdue duration to calculate viable settlement targets.
              Lenders generally become open to settlements once an account is delinquent by 3 months or more, and will write off/settle for lower percentages (30-40%) after 6 months of consecutive non-payment.
            </p>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="card">
        <h3 className="card-title">Active Loan Accounts ({loans.length})</h3>
        {loans.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No loan accounts entered yet. Please fill out the form above to add a loan.
          </p>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Loan Name</th>
                  <th>Lender</th>
                  <th>Outstanding</th>
                  <th>Monthly EMI</th>
                  <th>Interest Rate</th>
                  <th>Overdue Months</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td style={{ fontWeight: 600 }}>{loan.loan_name}</td>
                    <td>{loan.lender_name}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                      ₹{loan.outstanding_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      ₹{loan.emi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>{loan.interest_rate > 0 ? `${loan.interest_rate}%` : 'N/A'}</td>
                    <td>
                      {loan.overdue_duration_months > 0 ? (
                        <span className={`badge ${loan.overdue_duration_months >= 6 ? 'badge-danger' : 'badge-warning'}`}>
                          {loan.overdue_duration_months} Months
                        </span>
                      ) : (
                        <span className="badge badge-success">Current</span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => onDeleteLoan(loan.id)}
                        className="btn btn-danger" 
                        style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}
                        title="Delete Loan"
                      >
                        <Trash2 size={14} />
                      </button>
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
