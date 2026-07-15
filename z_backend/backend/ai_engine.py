import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY")
HAS_GEMINI = False

if API_KEY:
    try:
        genai.configure(api_key=API_KEY)
        HAS_GEMINI = True
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")

def generate_fallback_letter(
    lender_name: str,
    loan_name: str,
    outstanding_amount: float,
    emi: float,
    overdue_months: int,
    monthly_income: float,
    monthly_expenses: float,
    strategy_type: str
) -> str:
    """
    Generates a highly realistic, professional negotiation letter using local rule-based templates.
    Used when the Gemini API key is missing or fails.
    """
    surplus = monthly_income - monthly_expenses
    dti = (emi / monthly_income * 100) if monthly_income > 0 else 0
    date_str = "[Current Date]"
    
    header = (
        f"From:\n"
        f"[Your Name]\n"
        f"[Your Address]\n"
        f"[Your Email & Phone Number]\n\n"
        f"Date: {date_str}\n\n"
        f"To:\n"
        f"The Loan Operations Department / Settlement Division\n"
        f"{lender_name}\n"
        f"[Lender Address]\n\n"
        f"Subject: Proposal for Account Resolution - {loan_name} (Outstanding: ₹{outstanding_amount:,.2f})\n\n"
        f"Dear Sir/Madam,\n\n"
    )

    footer = (
        f"\n\nI look forward to your response and hope we can reach a mutually beneficial agreement. "
        f"Please contact me at [Your Phone Number] or via email at [Your Email Address] to discuss this further.\n\n"
        f"Thank you for your understanding and cooperation.\n\n"
        f"Sincerely,\n\n"
        f"[Your Signature]\n"
        f"[Your Name]"
    )

    if strategy_type == "hardship":
        body = (
            f"I am writing to formally request a temporary hardship concession on my {loan_name} account. "
            f"Currently, my financial situation has deteriorated due to unforeseen personal and economic hardships. "
            f"My current monthly income is ₹{monthly_income:,.2f}, while my mandatory living expenses stand at ₹{monthly_expenses:,.2f}, "
            f"leaving me with a monthly surplus of only ₹{surplus:,.2f}. This makes my current EMI of ₹{emi:,.2f} completely unsustainable.\n\n"
            f"Given that my debt-to-income ratio for this account is {dti:.1f}%, I am unable to make full payments "
            f"at this time. I have already fallen behind by {overdue_months} month(s). I request that you consider "
            f"suspending my EMIs for a period of 3 to 6 months (moratorium) or reducing the monthly payment temporarily "
            f"so that I can stabilize my finances without defaulting on my obligations."
        )
    elif strategy_type == "lump_sum":
        target_pct = 40.0 if overdue_months >= 6 else 50.0
        settlement_amt = outstanding_amount * (target_pct / 100.0)
        body = (
            f"I am writing regarding my outstanding {loan_name} account, which has an unpaid balance of ₹{outstanding_amount:,.2f}. "
            f"Due to severe and persistent financial hardship, I am unable to service this debt through regular monthly payments. "
            f"My monthly surplus is only ₹{surplus:,.2f}, which is far below the required EMI of ₹{emi:,.2f}.\n\n"
            f"In order to resolve this account permanently and prevent further delinquency, I would like to propose a one-time "
            f"lump-sum settlement of ₹{settlement_amt:,.2f}, which represents {target_pct:.0f}% of the outstanding balance. "
            f"I have managed to pool this amount together from close family members as a one-time relief effort, and I cannot "
            f"afford any higher amount. If accepted, I can transfer these funds within 5 business days upon receiving your "
            f"written settlement agreement."
        )
    elif strategy_type == "interest_rate_reduction":
        body = (
            f"I am writing to request a restructure of the interest rate on my {loan_name} account. "
            f"Currently, my outstanding balance is ₹{outstanding_amount:,.2f}. "
            f"Due to change in employment/income conditions, my monthly income is now ₹{monthly_income:,.2f} and mandatory expenses "
            f"are ₹{monthly_expenses:,.2f}. The high interest rate is severely compounding my financial stress.\n\n"
            f"I request you to review my account and lower the annual interest rate to a concessionary rate of 5-7%. "
            f"This adjustment will reduce my monthly EMI and enable me to consistently pay off the principal balance "
            f"without default. I want to honor my obligation, and this relief would be instrumental in my recovery."
        )
    elif strategy_type == "extension":
        body = (
            f"I am writing to propose a loan modification and tenure extension for my {loan_name} account. "
            f"I am currently facing a cash flow squeeze due to increased living costs and reduced household income. "
            f"My current EMI of ₹{emi:,.2f} represents {dti:.1f}% of my total income of ₹{monthly_income:,.2f}, which is "
            f"causing extreme debt stress, as my overdue duration has reached {overdue_months} month(s).\n\n"
            f"I would like to request an extension of the remaining loan term. By spreading the outstanding "
            f"balance of ₹{outstanding_amount:,.2f} over a longer period, my monthly EMI would decrease to a manageable "
            f"amount. This will allow me to restart regular, timely payments and fully repay the loan without requiring "
            f"a write-off or settlement."
        )
    else:
        body = (
            f"I am writing to discuss a payment arrangement for my {loan_name} account. "
            f"I am facing financial stress and would like to coordinate with your department to find a mutually "
            f"workable resolution for the outstanding balance of ₹{outstanding_amount:,.2f}."
        )

    return header + body + footer

