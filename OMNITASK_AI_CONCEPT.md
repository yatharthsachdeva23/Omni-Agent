# OmniTask AI: Architectural Blueprint & Conceptual Specification

---

## 1. Executive Summary & Vision

**OmniTask AI** is an all-in-one, intelligent multi-agent orchestration ecosystem designed to solve complex, multi-faceted tasks that modern single-model AIs (such as vanilla ChatGPT or Gemini) cannot accomplish on their own.

Today's landscape suffers from two major problems:
1. **User Overwhelm & Knowledge Gap**: There are hundreds of specialized AI agents, models, and tools available (coding specialists, math engines, image generators, video creators, auditors, summarizers). Normal users do not know which model is best suited for their specific sub-problem, nor do they know how to build multi-agent workflows.
2. **Single-Agent Limitations**: High-complexity projects require multi-domain expertise, intermediate validation, state persistence, and cross-model handoffs. A single model invariably loses context, hallucinates, or underperforms in specialized domains.

OmniTask AI solves this by serving as the universal portal: users submit complex goals in plain natural language, along with any necessary data/files. OmniTask AI structures the objective, deploys an ultra-fast System 1 decision engine (**Jev**) to build an optimal execution graph, passes the work through specialized best-in-class workers with intermediate quality reviewers, maintains a single **Common Context Ledger** across all agents, and performs a final evaluation before delivering the result to the user.

---

## 2. Product Offerings: The Two Tracks

### Track 1: Free Tier — The AI Advisor & Suggester
* **Target Audience**: Users looking for advice, self-serve builders, or free-tier users.
* **Functionality**:
  * User describes their complex goal or problem in natural language.
  * The system decomposes the problem into required capabilities.
  * System recommends the exact combination of AI models, agents, and tools best suited for each stage (e.g., *"Use Tool A for data extraction, Model B for mathematical optimization, and Agent C for visual asset creation"*).
  * The user receives this actionable blueprint to execute on their own without OmniTask AI running the compute.

### Track 2: Paid Tier — The Autonomous Omni Execution Engine
* **Target Audience**: Power users, professionals, and enterprises who want end-to-end automated execution.
* **Functionality**:
  * User inputs the natural language request and ingests data/files (documents, datasets, images, specifications).
  * OmniTask AI executes the entire workflow autonomously from structuring, routing, execution, intermediate quality checks, cumulative context logging, to final scoring and delivery.

---

## 3. High-Level Architectural Flowchart

```
                 +---------------------------------------------+
                 |       User Natural Language Prompt          |
                 |      + Uploaded / Ingested Data Files       |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |          1. JSON Structurer Agent           |
                 |  (Normalizes raw prompt + data into typed   |
                 |   state schema for router consumption)      |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |    2. Fast Decision Router (Jev Engine)     |
                 |   (Ultra-fast System 1 classification:      |
                 |    determines sub-task sequence & assigns   |
                 |    each step to the optimal specialized AI) |
                 +---------------------------------------------+
                                        |
                                        v
+=============================================================================+
|                      COMMON CONTEXT ENGINE (BLACKBOARD)                     |
|  - Global State & Execution Ledger                                          |
|  - Shared Memory (Prerequisites, Inputs, Intermediate Outputs)              |
|  - Negative Knowledge Base (Errors, Lint Warnings, Avoidance Directives)    |
|  - Cross-Agent Knowledge Handoff & Synchronization                          |
+=============================================================================+
         |                                           ^               ^
         | Feeds Context                             | Logs Delta    | Logs Review
         v                                           |               |
+-------------------+      Passes Output      +--------------------+ |
| Specialized AI    | ----------------------> | Intermediate       | |
| Worker (e.g.      |                         | Reviewer Agent     |--+
| Math / Code /     |                         | (Domain QA: Code,  |
| Image / Video)    |                         |  Multimodal Vision)|
+-------------------+                         +--------------------+
         |                                               |
         | (Loops through all scheduled sub-tasks)       | Verified Output
         +-----------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |   4. Final Reviewer & Evaluation Agent      |
                 |  - Compares output against original prompt  |
                 |  - Computes Task Completion Score (%)       |
                 |  - Compiles internal audit diagnostics      |
                 +---------------------------------------------+
                                        |
                                        v
                 +---------------------------------------------+
                 |       5. Final Delivery to User             |
                 |  - Finished deliverables & artifacts        |
                 |  - Execution summary & breakdown            |
                 +---------------------------------------------+
```

---

## 4. In-Depth Component Breakdown

### A. Input Ingestion & JSON Structurer Agent
* **Purpose**: Generative prompts from users are ambiguous, messy, and lack structured boundaries. Jev and downstream workers require precise, typed inputs.
* **Mechanism**:
  * Accepts raw natural language, attachments, datasets, and API endpoints.
  * Ingests, parses, and extracts core constraints, input parameters, deliverables, and file references.
  * Emits a strict, validated **JSON State Document** specifying:
    * `primary_goal`: The overarching mission.
    * `prerequisites`: Required data assets and contextual boundaries.
    * `constraints`: Formats, styles, mathematical boundaries, deadlines.
    * `ingested_assets`: Map of file handles and parsed contents.

