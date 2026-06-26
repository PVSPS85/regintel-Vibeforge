# RegIntel (Regulatory Intelligence Platform)

RegIntel is a modern, enterprise-grade Regulatory Intelligence and Compliance Management platform. It empowers compliance officers, risk managers, and legal teams to monitor regulatory updates, perform AI-driven impact analysis, collaborate on compliance tasks, and maintain audit-ready oversight across multiple organizational branches.

---

## 🚀 Key Features

### 1. 🔍 Regulatory Monitoring & Impact Assessment
- **Real-Time Feed**: Track amendments, guidelines, and notices from regulatory authorities.
- **Categorization & Filtering**: Filter updates by authority, sector, impact level, and status.
- **Impact Analysis**: Map new regulations to internal policies and branch operations.

### 2. 🧠 RAG-Powered AI Compliance Assistant
- **Document Analysis**: Upload legal circulars and PDFs to automatically parse and index them.
- **Vector Search**: Semantic search over regulatory databases using dense vector embeddings.
- **Action Extraction**: Chat with the AI assistant to extract actionable compliance checklists from complex legal language.

### 3. 👥 Collaboration & Team Workspaces
- **Role-Based Workspaces**: Specialized hubs for Legal, Risk, Operations, and Compliance departments.
- **Task Management**: Create, assign, and track compliance action items directly linked to source regulations.
- **Threaded Discussions**: Discuss policy interpretations and internal audits in-context.

### 4. 🏢 Multi-Branch Oversight & Administration
- **Branch Management**: Assign policies, tasks, and users to specific regional branches.
- **Employee Approvals**: Admin control flow for onboarding and approving compliance staff.
- **Audit Logs**: Trace all access, changes, and approvals for strict regulatory compliance.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 (Vite) with TypeScript
- **Styling**: Modern Vanilla CSS (Sleek dark themes, glassmorphism, responsive grid layouts)
- **State & Routing**: React Router DOM, Context API (for Auth and Session states)

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: SQLite (Development) / PostgreSQL (Production) using SQLAlchemy ORM
- **Authentication**: JWT-based secure OAuth2 scheme with bcrypt password hashing

### AI / RAG Pipeline
- **Vector Search**: Chromadb / custom Vector DB integration for fast semantic query resolution
- **Embeddings**: Sentence Transformers / OpenAI Embeddings models
- **Parsing**: Robust PDF parsing and text chunking engine for legal documents

---

## 🚦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

---

### 💻 1. Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client will be running at [http://localhost:5173](http://localhost:5173).*

---

### ⚙️ 2. Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   *The API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### 🤖 3. AI Agents Pipeline Setup

1. Navigate to the `ai-agents/` directory:
   ```bash
   cd ai-agents
   ```
2. Set up the environment variables:
   - Create a `.env` file containing your model APIs, database credentials, and path configurations.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the indexing or agent service:
   ```bash
   python main.py
   ```

---

## 📂 Project Structure

```
.
├── frontend/             # React SPA (Vite, TypeScript, CSS)
│   ├── src/
│   │   ├── components/   # Shared UI (Sidebar, Topbar, Layout, etc.)
│   │   ├── contexts/     # Auth Context, Global States
│   │   ├── pages/        # Dashboard, Regulations, Admin Panels, Chats
│   │   └── utils/
├── backend/              # FastAPI Application
│   ├── app/
│   │   ├── models.py     # SQLAlchemy DB Models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # Authentication services
│   │   └── main.py       # API entrypoint and routes
├── ai-agents/            # RAG and LLM Agent pipeline
│   ├── src/
│   │   ├── rag/          # Embedder, Parser, and Vector DB controllers
│   │   └── agents.py     # Agent definitions and execution graphs
└── README.md             # Project documentation
```
