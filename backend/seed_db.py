"""
seed_db.py
----------
RegIntel Database Seeder — Run this once to populate Supabase with:
  • 1 Branch  : MG Road Branch (BR-MGR-001)
  • 5 Teams   : IT Security, Risk Management, Compliance, Legal, Retail Banking
  • 10 Users  : Branch Manager + 9 role-based employees, all active
  • 1 Admin   : pranav / pvsaipranav999@gmail.com  (Branch Manager, always active)

Usage:
    cd backend
    source ../.venv/bin/activate
    python seed_db.py
"""

import sys
import uuid
from app.database import SessionLocal
from app import models
from app.models import Branch, User, Team, UserRole
from app.auth import get_password_hash

# ─── Seed Data ─────────────────────────────────────────────────────────────────

BRANCH_ID   = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")
BRANCH_NAME = "MG Road Branch"
BRANCH_CODE = "BR-MGR-001"

# 5 mandatory banking teams with stable UUIDs
TEAMS = [
    {"id": uuid.UUID("bbbbbbbb-0001-0000-0000-000000000001"), "name": "IT Security"},
    {"id": uuid.UUID("bbbbbbbb-0002-0000-0000-000000000002"), "name": "Risk Management"},
    {"id": uuid.UUID("bbbbbbbb-0003-0000-0000-000000000003"), "name": "Compliance"},
    {"id": uuid.UUID("bbbbbbbb-0004-0000-0000-000000000004"), "name": "Legal"},
    {"id": uuid.UUID("bbbbbbbb-0005-0000-0000-000000000005"), "name": "Retail Banking"},
]

# 10 users: index 0 = branch manager (pranav), 1-9 = team leads / employees
USERS = [
    {
        "id":       uuid.UUID("cccccccc-0001-0000-0000-000000000001"),
        "name":     "pranav",
        "email":    "pvsaipranav999@gmail.com",
        "password": "pranav999@@@",
        "role":     UserRole.BRANCH_MANAGER,
        "team":     None,          # Manages the entire branch
    },
    {
        "id":       uuid.UUID("cccccccc-0002-0000-0000-000000000002"),
        "name":     "Arjun Mehta",
        "email":    "arjun.mehta@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.TEAM_LEADER,
        "team":     "IT Security",
    },
    {
        "id":       uuid.UUID("cccccccc-0003-0000-0000-000000000003"),
        "name":     "Priya Nair",
        "email":    "priya.nair@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.TEAM_LEADER,
        "team":     "Risk Management",
    },
    {
        "id":       uuid.UUID("cccccccc-0004-0000-0000-000000000004"),
        "name":     "Rahul Desai",
        "email":    "rahul.desai@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.TEAM_LEADER,
        "team":     "Compliance",
    },
    {
        "id":       uuid.UUID("cccccccc-0005-0000-0000-000000000005"),
        "name":     "Sana Khan",
        "email":    "sana.khan@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.TEAM_LEADER,
        "team":     "Legal",
    },
    {
        "id":       uuid.UUID("cccccccc-0006-0000-0000-000000000006"),
        "name":     "Vikram Bose",
        "email":    "vikram.bose@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.TEAM_LEADER,
        "team":     "Retail Banking",
    },
    {
        "id":       uuid.UUID("cccccccc-0007-0000-0000-000000000007"),
        "name":     "Neha Joshi",
        "email":    "neha.joshi@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.EMPLOYEE,
        "team":     "IT Security",
    },
    {
        "id":       uuid.UUID("cccccccc-0008-0000-0000-000000000008"),
        "name":     "Kabir Das",
        "email":    "kabir.das@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.AUDITOR,
        "team":     "Compliance",
    },
    {
        "id":       uuid.UUID("cccccccc-0009-0000-0000-000000000009"),
        "name":     "Simran Kaur",
        "email":    "simran.kaur@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.EMPLOYEE,
        "team":     "Risk Management",
    },
    {
        "id":       uuid.UUID("cccccccc-0010-0000-0000-000000000010"),
        "name":     "Ravi Varma",
        "email":    "ravi.varma@mgroad.local",
        "password": "Pass@1234",
        "role":     UserRole.EMPLOYEE,
        "team":     "Retail Banking",
    },
]

