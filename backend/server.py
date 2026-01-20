from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the logic class from the other file
from mapper import LegalBackend
from gemini_agent_core import GeminiLegalAgent

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

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)