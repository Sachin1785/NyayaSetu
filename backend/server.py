from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import the logic class from the other file
from mapper import LegalBackend

# ==========================================
# 1. SETUP & LIFECYCLE
# ==========================================
backend = LegalBackend()

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Load heavy JSON data only once on startup
#     backend.load_data()
#     yield
#     # Cleanup (optional)

app = FastAPI(title="Legal Diff Engine")

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

# ==========================================
# 3. ENDPOINTS
# ==========================================
@app.post("/compare")
async def compare_laws(request: LegalRequest):
    """
    Comparison Endpoint.
    - For BNS 2(1): Send {"law_type": "BNS", "section": "2", "subsection": "1"}
    - For IPC 33: Send {"law_type": "IPC", "section": "33"}
    """
    law = request.law_type.upper()
    sec_id = request.section.strip()
    
    # Logic to construct the full ID (e.g., "2" + "1" -> "2(1)")
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

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)