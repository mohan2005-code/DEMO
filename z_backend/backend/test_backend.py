from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import get_db, Base
import models
import schemas
import os

# Set up clean file-based SQLite database for testing
if os.path.exists("./test_debt_relief.db"):
    try:
        os.remove("./test_debt_relief.db")
    except Exception:
        pass

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_debt_relief.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate all tables
Base.metadata.create_all(bind=engine)

# Override the database dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def run_tests():
    print("=== STARTING BACKEND INTEGRATION TESTS ===")

    # 1. Test Root
    res = client.get("/")
    assert res.status_code == 200, "Root endpoint failed"
    print("[OK] Root endpoint working")

    # 2. Test Register Borrower
    borrower_reg = {
        "username": "alice_borrower",
        "email": "alice@example.com",
        "password": "alicepassword123"
    }
    res = client.post("/api/auth/register", json=borrower_reg)
    assert res.status_code == 200, f"Borrower registration failed: {res.text}"
    print("[OK] Borrower registered successfully with email")

    # 3. Test Authenticate (Login) & Retrieve JWT Token
    login_data = {
        "username": "alice_borrower",
        "password": "alicepassword123"
    }
    res = client.post("/api/auth/login", json=login_data)
    assert res.status_code == 200, f"Borrower login failed: {res.text}"
    borrower_token = res.json()["access_token"]
    borrower_headers = {"Authorization": f"Bearer {borrower_token}"}
    print("[OK] Borrower login successful, JWT token retrieved")

    # 4. Test Access Security (Unauthenticated calls blocked)
    res = client.get("/api/profile")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[OK] Unauthenticated access blocked correctly (401)")

    # 5. Test Profile Operations (Authenticated Borrower)
    res = client.get("/api/profile", headers=borrower_headers)
    assert res.status_code == 200, "Get profile failed"
    profile = res.json()
    assert profile["monthly_income"] == 0.0
    print("[OK] Initial borrower profile read")

    res = client.post("/api/profile", json={"monthly_income": 6000.0, "monthly_expenses": 2500.0}, headers=borrower_headers)
    assert res.status_code == 200, "Update profile failed"
    profile = res.json()
    assert profile["monthly_income"] == 6000.0
    print("[OK] Borrower profile updated successfully")

    # 6. Test Add Loan (Authenticated Borrower)
    loan_data = {
        "lender_name": "Wells Fargo",
        "loan_name": "Personal Loan",
        "outstanding_amount": 15000.0,
        "emi": 600.0,
        "overdue_duration_months": 5,
        "interest_rate": 12.0
    }
    res = client.post("/api/loans", json=loan_data, headers=borrower_headers)
    assert res.status_code == 200, "Add loan failed"
    loan = res.json()
    loan_id = loan["id"]
    borrower_id = loan["user_id"]
    print(f"[OK] Borrower added loan: ID={loan_id}, user_id={borrower_id}")

    # 7. Test Settlement Analysis
    res = client.get("/api/settlement-analysis", headers=borrower_headers)
    assert res.status_code == 200, "Settlement analysis failed"
    analysis = res.json()
    assert analysis["total_debt"] == 15000.0
    assert analysis["monthly_surplus"] == 2900.0  # 6000 - 2500 - 600 = 2900
    assert analysis["recommendations"][0]["suggested_action"] == "Lump-Sum Settlement"
    print(f"[OK] Borrower analysis correct: DSI={analysis['debt_stress_index']} ({analysis['debt_stress_label']})")

    # 8. Test Negotiation Letter Generation
    neg_request = {
        "loan_id": loan_id,
        "strategy_type": "lump_sum"
    }
    res = client.post("/api/negotiate", json=neg_request, headers=borrower_headers)
    assert res.status_code == 200, f"Letter generation failed: {res.text}"
    letter = res.json()
    assert letter["generated_letter"] != ""
    print("[OK] Borrower successfully generated letter")

    # 9. Verify Borrower can see the letter in history logs
    res = client.get("/api/negotiation-history", headers=borrower_headers)
    assert res.status_code == 200
    history = res.json()
    assert len(history) == 1
    assert history[0]["generated_letter"] == letter["generated_letter"]
    print("[OK] Borrower successfully reads letter in history logs")

    # 10. Verify repayment simulation endpoint
    res = client.get("/api/repayment-simulation?extra_payment=500&strategy=avalanche", headers=borrower_headers)
    assert res.status_code == 200, f"Repayment simulation failed: {res.text}"
    sim = res.json()
    assert "timeline" in sim
    assert sim["total_initial_debt"] == 15000.0
    print("[OK] Repayment simulation works correctly")

    # 11. Verify deletion
    res = client.delete(f"/api/loans/{loan_id}", headers=borrower_headers)
    assert res.status_code == 200
    print("[OK] Loan deleted successfully")

    print("=== ALL BACKEND INTEGRATION TESTS PASSED ===")

if __name__ == "__main__":
    run_tests()
