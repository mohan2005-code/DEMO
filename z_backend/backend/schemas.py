from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

# Authentication & User Schemas
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "borrower"

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Financial Profile Schemas
class FinancialProfileBase(BaseModel):
    monthly_income: float
    monthly_expenses: float

class FinancialProfileCreate(FinancialProfileBase):
    pass

class FinancialProfile(FinancialProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

# Loan Schemas
class LoanBase(BaseModel):
    lender_name: str
    loan_name: str
    outstanding_amount: float
    emi: float
    overdue_duration_months: int
    interest_rate: float

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

# Negotiation History Schemas
class NegotiationHistoryBase(BaseModel):
    loan_id: int
    lender_name: str
    strategy_type: str
    generated_letter: str

class NegotiationHistoryCreate(NegotiationHistoryBase):
    pass

class NegotiationHistory(NegotiationHistoryBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Specialized API Request / Response Schemas
class NegotiationRequest(BaseModel):
    loan_id: int
    strategy_type: str  # 'hardship', 'lump_sum', 'interest_rate_reduction', 'extension'
    borrower_id: Optional[int] = None

class RecommendationItem(BaseModel):
    loan_id: int
    loan_name: str
    lender_name: str
    suggested_action: str
    settlement_target_pct: Optional[float] = None
    settlement_amount: Optional[float] = None
    priority: str  # 'High', 'Medium', 'Low'
    reasoning: str

class SettlementAnalysisResponse(BaseModel):
    debt_stress_index: float  # 0 to 100
    debt_stress_label: str    # 'Low', 'Moderate', 'High', 'Critical'
    debt_to_income_ratio: float  # percentage
    monthly_surplus: float
    total_debt: float
    total_emi: float
    recommendations: List[RecommendationItem]

# Advisor Specific Schemas
class BorrowerSummary(BaseModel):
    user_id: int
    username: str
    total_debt: float
    total_emi: float
    debt_stress_index: float
    debt_stress_label: str
    overdue_loans_count: int

# Admin Specific Schemas
class UserRoleUpdate(BaseModel):
    role: str

