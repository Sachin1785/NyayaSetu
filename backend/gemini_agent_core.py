import os
import time
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain.tools import tool
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from deep_translator import GoogleTranslator

# IMPORT YOUR NEW LIBRARY
import indian_kanoon_lib as ik_api

# Import hybrid retrieval engine
from RAG_Builder.hybrid_retriveal import load_bm25_retriever, translate_query, perform_hybrid_search

# --- CONFIGURATION ---
DB_DIRECTORY = os.path.join(os.path.dirname(__file__), "RAG_Builder", "legal_db")
MODEL_NAME = "BAAI/bge-small-en-v1.5" 
CONFIDENCE_THRESHOLD = 0.35
MAX_DOC_LENGTH = 100000  # Keeping this safe to avoid constant timeouts

print(f"⏳ Loading Legal Database...")
embedding_function = HuggingFaceEmbeddings(
    model_name=MODEL_NAME,
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

if os.path.exists(DB_DIRECTORY):
    db = Chroma(persist_directory=DB_DIRECTORY, embedding_function=embedding_function)
    bm25_retriever = load_bm25_retriever()
    print(f"✅ Connected to ChromaDB and BM25 Retriever")
else:
    print(f"❌ Database not found. RAG functionality will be limited.")
    db = None
    bm25_retriever = None

# --- TOOLS DEFINITION ---

@tool
def search_legal_database(query: str) -> str:
    """
    Search for STATUTES, DEFINITIONS, or PUNISHMENTS in IPC/BNS/IT Act using hybrid retrieval.
    Input: A specific legal topic (e.g., "punishment for snatching", "Section 302 text").
    """
    if db is None or bm25_retriever is None:
        return "Error: Database not connected."

    clean_query = translate_query(query)
    results = perform_hybrid_search(clean_query, db, bm25_retriever)

    if not results:
        return "No specific statutes found in the database."

    output = []
    for doc in results:
        meta = doc.metadata
        output.append(f"Act: {meta.get('source', 'Unknown')}\nSection: {meta.get('section_id', 'N/A')}\nText: {doc.page_content}")

    return "\n---\n".join(output) if output else "No highly relevant sections found."

@tool
def find_case_law(topic: str, court: str = "supremecourt") -> str:
    """
    Finds LIST of relevant court cases/precedents.
    Args:
        topic: Legal issue to search (e.g. "snatching vs robbery distinction").
        court: 'supremecourt' (default) or 'highcourts'.
    """
    print(f"🔎 Searching Indian Kanoon for: '{topic}' in {court}...")
    results = ik_api.search_legal_cases(query=topic, court=court)
    
    if not results or 'docs' not in results:
        return "No cases found."
        
    output = []
    for doc in results['docs'][:3]:
        output.append(f"ID: {doc['tid']} | Title: {doc['title']} | Date: {doc['publishdate']}")
    return "\n".join(output)

@tool
def read_full_judgment(doc_id: int) -> str:
    """
    Reads the FULL TEXT of a judgment. 
    MANDATORY: Use this after 'find_case_law' to verify the verdict.
    """
    print(f"📖 Reading Full Text for Doc ID: {doc_id}...")
    text = ik_api.get_clean_verdict_text(doc_id)
    return text[:MAX_DOC_LENGTH] + "... [Truncated]"

@tool
def check_statute_usage(section: str, act: str) -> str:
    """
    Checks how frequently a Section is cited in courts.
    """
    print(f"⚖️ Checking citations for Section {section}...")
    results = ik_api.search_by_section(section, act)
    if not results or 'docs' not in results:
        return "No citations found."
    
    output = []
    for doc in results['docs'][:3]:
        output.append(f"ID: {doc['tid']} | Cited In: {doc['title']}")
    return "\n".join(output)

class GeminiLegalAgent:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GOOGLE_API_KEY")
        
        if not self.api_key:
            raise ValueError("❌ Google API Key missing! Please set GOOGLE_API_KEY in your .env file")

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-3-flash-preview",
            temperature=0.3,
            google_api_key=self.api_key
        )

        self.tools = [search_legal_database, find_case_law, read_full_judgment, check_statute_usage]

        self.prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are **NyayaSetu**, an expert Legal Research AI powered by Gemini. "
             "You do not guess; you verify. You must strictly follow citation standards.\n\n"
             "**LANGUAGE RULES (MANDATORY):**\n"
             "- Always respond in the same language as the user's query. If the query is in Hindi, your final output must be in Hindi. If the query is in English, respond in English.\n"
             "- Do not translate unless explicitly asked.\n\n"
             "**CITATION FORMATTING RULES (MANDATORY):**\n"
             "1. **Statutes:** Always format as `**Section [Number]** of the **[Act Name]**`.\n"
             "2. **Case Law:** Always format as `*Case Name*`.\n"
             "3. **Links:** When citing a case found via tools, generate a link: `https://indiankanoon.org/doc/[ID]/`.\n\n"
             "**OUTPUT STRUCTURE (STRICT):**\n"
             "All text inside <LEGAL_ANSWER> and <CITATIONS> must use proper markdown formatting (headings, bold, italics, tables, lists, links, etc).\n"
             "<LEGAL_ANSWER>\n"
             "[Statutory Law]\n"
             "...\n"
             "[Case Law Interpretation]\n"
             "...\n"
             "</LEGAL_ANSWER>\n"
             "<CITATIONS>\n"
             "[Statutes]\n"
             "- [Act Name], Section [ID]\n"
             "[Precedents]\n"
             "- [Case Title] ([Date]) | [Read Judgment](https://indiankanoon.org/doc/[ID]/)\n"
             "</CITATIONS>\n"
             "Never include any disclaimer or extra notes. Only use the above structure."
            ),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])

        agent = create_tool_calling_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True, max_iterations=None)

    def query(self, user_input: str) -> str:
        """
        Process a legal query with retry logic for rate limiting.
        """
        max_retries = 3
        attempt = 0
        
        while attempt < max_retries:
            try:
                response = self.agent_executor.invoke({"input": user_input})
                
                # Extract clean text from Gemini response
                output = response['output']
                if isinstance(output, list) and len(output) > 0:
                    # If it's a list (Gemini format), extract the text
                    if isinstance(output[0], dict) and 'text' in output[0]:
                        return output[0]['text']
                    else:
                        return str(output)
                else:
                    return str(output)
                
            except Exception as e:
                error_msg = str(e).lower()
                
                # Check for Rate Limit errors (429) or quota exceeded
                if "429" in error_msg or "rate_limit" in error_msg or "quota" in error_msg or "resource_exhausted" in error_msg:
                    wait_time = 65 # Wait 65 seconds to be safe
                    print(f"\n⚠️ Rate Limit/Quota Hit. Auto-waiting {wait_time}s before retry ({attempt+1}/{max_retries})...")
                    time.sleep(wait_time)
                    attempt += 1
                else:
                    # If it's a real error (not rate limit), raise it
                    raise e
        
        raise Exception("Failed after 3 retries due to rate limiting. Please try again later.")