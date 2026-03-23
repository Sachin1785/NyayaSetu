# ⚖️ NyayaSetu: Advanced AI-Powered Legal Technology Platform

NyayaSetu is a sophisticated legal technology platform designed to modernize legal research, comparative law analysis, and document intelligence within the Indian legal system. It bridges the critical gap between legacy laws (Indian Penal Code - **IPC**) and the 2024 Bharatiya Nyaya Sanhita (**BNS**), providing legal professionals with precision-engineered research tools.

---

## 🏗️ System Architecture

NyayaSetu is built on a modular, service-oriented architecture designed to ensure a robust separation between public legal research and private document intelligence.

![System Architecture](SYSTEM_ARCHITECTURE.png)

### 1. Legal Core Backend
Manages all statutory law logic, providing bidirectional mapping between IPC and BNS, acting as a virtual legal researcher through the AI Legal Agent.

### 2. Document Intelligence Backend
An isolated environment for user-centric document analysis, enabling context-grounded Q&A over uploaded files while maintaining data privacy.

### 3. Frontend UI
A modern Next.js 14 application providing a unified, responsive interface for all platform services including the Law Comparator, Research Chat, and Case Law Portal.

---

## 🛠️ Features & Capabilities

### 🔍 Law Comparator (IPC ↔ BNS)
The transition to BNS in 2024 necessitates a highly accurate mapping tool for legal practitioners.
- **Bidirectional Mapping**: Instantly find the BNS equivalent of any IPC section and vice-versa.
- **Deep Subsection Extraction**: Precise regex-based parsing for specific subsections (e.g., BNS 2(1)).
- **Semantic Differential Analysis**: Uses LLMs (Groq API) to explain the nuanced differences (additions, deletions, or modifications) between the old and new sections.

### 🤖 NyayaSetu Legal Agent
A state-of-the-art virtual legal researcher that conducts autonomous research workflows.
- **Multilingual Queries**: Supports queries in Hindi and regional languages, intelligently translating them for retrieval while responding in the user's native language.
- **Verified Reasoning**: Follows a strict React (Reason+Act) loop: Search statutes → Verify via Case Law → Synthesize answer.
- **Legal Formatting**: Strictly adheres to citation standards, ensuring **Statutes** and *Case Law* are correctly formatted with links to primary sources.

### 📖 Case Law Search Portal
A dedicated portal for exploring the vast Indian Kanoon repository.
- **Advanced Metadata Filtering**: Filter precedents by Court (Supreme Court, High Courts), Date range, and Citation counts.
- **Intelligent Sorting**: Rank results by Relevance, Date, or the number of times a case has been cited.
- **Clean Document Viewer**: Provides judgment text stripped of HTML noise for distraction-free reading.

### 📂 Document Intelligence (Private Doc Q&A)
Analyze personal legal documents in a secure, isolated RAG environment.
- **Multi-format Support**: Ingests PDF, Docx, and Text files.
- **Isolated Vector Indexing**: Creates a temporary ChromaDB instance using `all-MiniLM-L6-v2` embeddings for each session.
- **Grounded Q&A**: LLM responses are strictly grounded in the retrieved context of your uploaded files, minimizing hallucinations.

---

## 🔬 Advanced Retrieval Algorithms

### Hybrid RAG Pipeline (Statutes)
To achieve legal-grade precision, NyayaSetu uses a **Hybrid Retrieval** strategy:
1. **Vector Search (Semantic)**: Uses `BAAI/bge-small-en-v1.5` embeddings to capture the intent and context of a query.
2. **BM25 Search (Keyword)**: A probabilistic ranking function that excels at finding exact matches for section numbers and legal terminology.
3. **Reciprocal Rank Fusion (RRF)**: Merges results from both methods, boosting documents that rank highly in both semantic and keyword density.

### Diversity via MMR
We apply **Maximal Marginal Relevance (MMR)** to avoid redundancy:
- **Formula**: $MMR = \text{argmax}_{D_i \in R \setminus S} [\lambda \cdot \text{Sim}(D_i, Q) - (1 - \lambda) \max_{D_j \in S} \text{Sim}(D_i, D_j)]$
- This ensures that the AI Legal Agent receives a diverse set of laws and precedents, covering different legal perspectives without repeating identical information.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14, React, Tailwind CSS, Lucide Icons |
| **Backend Frameworks** | FastAPI, LangChain, LangGraph |
| **Search Engines** | ChromaDB (Vector), Rank-BM25 (Keyword) |
| **Embeddings** | BGE-small-en-v1.5, Sentence-Transformers |
| **AI Models** | Gemini 1.5 Pro, Groq (Llama-3), Deep-Translator |
| **Data Sources** | Indian Kanoon API, IPC/BNS Mapping Scrapers |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.13+
- Node.js 18+
- API Keys: `GOOGLE_API_KEY`, `INDIAN_KANOON_API_TOKEN`, `GROQ_API_KEY` (stored in `.env`).

### 1. Statutory Core Backend
```bash
cd backend
pip install -r pyproject.toml
python server.py
```

### 2. Document Analysis Backend
```bash
cd backend_doc
pip install -r requirements.txt
python server.py
```

### 3. Frontend Web Application
```bash
cd frontend
npm install
npm run dev
```

---
*Created by the NyayaSetu Development Team*

