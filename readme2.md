# 🏦 RegIntel by VibeForge

**An Intelligent, Local-First Banking Compliance & Task Automation Platform.**

[![Frontend: React & Vite](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue)](https://react.dev/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E)](https://supabase.com/)
[![AI: CrewAI & Ollama](https://img.shields.io/badge/AI-CrewAI%20%7C%20Ollama-FF7F50)](https://ollama.com/)

---

## 📖 Overview
**RegIntel** is a role-based compliance platform designed specifically for the Indian banking sector. When regulatory bodies (like the RBI or SEBI) release massive, complex PDF circulars, Branch Managers can upload them to RegIntel. 

Our AI-driven microservice instantly reads, analyzes, and slices these documents into actionable, department-specific tasks (e.g., IT, Operations, Risk) and distributes them to employees on a live dashboard. 

## ✨ Key Features

* 🔒 **Local-First AI Architecture (Enterprise Privacy):** Built with a custom "AI Service Abstraction Layer." During development, the system utilizes **Google Gemini** for speed. For production/demo environments, it instantly swaps to **Ollama (Llama 3.2)** running 100% locally. *Zero sensitive banking data leaves the internal network.*
* 🤖 **Multi-Agent Pipeline:** Utilizes a 6-stage **CrewAI** pipeline running on an isolated microservice (Port 8001) to prevent backend bottlenecks during heavy document processing.
* 🛡️ **Role-Based Access Control (RBAC):** Secure JWT authentication. System Admins see global metrics, Branch Managers manage local compliance, and Employees only see their specific actionable tasks.
* 📊 **Live Supabase Dashboard:** Real-time PostgreSQL database tracking pending tasks, compliance scores, and active team metrics.

---

## 🛠️ Tech Stack

### **Frontend**
* React.js (Vite)
* TypeScript
* Tailwind CSS
* Axios (Secure JWT Interceptors)

### **Backend**
* Python (FastAPI)
* SQLAlchemy
* PyJWT (Authentication)

### **Database**
* Supabase (PostgreSQL Cloud)

### **AI Microservice**
* CrewAI (Agentic Framework)
* Google Gemini (Rapid Dev Provider)
* Ollama / Llama 3.2 (Offline Privacy Provider)

---

## 🏗️ System Architecture

1. **Client (Port 5173):** React UI sends PDF and JWT token.
2. **API Gateway (Port 8000):** FastAPI validates the user, saves the file locally, and updates the Supabase status to `PROCESSING`.
3. **AI Dispatcher:** FastAPI asynchronously calls the isolated AI server.
4. **Agent Engine (Port 8001):** CrewAI ingests the text, processes it through 6 distinct agent roles, and writes the structured tasks directly to the Supabase database.
5. **UI Update:** The React dashboard fetches the live data and displays the newly generated tasks.

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/regintel-vibeforge.git](https://github.com/yourusername/regintel-vibeforge.git)
cd regintel-vibeforge
