from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the logic class from the other file
from mapper import LegalBackend
from gemini_agent_core import GeminiLegalAgent
import indian_kanoon_lib as ik_api

# ==========================================
# 1. SETUP & LIFECYCLE
# ==========================================
backend = LegalBackend()
agent = None  # Initialize as None, will be loaded when first needed

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Load heavy JSON data only once on startup
#     backend.load_data()
#     yield
#     # Cleanup (optional)



# Initialize FastAPI app before using it
app = FastAPI(title="Legal Diff Engine")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. DATA MODELS
# ==========================================
class LegalRequest(BaseModel):
    law_type: str            # "IPC" or "BNS"
    section: str             # "33", "420", "2"
    subsection: Optional[str] = None  # "1", "a", or null

class ComparisonResponse(BaseModel):
    status: str
    primary_node: Dict[str, Any]
    related_nodes: List[Dict[str, Any]]
    analysis: Dict[str, Any]

class AgentRequest(BaseModel):
    query: str

class AgentResponse(BaseModel):
    status: str
    response: str

class CaseLawSearchRequest(BaseModel):
    query: str
    court: Optional[str] = None  # 'supremecourt', 'highcourts', 'tribunals', etc.
    from_date: Optional[str] = None  # Format: YYYY-MM-DD
    to_date: Optional[str] = None  # Format: YYYY-MM-DD
    sort_by: Optional[str] = "relevance"  # 'relevance', 'date', 'citations'
    max_results: Optional[int] = 10

class CaseLawResponse(BaseModel):
    status: str
    cases: List[Dict[str, Any]]
    total: int

# ==========================================
# 3. ENDPOINTS
# ==========================================

def get_agent():
    """Lazy initialization of the agent to avoid startup delays"""
    global agent
    if agent is None:
        try:
            agent = GeminiLegalAgent()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize legal agent: {str(e)}")
    return agent

@app.post("/compare")
async def compare_laws(request: LegalRequest):
    """
    Comparison Endpoint.
    - For BNS 2(1): Send {"law_type": "BNS", "section": "2", "subsection": "1"}
    - For IPC 33: Send {"law_type": "IPC", "section": "33"}
    """
    law = request.law_type.upper()
    sec_id = request.section.strip()

    # Only BNS supports subsection
    if law == "BNS" and request.subsection:
        clean_sub = request.subsection.strip().replace("(", "").replace(")", "")
        sec_id = f"{sec_id}({clean_sub})"

    query = law + " " + sec_id
    print({query})

    result = backend.process_query(query)
    print(result)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result

@app.post("/agent", response_model=AgentResponse)
async def query_legal_agent(request: AgentRequest):
    """
    Legal Agent Endpoint - Uses LangChain agent for comprehensive legal research
    Send a legal query and get AI-powered analysis with citations
    """
    try:
        legal_agent = get_agent()
        response = legal_agent.query(request.query)
        
        return AgentResponse(
            status="success",
            response=response
        )
        
    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower() or "413" in error_msg or "429" in error_msg:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")
        else:
            raise HTTPException(status_code=500, detail=f"Agent query failed: {error_msg}")

@app.post("/case-law/search", response_model=CaseLawResponse)
async def search_case_law(request: CaseLawSearchRequest):
    """
    Search Indian Kanoon database for case laws
    Supports filters: court type, date range, sorting
    """
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        results = ik_api.search_legal_cases(
            query=request.query,
            court=request.court,
            max_cites=request.max_results or 10
        )
        
        if not results or 'docs' not in results:
            return CaseLawResponse(
                status="success",
                cases=[],
                total=0
            )
        
        cases = []
        for doc in results['docs']:
            # Parse date for filtering
            doc_date = doc.get('publishdate', '')
            
            # Apply date filters if provided
            if request.from_date and doc_date < request.from_date:
                continue
            if request.to_date and doc_date > request.to_date:
                continue
            
            cases.append({
                "id": doc.get('tid'),
                "title": doc.get('title', 'Untitled'),
                "court": doc.get('doctype', 'Unknown Court'),
                "date": doc_date or 'N/A',
                "cite_count": doc.get('numcites', 0),
                "link": f"https://indiankanoon.org/doc/{doc.get('tid')}/"
            })
        
        # Apply sorting
        if request.sort_by == "date":
            cases.sort(key=lambda x: x['date'], reverse=True)
        elif request.sort_by == "citations":
            cases.sort(key=lambda x: x['cite_count'], reverse=True)
        # 'relevance' is default order from API
        
        return CaseLawResponse(
            status="success",
            cases=cases,
            total=len(cases)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Case law search failed: {str(e)}")

@app.get("/case-law/document/{doc_id}")
async def get_case_document(doc_id: int):
    """
    Get the full text of a specific case judgment
    """
    try:
        text = ik_api.get_clean_verdict_text(doc_id)
        
        if "Error:" in text:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "status": "success",
            "doc_id": doc_id,
            "content": text,
            "link": f"https://indiankanoon.org/doc/{doc_id}/"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)