### B. Fast Decision Router: The "Jev" Engine
* **What is Jev?**:
  * Jev is a high-speed "System One" decision model (developed by TypeSafe AI). Unlike traditional autoregressive LLMs that spend seconds generating prose tokens, Jev is built specifically for deterministic, low-latency (70–500ms), structured decisions and classification.
  * It accepts typed states and questions, returning exact categorical choices, priorities, and confidence scores without output token overhead.
* **Role in OmniTask AI**:
  * Jev acts as the **cerebellum / traffic controller** of OmniTask AI.
  * It evaluates the structured JSON state and computes:
    1. The decomposition of the task into ordered/parallel sub-tasks (a Directed Acyclic Graph - DAG).
    2. Model-to-Task routing: assigns each sub-task to the best-in-class AI model or software (e.g., Code Specialist for Python logic, Math Engine for formal proofs, Diffusion/Multimodal model for asset generation).
    3. Handoff dependencies (which sub-task requires output from which previous sub-task).

### C. The Common Context Window & Shared Blackboard Memory
* **The Core Problem**: In traditional multi-agent systems, agents operate either in isolated silos (amnesia, repeating work, hallucinating baseline facts) or with naive prompt stuffing (context window overflow, losing needle-in-a-haystack instructions).
* **The OmniTask AI Shared Memory Solution**:
  * A centralized, living **Common Context Ledger** shared across all agents in the loop.
  * **Continuous Context Updates (Delta Logging)**:
    * When Sub-Agent $N$ finishes a task, its findings, key parameters, outputs, and any obstacles are appended to the ledger.
    * When Sub-Agent $N+1$ spins up, it does not start from zero. It receives the curated common context containing all prerequisites, what was already solved, what files were produced, and what assumptions were validated.
  * **Negative Knowledge & Error Propagation**:
    * If Sub-Agent $N$ or its intermediate reviewer encountered an error (e.g., an invalid API response, a syntax quirk, a visual artifact, or a failed constraint), that failure and its resolution are logged in the memory.
    * Downstream agents read these "lessons learned" and explicitly avoid repeating the same mistake.
  * **Token-Efficient Context Curating**: The Common Context engine maintains both a raw transaction log and a distilled, active state vector so sub-agents stay within optimal token limits without losing critical continuity.

### D. Specialized Worker AIs
* No single model is treated as a master of all trades. Workers are selected based on proven domain benchmarks:
  * **Code Generation & Architecture**: Deep-reasoning code models.
  * **Mathematical Calculation & Logic**: Formal reasoning and symbolic solver models.
  * **Visual & Image Creation**: State-of-the-art image generation models.
  * **Video & Motion Media**: Video synthesis engines.
  * **Data Auditing & Summarization**: High-context analytical models.
  * **External Tools & Software**: Code interpreters, web searchers, shell environments.

### E. Intermediate Reviewer Agents (Step Quality Control)
* **Purpose**: Prevent compounding errors. A flawed intermediate output must never poison downstream tasks.
* **Mechanism**:
  * Every task output must pass an **Intermediate Reviewer** specifically selected for that medium before being committed to the Common Context.
  * **Multimodal Domain Matching**:
    * If an image was generated, the reviewer is an AI model equipped with multimodal vision capabilities to inspect composition, artifacts, prompt alignment, and resolution.
    * If code was generated, the reviewer is a specialized code linter/tester that validates syntax, edge cases, and safety.
    * If mathematical data was computed, a verification agent double-checks equations and numeric consistency.
  * If the intermediate reviewer approves: output is committed to the Common Context and the pipeline proceeds.
  * If rejected: the reviewer attaches feedback, logs the failure to the Common Context error registry, and requests a targeted retry.

### F. Final Reviewer & Evaluation Agent
* **Purpose**: Complete end-to-end objective benchmarking.
* **Mechanism**:
  * Receives the full history of the Common Context and compares the aggregated output directly against the user's initial natural language request.
  * Computes an objective **Completion Score (%)** assessing how completely and accurately the request was fulfilled.
  * Generates an **Internal Audit Review**:
    * Sub-task execution efficiency.
    * Challenges encountered and how they were mitigated.
    * Confidence score of the final deliverable.
  * Packages the final deliverables, summary report, and files for user presentation.

---

## 5. Architectural Principles

1. **Zero Cold-Starts**: No sub-agent ever starts without prerequisite knowledge from the Common Context.
2. **Deterministic, Ultra-Fast Routing**: Utilizing Jev eliminates seconds of routing latency and guarantees structured, typed decisions.
3. **Domain-Matched Multimodal Verification**: Reviewers must possess the sensory capabilities (vision, code parsing, math validation) required for the asset they inspect.
4. **Resilient Failure Memory**: Mistakes and edge cases become persistent knowledge within the session so no error is repeated twice.
5. **Transparency & Dual-Track Accessibility**: Clear separation between the free educational/recommendation pathway and the automated paid execution engine.
