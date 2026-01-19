import os
import json
import re
from groq import Groq

# --- CONFIGURATION ---
# Make sure you have exported your key: export GROQ_API_KEY="gsk_..."
GROQ_API_KEY = "g"


class LegalBackend:
    def __init__(self):
        """
        Initialize Backend: Load JSON Data & Connect to Groq
        """
        if not GROQ_API_KEY:
            raise ValueError(
                "❌ GROQ_API_KEY not found in environment variables!")

        self.client = Groq(api_key=GROQ_API_KEY)

        print("⚙️ Loading Legal Databases...")
        self.ipc_db = self._load_json('ipc_data.json')
        self.bns_db = self._load_json('bns_data.json')
        self.mapping = self._load_json(
            'ipc_bns_mappings.json')  # Your mapped file

        # 1. OPTIMIZE: Create Lookup Dictionaries for O(1) speed
        # Normalize keys to remove spaces/newlines for better matching
        self.ipc_lookup = {str(item.get('Section', '')).strip()                           : item for item in self.ipc_db}
        self.bns_lookup = {str(item.get('Section', '')).strip()                           : item for item in self.bns_db}

        # Mapping Lookup (Key = Old IPC Section) -> list of mapping rows
        self.map_lookup = {}
        for item in self.mapping:
            key = str(item.get('IPC_Section', '')).strip()
            if not key:
                continue
            self.map_lookup.setdefault(key, []).append(item)

        print(
            f"✅ System Ready. Loaded {len(self.map_lookup)} unique IPC keys.")

    def _load_json(self, filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"⚠️ Warning: {filename} not found.")
            return []

    def _clean_section_id(self, section_str):
        """
        Helper: "137 (1)" -> "137"
        Removes brackets to find the parent section in the DB if exact match fails.
        """
        if not section_str:
            return ""
        return re.split(r'[\(\s]', str(section_str).strip())[0]

    def get_comparison(self, user_query):
        """
        MAIN API: Takes "IPC 420", returns Structured JSON with AI Analysis.
        """
        # 1. Extract Section Number
        match = re.search(r'\d+[A-Za-z]*', user_query)
        if not match:
            return {"error": "Could not detect section number. Try 'IPC 420'."}

        ipc_id = match.group(0)

        # 2. Find all mappings for this IPC section
        if ipc_id not in self.map_lookup:
            return {"error": f"Mapping for IPC {ipc_id} not found."}

        mapping_nodes = self.map_lookup[ipc_id]  # list of rows

        # 3. Build comparison entries for each linked BNS section
        comparisons = []
        for mapping_node in mapping_nodes:
            bns_full_id = mapping_node.get('BNS_Section', 'Unknown')

            # Retrieve Texts (Handle sub-sections like '1(1)' -> '1')
            ipc_data = self.ipc_lookup.get(ipc_id, {})
            bns_clean_id = self._clean_section_id(bns_full_id)
            bns_data = self.bns_lookup.get(bns_clean_id, {})

            ipc_text = ipc_data.get('section_desc', "Text not found.")
            bns_text = bns_data.get('section_desc', "Text not found.")
            official_heading = mapping_node.get('Heading', 'N/A')

            ai_analysis = self._call_groq_analysis(
                ipc_id,
                ipc_text,
                bns_full_id,
                bns_text,
                official_heading,
            )

            comparisons.append({
                "mapping": {
                    "ipc": ipc_id,
                    "bns": bns_full_id,
                    "heading": official_heading,
                },
                "content": {
                    "ipc_text": ipc_text,
                    "bns_text": bns_text,
                },
                "analysis": ai_analysis,
            })

        return {
            "status": "success",
            "ipc": ipc_id,
            "results": comparisons,
        }

    def _call_groq_analysis(self, ipc_id, ipc_text, bns_id, bns_text, heading):
        """
        Sends the data to Groq (Llama-3) to get the 'Diff' analysis.
        """
        prompt = f"""
        You are a Legal Assistant for the Indian Justice System.
        
        COMPARE THESE LAWS:
        1. OLD LAW (IPC {ipc_id}): "{ipc_text[:1500]}"
        2. NEW LAW (BNS {bns_id}): "{bns_text[:1500]}"
        3. OFFICIAL TOPIC: "{heading}"
        
        OUTPUT REQUIREMENT:
        Return valid JSON only. No markdown formatting.
        {{
            "summary": "One clear sentence explaining the shift.",
            "severity_change": "Stricter / Lenient / Same",
            "key_changes": [
                "Change 1 (e.g., 'Community service added')",
                "Change 2 (e.g., 'Fine increased')"
            ],
            "impact": "Practical impact for a lawyer or citizen."
        }}
        """

        try:
            completion = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Or "mixtral-8x7b-32768"
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}  # Force JSON
            )
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            return {"error": f"LLM Error: {str(e)}"}


# --- TEST BLOCK ---
if __name__ == "__main__":
    # Simulate a run
    backend = LegalBackend()
    result = backend.get_comparison("IPC 33")
    print(json.dumps(result, indent=2))
