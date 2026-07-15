from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="borrower")  # Default to borrower since advisor/admin are removed

    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("FinancialProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    negotiations = relationship("NegotiationHistory", back_populates="user", cascade="all, delete-orphan")

class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    monthly_income = Column(Float, default=0.0)
    monthly_expenses = Column(Float, default=0.0)

    user = relationship("User", back_populates="profile")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lender_name = Column(String, index=True)
    loan_name = Column(String)
    outstanding_amount = Column(Float, nullable=False)
    emi = Column(Float, nullable=False)
    overdue_duration_months = Column(Integer, default=0)
    interest_rate = Column(Float, default=0.0)

    user = relationship("User", back_populates="loans")
    negotiations = relationship("NegotiationHistory", back_populates="loan", cascade="all, delete-orphan")

class NegotiationHistory(Base):
    __tablename__ = "negotiation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id", ondelete="CASCADE"), nullable=False)
    lender_name = Column(String, nullable=False)
    strategy_type = Column(String, nullable=False)  # 'hardship', 'lump_sum', 'interest_rate_reduction', 'extension'
    generated_letter = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="negotiations")
    loan = relationship("Loan", back_populates="negotiations")
