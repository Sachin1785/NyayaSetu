import os
import sys
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

# --- CONFIGURATION ---
DB_DIRECTORY = os.path.join(os.path.dirname(__file__), "RAG Builder", "legal_db")
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
    print(f"✅ Connected to ChromaDB")
else:
    print(f"❌ Database not found. RAG functionality will be limited.")
    db = None

def translate_query_internal(text: str) -> str:
    try:
        if not text.isascii():
            return GoogleTranslator(source='auto', target='en').translate(text)
        return text
    except Exception:
        return text

# --- TOOLS DEFINITION ---

@tool
def search_legal_database(query: str) -> str:
    """
    Search for STATUTES, DEFINITIONS, or PUNISHMENTS in IPC/BNS.
    Input: A specific legal topic (e.g., "punishment for snatching", "Section 302 text").
    """
    if db is None: return "Error: Database not connected."
    
    clean_query = translate_query_internal(query)
    results = db.similarity_search_with_relevance_scores(clean_query, k=3)
    
    if not results: 
        return "No specific statutes found in the database."
    
    output = []
    for doc, score in results:
        if score > CONFIDENCE_THRESHOLD:
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

# --- AGENT EXECUTION ---
def main():
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("❌ Google API Key missing! Please set GOOGLE_API_KEY in your .env file")
        return

    llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        temperature=0.3,
        google_api_key=api_key
    )

    tools = [search_legal_database, find_case_law, read_full_judgment, check_statute_usage]

    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are **NyayaSetu**, an expert Legal Research AI powered by Gemini. "
         "You do not guess; you verify. You must strictly follow citation standards.\n\n"
         
         "**CITATION FORMATTING RULES (MANDATORY):**\n"
         "1. **Statutes:** Always format as `**Section [Number]** of the **[Act Name]**`.\n"
         "2. **Case Law:** Always format as `*Case Name*`.\n"
         "3. **Links:** When citing a case found via tools, generate a link: `https://indiankanoon.org/doc/[ID]/`.\n\n"
         
         "**OUTPUT STRUCTURE:**\n"
         "1. **The Legal Answer:** Separate 'Statutory Law' from 'Case Law Interpretation'.\n"
         "2. **### Sources & References:** A distinct section at the end.\n"
         "   - 🏛️ **Statute:** [Act Name], Section [ID]\n"
         "   - ⚖️ **Precedent:** *[Case Title]* ([Date]) | [Read Judgment](https://indiankanoon.org/doc/[ID]/)\n\n"
         
         "**PROTOCOL:**\n"
         "1. **Statutes First:** Use `search_legal_database`.\n"
         "2. **Precedent Search:** Use `find_case_law`.\n"
         "3. **Verification:** You MUST use `read_full_judgment` on the top case.\n"
         "4. **Disclaimer:** End with a standard AI disclaimer."
        ),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=None)

    print("\n⚖️ NyayaSetu (Powered by Gemini-1.5-Pro) is Online.\n")
    
    while True:
        try:
            user_input = input("\n👤 User: ")
            if user_input.lower() in ["quit", "exit"]: break
            
            # --- RETRY LOGIC START ---
            max_retries = 3
            attempt = 0
            
            while attempt < max_retries:
                try:
                    response = agent_executor.invoke({"input": user_input})
                    
                    # Extract clean text from Gemini response
                    output = response['output']
                    if isinstance(output, list) and len(output) > 0:
                        # If it's a list (Gemini format), extract the text
                        if isinstance(output[0], dict) and 'text' in output[0]:
                            clean_output = output[0]['text']
                        else:
                            clean_output = str(output)
                    else:
                        clean_output = str(output)
                    
                    print(f"\n🤖 NyayaSetu: {clean_output}")
                    break # Success! Exit the retry loop
                    
                except Exception as e:
                    error_msg = str(e).lower()
                    
                    # Check for Rate Limit errors (429) or quota exceeded
                    if "429" in error_msg or "rate_limit" in error_msg or "quota" in error_msg or "resource_exhausted" in error_msg:
                        wait_time = 65 # Wait 65 seconds to be safe
                        print(f"\n⚠️ Rate Limit/Quota Hit. Auto-waiting {wait_time}s before retry ({attempt+1}/{max_retries})...")
                        
                        # Show a little countdown (optional, but nice UX)
                        for remaining in range(wait_time, 0, -5):
                            sys.stdout.write(f"\r⏳ Retrying in {remaining}s...")
                            sys.stdout.flush()
                            time.sleep(5)
                        print("\r🚀 Retrying now...                   ")
                        
                        attempt += 1
                    else:
                        # If it's a real error (not rate limit), crash properly
                        print(f"\n❌ Execution Error: {e}")
                        break
            
            if attempt == max_retries:
                print("\n❌ Failed after 3 retries. Please try a shorter query or wait longer.")
            # --- RETRY LOGIC END ---

        except KeyboardInterrupt:
            print("\n👋 Exiting...")
            break

if __name__ == "__main__":
    main()