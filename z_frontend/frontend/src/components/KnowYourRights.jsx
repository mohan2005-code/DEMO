import React from 'react';
import { ShieldCheck, BookOpen, AlertOctagon, HelpCircle, PhoneCall, Scale } from 'lucide-react';

export default function KnowYourRights() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 2rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
          <ShieldCheck size={32} className="success" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Borrower Rights & Legal Protection Guide</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Empower yourself with financial awareness, legal guidelines, and FDCPA regulations against collection abuse.
          </p>
        </div>
      </div>

      {/* Grid of Rights and Resources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Core Rights */}
        <div className="card">
          <h3 className="card-title" style={{ color: 'var(--danger)' }}>
            <Scale size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Core Consumer Protections
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>FDCPA Boundaries</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Debt collectors are strictly prohibited from calling you before 8:00 AM or after 9:00 PM, calling you at work if your employer prohibits it, or using obscene or abusive language.
              </p>
            </div>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Right to Debt Validation</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Within 30 days of a collector contacting you, you have the right to request a written verification detailing the outstanding balance, the original creditor, and proof that they own the debt.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Cease and Desist Notices</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                You can write a formal "cease communication" letter. Once received, the collector is legally prohibited from contacting you again, except to notify you of specific actions (like a lawsuit).
              </p>
            </div>
          </div>
        </div>

        {/* Action Guide */}
        <div className="card">
          <h3 className="card-title" style={{ color: 'var(--success)' }}>
            <BookOpen size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> AI-Assisted Resolution Steps
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Step 1: Audit and Record Everything</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Keep a dedicated log of every phone call, date, time, collector name, and summary of the conversation. Never agree to verbal payment schedules without written confirmation.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Step 2: Generate Hardship & Settlement Letters</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Use the platform's <strong>Settlement Prediction</strong> guidelines to formulate a sustainable discount rate and generate customized letters in the <strong>Negotiation Email</strong> tab.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Step 3: Secure Written Settlement Agreement</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Before transferring any money, the lender must provide an official settlement offer letter stating: "Payment of $X will resolve the account in full." Keep a copy of this agreement forever.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prohibited collector actions warning */}
      <div className="card" style={{ borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <h3 className="card-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertOctagon size={20} /> Illegal Collection Practices
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '0.5rem' }}>
          Lenders or collection agencies cannot misrepresent the amount of your debt, threaten arrest or seizure of property unless they have the legal right and intention to do so, or contact third parties (friends, neighbors, coworkers) about your debt other than to find your contact details. If this occurs, you can file a formal complaint with the <strong>Federal Trade Commission (FTC)</strong> or the <strong>Consumer Financial Protection Bureau (CFPB)</strong>.
        </p>
      </div>
    </div>
  );
}
