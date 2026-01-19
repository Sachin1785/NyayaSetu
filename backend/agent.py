import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.tools import tool
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from deep_translator import GoogleTranslator

# IMPORT YOUR NEW LIBRARY
import indian_kanoon_lib as ik_api

# --- CONFIGURATION ---
DB_DIRECTORY = os.path.join(os.path.dirname(
    __file__), "RAG Builder", "legal_db")
MODEL_NAME = "BAAI/bge-small-en-v1.5"
CONFIDENCE_THRESHOLD = 0.35

print(f"⏳ Loading components...")
embedding_function = HuggingFaceEmbeddings(
    model_name=MODEL_NAME,
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

if os.path.exists(DB_DIRECTORY):
    db = Chroma(persist_directory=DB_DIRECTORY,
                embedding_function=embedding_function)
    print(f"✅ Connected to ChromaDB")
else:
    print(f"❌ Database not found. RAG tool will fail.")
    db = None


def translate_query_internal(text: str) -> str:
    try:
        if not text.isascii():
            return GoogleTranslator(source='auto', target='en').translate(text)
        return text
    except:
        return text

# --- TOOLS ---


@tool
def search_legal_database(query: str) -> str:
    """
    Use this to find DEFINITIONS, PUNISHMENTS, or STATUTE TEXT for IPC/BNS.
    Example inputs: "punishment for theft", "Section 302 definition".
    """
    if db is None:
        return "Error: DB down."
    results = db.similarity_search_with_relevance_scores(
        translate_query_internal(query), k=3)
    if not results:
        return "No sections found."

    output = []
    for doc, score in results:
        if score > CONFIDENCE_THRESHOLD:
            output.append(
                f"Title: {doc.metadata.get('title')}\nText: {doc.page_content}")
    return "\n---\n".join(output) if output else "Low relevance results."


@tool
def find_case_law(topic: str, court: str = "supremecourt") -> str:
    """
    Use this to find REAL COURT CASES or PRECEDENTS. 
    Inputs:
    - topic: Legal issue (e.g. "defamation on social media", "bail in murder case")
    - court: "supremecourt", "highcourts", "delhi", or "bombay".
    Returns: A list of relevant cases with Document IDs.
    """
    print(f"🔎 Searching Indian Kanoon for: {topic} in {court}")
    results = ik_api.search_legal_cases(query=topic, court=court)

    if not results or 'docs' not in results:
        return "No cases found."

    output = []
    for doc in results['docs'][:5]:
        output.append(
            f"ID: {doc['tid']} | Case: {doc['title']} | Date: {doc['publishdate']}")
    return "\n".join(output)


@tool
def read_full_judgment(doc_id: int) -> str:
    """
    Use this to READ the text of a specific case using its ID.
    Use 'find_case_law' first to get the ID.
    """
    print(f"📖 Reading Document ID: {doc_id}")
    text = ik_api.get_clean_verdict_text(doc_id)
    return text[:15000]  # Truncate to avoid token limits


@tool
def check_statute_usage(section: str, act: str) -> str:
    """
    Use this to see how a specific Section is applied in courts.
    Example: section="302", act="Indian Penal Code"
    """
    print(f"⚖️ Checking usage of Section {section} of {act}")
    results = ik_api.search_by_section(section, act)
    if not results or 'docs' not in results:
        return "No citations found."

    output = []
    for doc in results['docs'][:3]:
        output.append(f"ID: {doc['tid']} | Cited In: {doc['title']}")
    return "\n".join(output)

# --- AGENT SETUP ---


def main():
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")

    llm = ChatGroq(
        temperature=0,
        model_name="llama-3.3-70b-versatile",
        groq_api_key=api_key
    )

    # Local registry of tools (for manual orchestration)
    tool_registry = {
        "search_legal_database": search_legal_database,
        "find_case_law": find_case_law,
        "read_full_judgment": read_full_judgment,
        "check_statute_usage": check_statute_usage,
    }

    print("\n⚖️ NyayaSetu Agent Online (manual tool orchestration).\n")

    while True:
        try:
            user_input = input("\n👤 User: ")
            if user_input.lower() in ["quit", "exit"]:
                break

            # 1) Ask LLM which tool to use (if any)
            planner_system = (
                "You are NyayaSetu, a legal AI planner. "
                "You can decide whether to call one of these tools or answer directly.\n\n"
                "Available tools (names must match exactly):\n"
                "- search_legal_database(query: str)\n"
                "- find_case_law(topic: str, court: str = 'supremecourt')\n"
                "- read_full_judgment(doc_id: int)\n"
                "- check_statute_usage(section: str, act: str)\n\n"
                "Respond with **ONLY** a JSON object, no extra text, in one of these forms:\n"
                "1) {\"tool\": null, \"answer\": \"...final answer in natural language...\"}\n"
                "2) {\"tool\": \"tool_name\", \"args\": { ... }}\n"
            )

            planner_messages = [
                {"role": "system", "content": planner_system},
                {"role": "user", "content": user_input},
            ]

            plan_resp = llm.invoke(planner_messages)
            raw_plan = getattr(plan_resp, "content", plan_resp)

            # Try to extract JSON (handle ```json fences if present)
            raw_plan_str = str(raw_plan).strip()
            if raw_plan_str.startswith("```"):
                raw_plan_str = raw_plan_str.strip("`")
                if raw_plan_str.lower().startswith("json"):
                    raw_plan_str = raw_plan_str[4:]
            try:
                plan = json.loads(raw_plan_str)
            except Exception:
                # Fallback: treat model output as direct answer
                print(f"\n🤖 NyayaSetu: {raw_plan_str}")
                continue

            chosen_tool = plan.get("tool")

            # 2) If no tool, answer is already provided
            if not chosen_tool:
                answer = plan.get("answer", "I am unable to answer this.")
                print(f"\n🤖 NyayaSetu: {answer}")
                continue

            # 3) Run the chosen tool locally
            if chosen_tool not in tool_registry:
                print(f"\n🤖 NyayaSetu: Tool '{chosen_tool}' is not available.")
                continue

            tool_fn = tool_registry[chosen_tool]
            tool_args = plan.get("args", {}) or {}

            try:
                tool_result = tool_fn.invoke(tool_args)
            except Exception as tool_err:
                print(
                    f"\n🤖 NyayaSetu: Error running tool '{chosen_tool}': {tool_err}")
                continue

            # 4) Ask LLM for final legal answer using tool result
            answer_system = (
                "You are **NyayaSetu**, a high-precision Legal AI. "
                "Use the tool outputs provided to draft a clear, structured legal answer.\n\n"
                "RESPONSE STRUCTURE:\n"
                "- Statutory Position (cite Sections / Acts if available)\n"
                "- Judicial Interpretation (ratio from any judgments)\n"
                "- Procedural Status (bailable / cognizable if inferable)\n"
                "- Conclusion + clear disclaimer that this is not legal advice."
            )

            answer_messages = [
                {"role": "system", "content": answer_system},
                {"role": "user", "content": user_input},
                {
                    "role": "system",
                    "content": f"Tool '{chosen_tool}' output to base your answer on:\n{tool_result}",
                },
            ]

            final_resp = llm.invoke(answer_messages)
            final_text = getattr(final_resp, "content", final_resp)
            print(f"\n🤖 NyayaSetu: {final_text}")

        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
