# OmniTask AI 🚀
### Universal Multi-Agent Task Orchestration & AI Decision Ecosystem

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **OmniTask AI** is an all-in-one multi-agent platform designed to tackle complex, multi-stage workflows that standard single-model AIs cannot execute alone. It integrates high-speed task classification via **Jev (System 1)**, interactive planning and user clarification gates, state persistence and error mitigation through a **Common Context Blackboard**, domain-matched intermediate quality gates powered exclusively by **Google Gemini**, and specialist worker execution across **Qwen 2.5 Coder**, **Mistral**, **OpenAI GPT**, and **Flux.1**.

---

## 🌟 Architecture & Model Specialization

```
[User Natural Language Prompt + Ingested Data / Files]
                         │
                         ▼
             [1. JSON Structurer Agent]
                         │
                         ▼
        [2. Jev Fast Decision Router (System 1)]   <── STRICTLY ROUTING ONLY
        (Decomposes into DAG and binds models in <100ms)
                         │
                         ▼
+=============================================================================+
|                      COMMON CONTEXT BLACKBOARD MEMORY                       |
|  - Global Prerequisites & Ingested Assets                                    |
|  - Cumulative Verified State & Artifact Registry                             |
|  - Negative Knowledge Base (Error mitigations & avoidance rules)            |
+=============================================================================+
         │                                                   ▲               ▲
         │ Injects Prerequisites & Avoidance Rules           │ Logs Output   │ Logs Review
         ▼                                                   │               │
+-------------------+      Passes Output      +----------------------------+ │
| Specialist Worker | ──────────────────────> | 3. Gemini Reviewer Agent   |─+
| (Qwen / Mistral / |                         | (Multimodal Vision + AST   |
|  Gemini / GPT /   |                         |  Static Analysis Review)   |
|  Flux.1)          |                         +----------------------------+
+-------------------+                                        │
         │                                                   │ Approved
         └───────────────────(Loop through DAG)──────────────┘
                                     │
                                     ▼
                [4. Final Reviewer & Evaluation Agent]
                - Objective Completion Score (0-100%)
                - Compliance Breakdown & Audit Diagnostics
                                     │
                                     ▼
                        [5. Final Delivery to User]
```

### Specialist Sub-Agent Lineup:
* **Router**: **Jev (Vercel API / TypeSafe)** — *Strictly for Routing Only* ($<100\text{ms}$ System 1 classification).
* **Dedicated Quality Gate**: **Google Gemini 2.0 Flash** — *Strictly for Reviewing Only* (Multimodal visual inspection, code syntax & security QA).
* **Coding Specialist**: **Qwen 2.5 Coder (via Groq Cloud)** — Production-grade Python/TypeScript architecture and type-safe algorithms.
* **Summarizer Specialist**: **Google Gemini 2.0 Flash** — High-context distillation and executive brief synthesis.
* **Legal & Formal Logic Specialist**: **Mistral (Mistral AI)** — Regulatory compliance, contract verification, and mathematical bound proofs.
* **Auditing Specialist**: **OpenAI GPT (GPT-4o-mini)** — Cross-stage integrity checks, factual consistency, and security audits.
* **Visual Asset Specialist**: **Flux.1 (via Pollinations)** — Real-time high-resolution technical infographics and visual renders.

---

## 🚀 Dual-Track Capabilities

### Track 1: Free AI Advisor & Directory (DIY)
* Describe any complex objective in natural language.
* The system breaks down the task and prescribes the exact best-in-class AI models from an onboarded matrix of 40+ leading tools.
* Generates copy-paste prompt templates and a step-by-step DIY roadmap for free self-execution.

### Track 2: Paid Omni Autonomous Execution Engine
* Ingest files, CSVs, documentation, or raw prompts.
* Autonomous pipeline executes structuring, Jev routing, worker processing, intermediate Gemini reviews, Blackboard memory updates, and final delivery with an objective completion score.

---

## 🛠️ Quick Start Guide

### Prerequisites
* **Python 3.12** (`py -3.12` or `python 3.12`)
* **Node.js 20+** & **npm**
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/yatharthsachdeva23/OmniTask-AI.git
cd OmniTask-AI
```

### 2. Setup Python 3.12 Virtual Environment
```bash
# Create venv
py -3.12 -m venv venv

# Activate venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3. Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Configure Environment Credentials (Optional)
Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```
Add your API keys to `backend/.env` for live API calls.  
*(Note: If keys are omitted, OmniTask AI automatically runs smart high-fidelity simulation so you can explore the full UI and agent graph immediately without required billing).*
 
### 5. Launch OmniTask AI
```bash
python run.py
```
Open your browser at:  
👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🧪 Testing & Verification

Run the dedicated test suites to verify sub-agents and endpoints:

```bash
# Verify all 5 specialist models + Gemini review gates
python backend/test_models.py

# Verify end-to-end multi-agent streaming pipeline
python backend/test_pipeline.py

# Verify FastAPI endpoints and frontend delivery
python backend/test_system.py
```

---

## 📁 Repository Structure

```
OmniTask-AI/
├── backend/
│   ├── app/
│   │   ├── advisor/              # Track 1: Tool matrix & recommendation engine
│   │   ├── config.py             # App configuration & environment loader
│   │   ├── core/
│   │   │   ├── blackboard.py     # Common Context Window & Negative Knowledge
│   │   │   ├── evaluator.py      # Final completion scoring & packaging
│   │   │   ├── jev_router.py     # Jev System 1 Fast Router (Routing Only)
│   │   │   └── structurer.py     # JSON Structurer Agent
│   │   ├── main.py               # FastAPI application & static mount
│   │   ├── models/               # Strict Pydantic schemas & contracts
│   │   ├── orchestrator.py       # End-to-end SSE Multi-Agent Loop
│   │   ├── reviewers/            # Dedicated Gemini Multimodal Review Engine
│   │   └── workers/              # Qwen Coder, Mistral, Gemini, GPT, Flux.1
│   ├── requirements.txt          # Python dependencies
│   ├── test_models.py            # Individual specialist model tests
│   ├── test_pipeline.py          # End-to-end pipeline test
│   └── test_system.py            # API endpoint health verification
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components (DAG visualizer, Blackboard feed)
│   │   ├── types.ts              # TypeScript interfaces matching backend models
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── dist/                     # Pre-compiled production UI bundle
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .gitignore                    # Watertight git rules
├── IMPLEMENTATION_PLAN.md        # Technical execution roadmap
├── OMNITASK_AI_CONCEPT.md        # Conceptual specification blueprint
├── README.md                     # Project documentation
└── run.py                        # Single-command launcher
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