def generate_negotiation_letter(
    lender_name: str,
    loan_name: str,
    outstanding_amount: float,
    emi: float,
    overdue_months: int,
    monthly_income: float,
    monthly_expenses: float,
    strategy_type: str
) -> str:
    """
    Generates a negotiation letter. Uses Gemini API if configured, otherwise falls back to local generator.
    """
    if not HAS_GEMINI:
        return generate_fallback_letter(
            lender_name, loan_name, outstanding_amount, emi, overdue_months,
            monthly_income, monthly_expenses, strategy_type
        )
    
    strategy_descriptions = {
        "hardship": "Requesting a temporary hardship concession, such as a payment moratorium (3-6 months) or reduced EMI, explaining a drop in income or cash-flow issues.",
        "lump_sum": "Proposing a one-time lump sum settlement at a discounted rate (suggesting between 30% to 50% of the outstanding debt depending on how severe the case is).",
        "interest_rate_reduction": "Requesting a lower interest rate to reduce the overall EMI load so the debt can be paid off consistently.",
        "extension": "Requesting an extension of the loan duration/tenure to reduce the monthly EMI amount."
    }
    
    desc = strategy_descriptions.get(strategy_type, "a standard debt relief arrangement")
    
    prompt = (
        f"You are a professional financial advisor and consumer advocate helping a borrower write a letter/email to their lender. "
        f"Write a highly professional, polite, yet firm letter to the lender based on the following details:\n\n"
        f"- Lender Name: {lender_name}\n"
        f"- Loan Type/Name: {loan_name}\n"
        f"- Outstanding Balance: ₹{outstanding_amount:,.2f}\n"
        f"- Current Monthly EMI: ₹{emi:,.2f}\n"
        f"- Overdue Duration: {overdue_months} months\n"
        f"- Borrower's Monthly Income: ₹{monthly_income:,.2f}\n"
        f"- Borrower's Monthly Mandatory Expenses: ₹{monthly_expenses:,.2f}\n"
        f"- Strategy Requested: {strategy_type.upper()} ({desc})\n\n"
        f"Make sure to:\n"
        f"1. Structure it like a formal letter with standard placeholders ([Your Name], [Your Address], [Current Date], etc.).\n"
        f"2. Clearly mention the financial details: income, expenses, and why the current EMI is not sustainable in Rupees (₹).\n"
        f"3. Propose the specific relief action (e.g. moratorium, extension, interest reduction, or a lump-sum settlement of around 35-50% of balance).\n"
        f"4. Keep the tone respectful, showing a strong desire to resolve the debt while highlighting the hard financial reality.\n"
        f"Do NOT include any introductory or concluding comments outside the letter itself. Generate only the letter text."
    )

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response.text and response.text.strip():
            return response.text.strip()
        else:
            raise ValueError("Empty response from Gemini")
    except Exception as e:
        print(f"Gemini API generation failed: {e}. Falling back to template...")
        return generate_fallback_letter(
            lender_name, loan_name, outstanding_amount, emi, overdue_months,
            monthly_income, monthly_expenses, strategy_type
        )
