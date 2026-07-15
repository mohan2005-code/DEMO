from sqlalchemy.orm import Session
import models
import schemas
import auth

# User Authentication CRUD
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user_schema: schemas.UserCreate):
    hashed_pwd = auth.hash_password(user_schema.password)
    db_user = models.User(
        username=user_schema.username,
        email=user_schema.email,
        password_hash=hashed_pwd,
        role=user_schema.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Financial Profile CRUD (scoped to user)
def get_financial_profile(db: Session, user_id: int):
    profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == user_id).first()
    if not profile:
        # Create a default profile if none exists for this user
        profile = models.FinancialProfile(user_id=user_id, monthly_income=0.0, monthly_expenses=0.0)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def update_financial_profile(db: Session, profile_schema: schemas.FinancialProfileCreate, user_id: int):
    profile = get_financial_profile(db, user_id)
    profile.monthly_income = profile_schema.monthly_income
    profile.monthly_expenses = profile_schema.monthly_expenses
    db.commit()
    db.refresh(profile)
    return profile

# Loan CRUD (scoped to user)
def get_loans(db: Session, user_id: int):
    return db.query(models.Loan).filter(models.Loan.user_id == user_id).all()

def get_loan(db: Session, loan_id: int, user_id: int = None):
    query = db.query(models.Loan).filter(models.Loan.id == loan_id)
    if user_id is not None:
        query = query.filter(models.Loan.user_id == user_id)
    return query.first()

def create_loan(db: Session, loan_schema: schemas.LoanCreate, user_id: int):
    db_loan = models.Loan(
        user_id=user_id,
        lender_name=loan_schema.lender_name,
        loan_name=loan_schema.loan_name,
        outstanding_amount=loan_schema.outstanding_amount,
        emi=loan_schema.emi,
        overdue_duration_months=loan_schema.overdue_duration_months,
        interest_rate=loan_schema.interest_rate
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

def delete_loan(db: Session, loan_id: int, user_id: int):
    db_loan = get_loan(db, loan_id, user_id)
    if db_loan:
        db.delete(db_loan)
        db.commit()
        return True
    return False

# Negotiation History CRUD (scoped to user)
def get_negotiation_histories(db: Session, user_id: int):
    return db.query(models.NegotiationHistory).filter(models.NegotiationHistory.user_id == user_id).order_by(models.NegotiationHistory.created_at.desc()).all()

def create_negotiation_history(db: Session, history_schema: schemas.NegotiationHistoryCreate, user_id: int):
    db_history = models.NegotiationHistory(
        user_id=user_id,
        loan_id=history_schema.loan_id,
        lender_name=history_schema.lender_name,
        strategy_type=history_schema.strategy_type,
        generated_letter=history_schema.generated_letter
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

# Advisor Specific CRUD
def get_all_borrowers(db: Session):
    return db.query(models.User).filter(models.User.role == "borrower").all()

# Admin Specific CRUD
def get_all_users(db: Session):
    return db.query(models.User).all()

def update_user_role(db: Session, user_id: int, role: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.role = role
        db.commit()
        db.refresh(user)
        return user
    return None
