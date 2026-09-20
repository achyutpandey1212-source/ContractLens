# ContractLens 🔍⚖️
> **Autonomous Multi-Agent Legal Intelligence Platform with Resumable Orchestration & Deterministic Risk Scoring**

ContractLens transforms lengthy, high-risk PDF legal agreements into actionable insights in seconds. Powered by **dual Groq Cloud LLMs**, **Google Gemini**, an **event-driven n8n workflow engine**, an **Express/TypeScript/MongoDB** backend, and a high-performance **React 19 + GSAP + Tailwind CSS** frontend.

---

## 📸 Product Interface & Visuals

### 1. Landing & Document Perception
![ContractLens Landing Page](readme-images/Screenshot%202026-09-20%20154111.png)

### 2. Interactive Navigation Overlay
![ContractLens Navigation](readme-images/Screenshot%202026-09-20%20154121.png)

### 3. Real-Time Risk Dashboard
![ContractLens Contract Dashboard](readme-images/Screenshot%202026-09-20%20154134.png)

### 4. Deep-Dive Risk Evaluation & Actionable Recommendations
![ContractLens Risk Analysis View](readme-images/Screenshot%202026-09-20%20154157.png)

### 5. Multi-Agent Resumable n8n Pipeline
![n8n Resumable Multi-Agent Pipeline](readme-images/Screenshot%202026-09-20%20154359.png)

---

## 🌟 Key Innovations & Capabilities

- 🤖 **Multi-Agent Cognitive Pipeline**: Rather than relying on a single monolithic prompt, analysis is partitioned across **four specialized agents** (Clause Extraction, Risk Assessment, Obligation Extraction, Executive Summary).
- ⚡ **Fault-Tolerant Resumable Agent Architecture**: Built-in state caching prevents workflow restarts. If any downstream AI agent hits an API rate limit (e.g. Groq 429), prior stages are preserved on disk. Users can click **[ Try Again ]** to resume *only* the failed agent and complete analysis in milliseconds.
- 📐 **Deterministic Risk Scoring Algorithm**: Moves beyond arbitrary LLM opinions with a mathematical clause-weight matrix combined with missing-clause and low-confidence penalties.
- 🔔 **Multi-Channel Alerting**: Contracts exceeding risk thresholds automatically dispatch high-priority notifications to **Slack** and **Email**.
- 📋 **Automated Obligation Tracking**: Automatically parses actionable duties, responsible parties, and statutory timelines for post-signature compliance.

---

## 🏛️ End-to-End System Architecture

```mermaid
flowchart TD
    subgraph CLIENT["Frontend (React 19 + TypeScript + GSAP)"]
        UI["Upload / Dashboard / Details UI"]
    end

    subgraph BACKEND["Backend (Node.js + Express + MongoDB)"]
        API["REST API (/api/contracts)"]
        DB[(MongoDB Atlas)]
    end

    subgraph N8N_ENGINE["Orchestration Engine (n8n Self-Hosted)"]
        UploadWH["POST /webhook/contract-upload"]
        ResumeWH["POST /webhook/contract-resume"]
        PDFParser["Extract PDF Text"]
        StateFS[("/tmp/contractlens_state/<id>.json")]
        
        subgraph AGENTS["Specialized AI Agents"]
            ClauseAgent["Clause Extraction Agent\n(Groq Model A: qwen3.8-27b)"]
            RiskAgent["Risk Assessment Agent\n(Groq Model B: qwen3.8-27b)"]
            ObligationAgent["Obligation Extraction Agent\n(Groq Model A: qwen3.8-27b)"]
            SummaryAgent["Executive Summary Agent\n(Groq / Gemini)"]
        end
        
        Scorer["Calculate Risk Score\n(Weighted Formula)"]
        Alerts{"Risk >= 0.70?"}
        Slack["Slack Webhook Alert"]
        Email["Email Alert"]
        WebHookResp["Respond to Webhook"]
    end

    UI -->|1. Upload PDF| API
    API -->|2. Multipart Dispatch| UploadWH
    UploadWH --> PDFParser
    PDFParser --> StateFS
    StateFS --> ClauseAgent --> RiskAgent --> ObligationAgent --> SummaryAgent
    SummaryAgent --> Scorer
    Scorer --> Alerts
    Alerts -- Yes --> Slack
    Alerts -- Yes --> Email
    Alerts --> WebHookResp
    WebHookResp -->|3. Complete Analysis JSON| API
    API -->|4. Persist Analysis| DB
    API -->|5. Return Analysis| UI

    UI -.->|Recoverable Retry: POST /api/contracts/:id/retry| API
    API -.->|Resume Trigger: POST /webhook/contract-resume| ResumeWH
    ResumeWH -.->|Bypass Completed & Run Failed Only| SummaryAgent
```

---

