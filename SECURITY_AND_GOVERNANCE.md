# 🛡️ RegIntel VibeForge — Security Architecture & Governance Framework

RegIntel VibeForge is engineered specifically for the highly regulated Indian banking sector. It enforces a strict **Zero-Trust Security Architecture**, multi-layered **Role-Based Access Control (RBAC)**, comprehensive **Branch Isolation**, and **Local-First AI Processing** to guarantee data confidentiality and regulatory compliance.

---

## 🔒 1. Zero-Trust Onboarding & Mandatory Manager Approval

No individual can enter or access the platform without explicit administrative verification and approval.

* **Pending Access State:** When a new banking officer registers or requests access via `/request-access`, their account is initialized in a locked **`PENDING`** state.
* **Administrative Gatekeeping:** A user in the `PENDING` state cannot view dashboards, documents, tasks, or chats. Access is completely blocked at the API level.
* **Managerial Authorization:** Only verified **Branch Managers** or **System Administrators** can access the Employee Approvals portal (`/admin/approvals`). Once an administrator reviews the employee's credentials and clicks **Approve**, the user is assigned a specific role and granted access to their designated workspace.

---

## 🏢 2. Multi-Branch Data Isolation & Controlled Branch Transfers

Banking operations are segregated across regional branches to prevent unauthorized lateral data movement.

* **Strict Branch Segregation:** Every employee and team is assigned a immutable `branch_id`. All database queries, chats, tasks, and document views are automatically filtered by the authenticated user's active branch. Employees in *Branch A* cannot see or search for communications or circulars belonging to *Branch B*.
* **Secure Branch Transfer Workflow (`/branch-transfer`):**
  * If an employee relocates or requires access to a different branch, they cannot change their own assignment.
  * The employee must initiate a formal **Branch Transfer Request** specifying the target branch and business justification.
  * The request enters a secure administrative queue. The employee remains restricted to their original branch until a **Branch Manager** or **System Admin** explicitly audits and approves the transfer request. Upon approval, their cryptographic token scope updates dynamically.

---

## 🔑 3. Multi-Layered Role-Based Access Control (RBAC)

Every HTTP request to the backend API is validated using secure **JSON Web Tokens (JWT)** and role verification middleware (`get_current_active_user`).

| Role | Access Scope & Governance Permissions |
| :--- | :--- |
| **System Admin** | Global system oversight, multi-branch audits, executive compliance dashboards, user lifecycle management. |
| **Branch Manager** | Upload regulatory circulars, approve/reject branch personnel, authorize branch transfers, review branch compliance metrics. |
| **Compliance Officer** | Audit regulatory directives, oversee departmental execution, initiate policy reviews. |
| **Department Employee** | Execute assigned team tasks (`Pending` ↔ `Completed`), participate in branch chats, download authorized source documents. |

---

## 📄 4. Secure Document Storage & Authenticated Downloads

* **Protected Filesystem:** Regulatory circulars uploaded to the system are stored in a protected server directory (`uploads/regulations/`) outside of public web root folders.
* **Token-Gated Retrieval:** Direct file URLs are disabled. To view or download an original PDF, the frontend must make an authenticated endpoint request (`GET /regulations/{id}/download`) containing the user's valid `Bearer` token.
* **Real-Time Access Check:** The backend validates user status and branch membership before streaming the PDF binary bytes back to the browser.

---

## 🤖 5. Local-First AI & Enterprise Data Privacy

* **Zero External Data Leakage:** RegIntel VibeForge features an AI Service Abstraction Layer. For production banking environments, the platform connects directly to local **Ollama (Llama 3.2)** models running on isolated internal microservices (Port 8001).
* **Confidential Parsing:** Circular text parsing, compliance obligation slicing, and departmental task generation occur 100% within the bank's internal perimeter. No sensitive financial circulars or employee data ever cross public internet boundaries.

---

## 📜 6. Comprehensive Audit Trails

Every critical security event—including registration requests, manager approvals, task status toggles, PDF downloads, and branch transfer approvals—is recorded with strict timestamps and user IDs in PostgreSQL for regulatory audit readiness.
