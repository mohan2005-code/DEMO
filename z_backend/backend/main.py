from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
import crud
import ai_engine as gemini_service
import auth
from database import engine, get_db

# Create the database tables
models.Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI-Powered Debt Relief & Financial Recovery Platform API",
    description="Backend API powering role-based financial analysis, secure logins, and AI negotiation letter generation.",
    version="2.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Analysis Logic
def calculate_analysis(db: Session, borrower_id: int) -> schemas.SettlementAnalysisResponse:
    profile = crud.get_financial_profile(db, borrower_id)
    loans = crud.get_loans(db, borrower_id)
    
    total_debt = sum(l.outstanding_amount for l in loans)
    total_emi = sum(l.emi for l in loans)
    
    income = profile.monthly_income
    expenses = profile.monthly_expenses
    
    # Calculate surplus
    monthly_surplus = income - expenses - total_emi
    
    # Calculate DTI
    dti = (total_emi / income * 100) if income > 0 else 0.0
    
    # Calculate Debt Stress Index (DSI)
    dsi_score = 0.0
    
    # 1. DTI factor (max 40 pts)
    if dti < 20:
        dsi_score += 5
    elif dti < 40:
        dsi_score += 15
    elif dti < 60:
        dsi_score += 30
    else:
        dsi_score += 40
        
    # 2. Overdue factor (max 40 pts)
    max_overdue = max((l.overdue_duration_months for l in loans), default=0)
    if max_overdue == 0:
        dsi_score += 0
    elif max_overdue <= 2:
        dsi_score += 15
    elif max_overdue <= 5:
        dsi_score += 30
    else:
        dsi_score += 40
        
    # 3. Monthly surplus factor (max 20 pts)
    if monthly_surplus < 0:
        dsi_score += 20
    elif monthly_surplus < (income * 0.1):  # low surplus buffer
        dsi_score += 10
        
    # Boundary check
    dsi_score = min(max(dsi_score, 0.0), 100.0)
    
    # Labeling DSI
    if dsi_score <= 25:
        dsi_label = "Low"
    elif dsi_score <= 50:
        dsi_label = "Moderate"
    elif dsi_score <= 75:
        dsi_label = "High"
    else:
        dsi_label = "Critical"
        
    # Generate recommendations per loan
    recommendations = []
    for l in loans:
        suggested_action = "Regular Repayment"
        settlement_target_pct = None
        settlement_amount = None
        reasoning = "The account is current and manageable."
        
        if l.overdue_duration_months >= 6:
            suggested_action = "Lump-Sum Settlement"
            settlement_target_pct = 35.0
            settlement_amount = l.outstanding_amount * 0.35
            reasoning = f"Account is severely delinquent ({l.overdue_duration_months} months overdue). A deep settlement (~35%) is highly recommended."
        elif l.overdue_duration_months >= 3:
            suggested_action = "Lump-Sum Settlement"
            settlement_target_pct = 50.0
            settlement_amount = l.outstanding_amount * 0.50
            reasoning = f"Account is {l.overdue_duration_months} months overdue. Requesting a 50% discount settlement is viable due to sustained hardship."
        elif l.overdue_duration_months > 0:
            suggested_action = "Moratorium / EMI Restructuring"
            reasoning = f"Account is in early default ({l.overdue_duration_months} months overdue). Request a temporary payment freeze (moratorium) to stabilize current cash flows."
        elif dti > 45:
            suggested_action = "Tenure Extension / Rate Reduction"
            reasoning = f"Although the account is current, your overall debt stress is high (DTI: {dti:.1f}%). Request a duration extension to decrease your monthly EMI load."
            
        # Determine priority based on overdue duration, interest rate, and EMI burden
        if l.overdue_duration_months >= 3 or (income > 0 and (l.emi / income * 100) > 15 and l.overdue_duration_months > 0):
            priority = "High"
        elif l.overdue_duration_months > 0 or l.interest_rate >= 15.0:
            priority = "Medium"
        else:
            priority = "Low"
            
        recommendations.append(
            schemas.RecommendationItem(
                loan_id=l.id,
                loan_name=l.loan_name,
                lender_name=l.lender_name,
                suggested_action=suggested_action,
                settlement_target_pct=settlement_target_pct,
                settlement_amount=settlement_amount,
                priority=priority,
                reasoning=reasoning
            )
        )
        
    # Sort recommendations according to urgency (High -> Medium -> Low)
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x.priority, 3))
        
    return schemas.SettlementAnalysisResponse(
        debt_stress_index=dsi_score,
        debt_stress_label=dsi_label,
        debt_to_income_ratio=dti,
        monthly_surplus=monthly_surplus,
        total_debt=total_debt,
        total_emi=total_emi,
        recommendations=recommendations
    )

@app.get("/")
def read_root():
    return {"message": "Debt Relief RBAC API is running."}

# Authentication Routes
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    user_data.role = "borrower"
    return crud.create_user(db, user_data)

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, user_data.username)
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

