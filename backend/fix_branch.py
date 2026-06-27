"""
fix_branch.py
-------------
One-shot script to move a user to the MG Road Branch in Supabase.

Usage:
    cd backend
    source ../.venv/bin/activate
    python fix_branch.py
"""

import sys
from app.database import SessionLocal
from app.models import User, Branch

TARGET_EMAIL  = "pvsaipranav999@gmail.com"
TARGET_BRANCH = "MG Road Branch"
TARGET_CODE   = "BR-MGR-001"

def fix_branch():
    db = SessionLocal()
    try:
        # ── Locate branch ──────────────────────────────────────────────────────
        branch = (
            db.query(Branch).filter(Branch.code == TARGET_CODE).first()
            or db.query(Branch).filter(Branch.name == TARGET_BRANCH).first()
        )
        if not branch:
            print(f"❌  Branch '{TARGET_BRANCH}' ({TARGET_CODE}) not found.")
            print("    Run seed_db.py first: python seed_db.py")
            sys.exit(1)
        print(f"✓  Branch found: {branch.name}  id={branch.id}")

        # ── Locate user ────────────────────────────────────────────────────────
        user = db.query(User).filter(User.email == TARGET_EMAIL).first()
        if not user:
            print(f"❌  User '{TARGET_EMAIL}' not found in the database.")
            print("    Run seed_db.py first: python seed_db.py")
            sys.exit(1)
        print(f"✓  User found: {user.name}  id={user.id}")
        print(f"   Current branch_id: {user.branch_id}")

        # ── Apply updates ──────────────────────────────────────────────────────
        user.branch_id = branch.id
        user.is_active = True          # guarantee they can log in
        branch.manager_id = user.id   # set as branch manager

        db.commit()

        print(f"\n✅  Done!")
        print(f"   {user.name} ({user.email})")
        print(f"   branch_id  → {branch.id}  [{branch.name}]")
        print(f"   is_active  → True")
        print(f"\n   Login: pvsaipranav999@gmail.com / pranav999@@@")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Script failed: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    fix_branch()
