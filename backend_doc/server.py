from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_chroma import Chroma
from embeddings import get_embedding_function
import time
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import os
from query import main as run
from ingest import main
from fastapi.responses import JSONResponse


load_dotenv()


api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not set in .env file")

# llm = ChatGoogleGenerativeAI(model="models/gemini-2.0-flash", temperature=0.2, google_api_key=api_key)

llm = ChatGoogleGenerativeAI(model="models/gemini-2.0-flash", temperature=0.2, google_api_key=api_key)

print("Loading Model")
start_model = time.time()
embedding_fn = get_embedding_function()
end_model = time.time()
print(f"Model loaded, time {end_model-start_model}")

CHROMA_PATH = "chroma"
DATA_PATH = "data"


app = FastAPI()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

class IngestRequest(BaseModel):
    id: str
    filename: str
    file_base64: str       
    reset_db: str     

class QueryRequest(BaseModel):
    id: str
    query: str


@app.post("/docquery")
async def query(request:QueryRequest):
    try:
        id = request.id
        query = request.query
        # request_dic = {"id":}
        response = run(id,query,llm,embedding_fn)
        if response["error"] == "":
            return JSONResponse(content=response,status_code=200)
        else:
            return JSONResponse(content=response,status_code=400)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Bad Request!")

@app.post("/docingest")
async def ingest_api(id: str = Form(),file: UploadFile = File(...), filename: str = Form(),reset_db: bool = Form(False),):
    try:
        # If requested, clear existing files so only the new document is ingested
        if reset_db and os.path.exists(DATA_PATH):
            for existing_name in os.listdir(DATA_PATH):
                existing_path = os.path.join(DATA_PATH, existing_name)
                if os.path.isfile(existing_path):
                    os.remove(existing_path)

        os.makedirs(DATA_PATH, exist_ok=True)
        file_path = os.path.join(DATA_PATH, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        response = main(id,embedding_fn,reset_db)
        if response["error"] == "":
            return JSONResponse(content=response,status_code=200)
        else:
            return JSONResponse(content=response,status_code=400)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Bad Request!")

# Entry point for running with 'python server.py'
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)