# Financial Profile Routes (scoped)
@app.get("/api/profile", response_model=schemas.FinancialProfile)
def get_profile(
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return crud.get_financial_profile(db, current_user.id)

@app.post("/api/profile", response_model=schemas.FinancialProfile)
def update_profile(
    profile: schemas.FinancialProfileCreate,
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return crud.update_financial_profile(db, profile, current_user.id)

# Loan Routes (scoped)
@app.get("/api/loans", response_model=List[schemas.Loan])
def get_loans(
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return crud.get_loans(db, current_user.id)

@app.post("/api/loans", response_model=schemas.Loan)
def add_loan(
    loan: schemas.LoanCreate,
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return crud.create_loan(db, loan, current_user.id)

@app.delete("/api/loans/{loan_id}")
def delete_loan(
    loan_id: int,
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    success = crud.delete_loan(db, loan_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Loan not found")
    return {"message": "Loan deleted successfully"}

# Analysis Route (scoped to Borrower)
@app.get("/api/settlement-analysis", response_model=schemas.SettlementAnalysisResponse)
def get_settlement_analysis(
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return calculate_analysis(db, current_user.id)

# Negotiation Generation Route (Borrowers and Advisors can generate)
@app.post("/api/negotiate", response_model=schemas.NegotiationHistory)
def generate_negotiation(
    request: schemas.NegotiationRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Establish target borrower ID
    if current_user.role == "advisor":
        if not request.borrower_id:
            raise HTTPException(status_code=400, detail="Advisor must specify borrower_id")
        borrower_id = request.borrower_id
    else:
        borrower_id = current_user.id
        
    # Fetch target loan and verify it belongs to borrower
    loan = crud.get_loan(db, request.loan_id, borrower_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found for this borrower")
        
    # Fetch borrower's financial profile
    profile = crud.get_financial_profile(db, borrower_id)
    
    # Call service to generate letter
    letter_text = gemini_service.generate_negotiation_letter(
        lender_name=loan.lender_name,
        loan_name=loan.loan_name,
        outstanding_amount=loan.outstanding_amount,
        emi=loan.emi,
        overdue_months=loan.overdue_duration_months,
        monthly_income=profile.monthly_income,
        monthly_expenses=profile.monthly_expenses,
        strategy_type=request.strategy_type
    )
    
    # Save letter to borrower's account history
    history_schema = schemas.NegotiationHistoryCreate(
        loan_id=loan.id,
        lender_name=loan.lender_name,
        strategy_type=request.strategy_type,
        generated_letter=letter_text
    )
    
    return crud.create_negotiation_history(db, history_schema, borrower_id)

@app.get("/api/negotiation-history", response_model=List[schemas.NegotiationHistory])
def get_negotiation_history(
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    return crud.get_negotiation_histories(db, current_user.id)

@app.get("/api/repayment-simulation")
def get_repayment_simulation(
    extra_payment: float = 0.0,
    strategy: str = "avalanche",  # "avalanche" or "snowball"
    current_user: models.User = Depends(auth.require_role(["borrower"])),
    db: Session = Depends(get_db)
):
    # Fetch loans and profile
    loans = crud.get_loans(db, current_user.id)
    profile = crud.get_financial_profile(db, current_user.id)
    
    total_debt = sum(l.outstanding_amount for l in loans)
    total_emi = sum(l.emi for l in loans)
    
    # Calculate initial surplus (income - expenses - total emi)
    net_surplus = profile.monthly_income - profile.monthly_expenses - total_emi
    
    total_payment_pool = max(0.0, net_surplus) + total_emi + extra_payment
    
    if total_debt <= 0:
        return {
            "total_months": 0,
            "total_initial_debt": 0.0,
            "timeline": []
        }
        
    if total_payment_pool <= 0:
        return {
            "error": "Insufficient payment pool. Monthly income must exceed living expenses, or you must allocate an extra payment to start payoff simulation."
        }
        
    # Copy active loans state for simulation
    sim_loans = []
    for l in loans:
        sim_loans.append({
            "id": l.id,
            "name": l.loan_name,
            "lender": l.lender_name,
            "balance": l.outstanding_amount,
            "emi": l.emi,
            "interest_rate": l.interest_rate
        })
        
    # Sort according to payoff strategy
    if strategy == "avalanche":
        # Highest interest rate first
        sim_loans.sort(key=lambda x: x["interest_rate"], reverse=True)
    else:
        # Snowball: Smallest balance first
        sim_loans.sort(key=lambda x: x["balance"])
        
    months = []
    month_count = 0
    max_months = 360  # 30-year limit to prevent infinite loops
    current_total_debt = total_debt
    
    while current_total_debt > 0.01 and month_count < max_months:
        month_count += 1
        month_payment = total_payment_pool
        
        # 1. Accrue monthly interest and pay minimum EMIs
        active_emi_sum = 0
        for l in sim_loans:
            if l["balance"] <= 0:
                continue
            
            # Simple monthly interest
            interest = l["balance"] * ((l["interest_rate"] / 100) / 12)
            l["balance"] += interest
            
            # Minimum payment is the lesser of the balance or the EMI
            pay = min(l["balance"], l["emi"])
            l["balance"] -= pay
            month_payment -= pay
            active_emi_sum += pay
            
        # 2. Allocate any remaining monthly cash pool to the highest priority active loan
        if month_payment > 0:
            for l in sim_loans:
                if l["balance"] <= 0:
                    continue
                
                extra = min(l["balance"], month_payment)
                l["balance"] -= extra
                month_payment -= extra
                if month_payment <= 0:
                    break
                    
        # Update current total debt
        current_total_debt = sum(max(0.0, l["balance"]) for l in sim_loans)
        
        # Save snapshot
        months.append({
            "month": month_count,
            "total_balance": round(current_total_debt, 2),
            "payment_made": round(total_payment_pool - max(0.0, month_payment), 2),
            "loans_status": [{
                "id": l["id"],
                "name": l["name"],
                "balance": round(max(0.0, l["balance"]), 2)
            } for l in sim_loans]
        })
        
    return {
        "total_months": month_count,
        "total_initial_debt": round(total_debt, 2),
        "timeline": months
    }