## 🔄 Detailed n8n Resumable Agent Pipeline Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Frontend
    participant Backend as Express Server
    participant n8n as n8n Ingestion Webhook
    participant Disk as Local State Cache
    participant LLM1 as Clause & Obligation Agents (Model A)
    participant LLM2 as Risk & Summary Agents (Model B)
    participant Scorer as Risk Calculation & Alerts

    User->>Backend: Upload contract PDF
    Backend->>n8n: POST /webhook/contract-upload (Binary)
    n8n->>Disk: Extract text & write /tmp/contractlens_state/<contractId>.json
    
    rect rgb(240, 245, 255)
        note right of n8n: Stage 1: Clause Extraction
        n8n->>LLM1: Parse clauses & confidence
        LLM1-->>Disk: Persist clauses
    end
    
    rect rgb(240, 245, 255)
        note right of n8n: Stage 2: Risk Assessment
        n8n->>LLM2: Identify risks & assign severity
        LLM2-->>Disk: Persist risks
    end
    
    rect rgb(240, 245, 255)
        note right of n8n: Stage 3: Obligation Tracking
        n8n->>LLM1: Extract duties, parties, due dates
        LLM1-->>Disk: Persist obligations
    end
    
    rect rgb(255, 245, 245)
        note right of n8n: Stage 4: Executive Summary (Rate-Limit Scenario)
        n8n->>LLM2: Request summary
        LLM2--x n8n: Groq 429: TPM/RPM Limit Exceeded
        n8n-->>Backend: HTTP 422 { failed: true, stage: "summary", contractId: "..." }
        Backend-->>User: Show Recoverable Failure: [⚠ Executive Summary] [Try Again]
    end

    rect rgb(245, 255, 245)
        note right of User: User Clicks "Try Again"
        User->>Backend: POST /api/contracts/:id/retry
        Backend->>n8n: POST /webhook/contract-resume { contractId, resumeFrom: "summary" }
        n8n->>Disk: Load existing clauses, risks, obligations
        Note over n8n: Bypasses Stages 1, 2 & 3 instantly from cache
        n8n->>LLM2: Re-run Executive Summary Agent only
        LLM2-->>Disk: Persist summary
        n8n->>Scorer: Merge state & calculate weighted risk
        Scorer-->>Backend: HTTP 200 { clauses, risks, obligations, summary, riskScore }
        Backend->>User: Automatically transition to Contract Details page
    end
```

---

## 📊 Deterministic Risk Scoring Model

The risk calculation engine evaluates risk using an objective weighted matrix:

$$\text{Overall Risk} = \sum (\text{Clause Score} \times \text{Clause Weight}) + \text{Missing Clause Penalties} + \text{Low Confidence Flags}$$

### 1. Clause Weight Distribution
| Clause Domain | Weight | Clause Domain | Weight |
| :--- | :---: | :--- | :---: |
| **Limitation of Liability** | `0.22` | **Data Protection & Security** | `0.18` |
| **Service Level & Support** | `0.16` | **Indemnification** | `0.10` |
| **Term & Termination** | `0.10` | **Fees & Payment Terms** | `0.08` |
| **Intellectual Property** | `0.08` | **Confidentiality** | `0.05` |
| **Effect of Termination** | `0.02` | **Governing Law / Jurisdiction**| `0.01` |

### 2. Severity Scoring Multipliers
- **Critical Risk**: `1.00`
- **High Risk**: `0.75`
- **Medium Risk**: `0.50`
- **Low Risk**: `0.25`
- **None**: `0.00`

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Animation & Transitions**: GSAP (GreenSock), `@gsap/react`
- **Icons**: Lucide React
- **Routing**: React Router v7

### **Backend**
- **Runtime**: Node.js, Express, TypeScript (`tsx`)
- **Database**: MongoDB Atlas via Mongoose
- **File Ingestion**: Multer & Form-Data
- **HTTP Client**: Axios

### **AI & Workflow Orchestration**
- **Engine**: n8n Self-Hosted (Docker)
- **Primary LLM Model A**: Groq Cloud Chat Model (`qwen/qwen3.8-27b`)
- **Primary LLM Model B**: Groq Cloud Chat Model (`qwen/qwen3.8-27b`)
- **Secondary Model**: Google Gemini Chat Model
- **Document Parser**: n8n Native PDF Extraction
- **Notifications**: Slack Webhook, Gmail/SMTP

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker Desktop](https://www.docker.com/) (for n8n self-hosting)
- [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- [Groq API Key](https://console.groq.com/) and [Gemini API Key](https://aistudio.google.com/)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/ContractLens.git
cd ContractLens
```

---

### Step 2: Configure Environment Variables

#### **Backend (`Backend/.env`)**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
N8N_WEBHOOK_URL=http://localhost:5678/webhook/contract-upload
N8N_RESUME_WEBHOOK_URL=http://localhost:5678/webhook/contract-resume
```

#### **Frontend (`Frontend/.env`)**
```env
VITE_API_URL=http://localhost:5000
```

---

### Step 3: Run the n8n Container
```bash
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```
Import the provided `n8n_workflows.json` into your local n8n instance at `http://localhost:5678`.

---

### Step 4: Start Backend & Frontend

#### Terminal 1 — Backend:
```bash
cd Backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

#### Terminal 2 — Frontend:
```bash
cd Frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📂 Project Structure

```text
ContractLens/
├── Backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Contract analysis, CRUD, retry logic
│   │   ├── middleware/      # Multer file upload handlers
│   │   ├── models/          # Mongoose schema (Clauses, Risks, Obligations)
│   │   ├── routes/          # Express route definitions
│   │   ├── app.ts           # Express configuration & CORS
│   │   └── server.ts        # Server bootstrap
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── assets/          # Static assets & illustrations
│   │   ├── components/      # UI components (Buttons, Cards, Header)
│   │   ├── pages/           # Dashboard, UploadContract, ContractDetail
│   │   ├── services/        # Typed API clients & error handlers
│   │   └── App.tsx          # Application shell & routes
│   └── package.json
│
├── readme-images/           # Product screenshots & workflow visual
│   ├── Screenshot 2026-09-20 154111.png  # Landing Hero
│   ├── Screenshot 2026-09-20 154121.png  # Navigation Menu
│   ├── Screenshot 2026-09-20 154134.png  # Contracts Dashboard
│   ├── Screenshot 2026-09-20 154157.png  # Risk Detail Analysis
│   └── Screenshot 2026-09-20 154359.png  # n8n Workflow Graph
│
├── n8n_workflows.json       # Complete exportable n8n workflow
└── README.md
```

---

## 🛡️ License

This project is licensed under the **ISC License**.
