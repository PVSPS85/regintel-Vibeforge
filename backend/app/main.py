from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Import all of our routers
from app import (
    auth,
    users,
    branches,
    teams,
    chats,
    tasks,
    notifications,
    regulations,
    admin,
    discussions,
    dashboard
)

# 1. Initialize the FastAPI application
app = FastAPI(
    title="RegIntel API", 
    description="Secure internal banking compliance platform"
)

# 2. Configure CORS so your Next.js frontend can communicate with it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Include all the business logic routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(branches.router)
app.include_router(teams.router)
app.include_router(chats.router)
app.include_router(tasks.router)
app.include_router(notifications.router)
app.include_router(regulations.router)
app.include_router(admin.router)
app.include_router(discussions.router)
app.include_router(dashboard.router)

# 4. Basic Health Check Endpoint
@app.get("/")
def read_root():
    return {"status": "RegIntel API is running securely"}

# 5. Startup event to create tables in PostgreSQL
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)