# ─── Seeder ────────────────────────────────────────────────────────────────────

def seed_database():
    db = SessionLocal()
    try:
        # ── 1. Branch ──────────────────────────────────────────────────────────
        print("\n[1/4] Seeding branch...")
        branch = db.query(Branch).filter(Branch.code == BRANCH_CODE).first()
        if not branch:
            branch = Branch(id=BRANCH_ID, name=BRANCH_NAME, code=BRANCH_CODE)
            db.add(branch)
            db.flush()   # flush so branch.id is available immediately
            print(f"  ✓ Created branch: {BRANCH_NAME} ({BRANCH_CODE})")
        else:
            print(f"  → Branch already exists: {BRANCH_NAME} ({BRANCH_CODE})")

        # ── 2. Users ───────────────────────────────────────────────────────────
        print("\n[2/4] Seeding users...")
        user_objects: dict[str, User] = {}

        for u in USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                hashed = get_password_hash(u["password"])
                new_user = User(
                    id=u["id"],
                    name=u["name"],
                    email=u["email"],
                    hashed_password=hashed,
                    role=u["role"],
                    branch_id=branch.id,
                    is_active=True,
                )
                db.add(new_user)
                db.flush()
                user_objects[u["name"]] = new_user
                print(f"  ✓ Created user: {u['name']} ({u['role'].value})")
            else:
                # Always ensure active & correct role for existing users
                existing.is_active = True
                existing.branch_id = branch.id
                existing.role = u["role"]
                db.flush()
                user_objects[u["name"]] = existing
                print(f"  → Updated user: {u['name']} → active, branch_id set")

        db.commit()

        # ── 3. Teams ───────────────────────────────────────────────────────────
        print("\n[3/4] Seeding teams...")
        team_objects: dict[str, Team] = {}

        # Map team name → leader from USERS list
        leader_map: dict[str, str] = {}
        for u in USERS:
            if u["team"] and u["role"] == UserRole.TEAM_LEADER:
                leader_map[u["team"]] = u["name"]

        for t in TEAMS:
            existing_team = db.query(Team).filter(
                Team.name == t["name"], Team.branch_id == branch.id
            ).first()
            leader_name = leader_map.get(t["name"])
            leader_obj  = user_objects.get(leader_name) if leader_name else None

            if not existing_team:
                new_team = Team(
                    id=t["id"],
                    name=t["name"],
                    branch_id=branch.id,
                    leader_id=leader_obj.id if leader_obj else None,
                )
                db.add(new_team)
                db.flush()
                team_objects[t["name"]] = new_team
                print(f"  ✓ Created team: {t['name']} (leader: {leader_name or 'none'})")
            else:
                if leader_obj:
                    existing_team.leader_id = leader_obj.id
                db.flush()
                team_objects[t["name"]] = existing_team
                print(f"  → Updated team: {t['name']} (leader: {leader_name or 'unchanged'})")

        db.commit()

        # ── 4. Team Membership ─────────────────────────────────────────────────
        print("\n[4/4] Assigning users to teams...")
        for u in USERS:
            if not u["team"]:
                continue
            team_obj = team_objects.get(u["team"])
            user_obj = user_objects.get(u["name"])
            if not team_obj or not user_obj:
                continue
            if user_obj not in team_obj.members:
                team_obj.members.append(user_obj)
                print(f"  ✓ Assigned {u['name']} → {u['team']}")
            else:
                print(f"  → Already a member: {u['name']} in {u['team']}")

        # Set branch manager on branch record
        mgr = user_objects.get("pranav")
        if mgr and branch.manager_id != mgr.id:
            branch.manager_id = mgr.id
            print(f"\n  ✓ Set branch manager → pranav")

        db.commit()
        print("\n✅ Database seeded successfully!\n")
        print("─" * 50)
        print("Login credentials:")
        print(f"  Email   : pvsaipranav999@gmail.com")
        print(f"  Password: pranav999@@@")
        print(f"  Role    : Branch Manager — MG Road Branch")
        print("─" * 50)

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
