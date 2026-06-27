import uuid
from app.database import SessionLocal
from app.models import Branch, User, UserRole
from app.auth import get_password_hash

def seed_database():
    db = SessionLocal()
    try:
        # Predefined branches from seed.sql
        branches_data = [
            ("11111111-1111-1111-1111-111111111111", "Mumbai Corporate Head Office", "BR-MUM-001"),
            ("22222222-2222-2222-2222-222222222222", "Bengaluru Tech & Innovation Hub", "BR-BLR-002"),
            ("33333333-3333-3333-3333-333333333333", "New Delhi Regional Centre", "BR-DEL-003"),
            ("44444444-4444-4444-4444-444444444444", "Chennai Operations Base", "BR-CHN-004"),
            ("55555555-5555-5555-5555-555555555555", "Kolkata Retail Clearing Division", "BR-KOL-005"),
            ("66666666-6666-6666-6666-666666666666", "Hyderabad Risk Management Unit", "BR-HYD-006"),
            ("77777777-7777-7777-7777-777777777777", "Ahmedabad Treasury & Markets", "BR-AMD-007"),
            ("88888888-8888-8888-8888-888888888888", "Pune Rural Outreach Branch", "BR-PUN-008"),
            ("99999999-9999-9999-9999-999999999999", "Jaipur Currency Chest", "BR-JAI-009"),
            ("00000000-0000-0000-0000-000000000000", "Kochi NRI Banking Division", "BR-KOC-010"),
        ]

        print("Seeding branches...")
        for b_id, name, code in branches_data:
            # Check if branch already exists
            existing_branch = db.query(Branch).filter(Branch.code == code).first()
            if not existing_branch:
                new_branch = Branch(
                    id=uuid.UUID(b_id),
                    name=name,
                    code=code
                )
                db.add(new_branch)
                print(f"Added branch: {name} ({code})")
            else:
                print(f"Branch already exists: {name} ({code})")
        db.commit()

        # Seed the manager user
        print("\nChecking manager user...")
        manager_email = "pvsaipranav999@gmail.com"
        existing_user = db.query(User).filter(User.email == manager_email).first()
        
        if not existing_user:
            # Get the Bengaluru branch ID
            blr_branch = db.query(Branch).filter(Branch.code == "BR-BLR-002").first()
            hashed_pw = get_password_hash("pranav999@@@")
            
            # Note: We generate a stable UUID or default UUID for the user
            new_user = User(
                id=uuid.UUID("abababab-abab-abab-abab-abababababab"),
                name="pranav",
                email=manager_email,
                hashed_password=hashed_pw,
                role=UserRole.BRANCH_MANAGER,
                branch_id=blr_branch.id if blr_branch else None,
                is_active=True # Active from start so they can log in
            )
            db.add(new_user)
            db.commit()
            print(f"Created manager user: {manager_email} (associated with BR-BLR-002)")
        else:
            print(f"Manager user {manager_email} already exists.")
            # Ensure the existing user is active and has Branch Manager role
            existing_user.is_active = True
            existing_user.role = UserRole.BRANCH_MANAGER
            db.commit()
            print(f"Updated existing user {manager_email} to active Branch Manager.")
            
    except Exception as e:
        db.rollback()
        print("Error seeding database:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
