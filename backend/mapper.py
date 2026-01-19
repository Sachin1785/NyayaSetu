import os
import json
import re
from groq import Groq

# --- CONFIG ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

class LegalBackend:
    def __init__(self):
        if not GROQ_API_KEY:
            raise ValueError("❌ GROQ_API_KEY not found! Set env variable.")
            
        self.client = Groq(api_key=GROQ_API_KEY)
        
        self.ipc_db = self._load_json('ipc_data.json')
        self.bns_db = self._load_json('bns_data.json')
        self.mappings = self._load_json('ipc_bns_mappings.json')
        
        # 1. Index Databases (Key = Parent Section ID)
        self.ipc_lookup = {str(i.get('Section', '')).strip(): i for i in self.ipc_db}
        self.bns_lookup = {str(i.get('Section', '')).strip(): i for i in self.bns_db}
        
        # 2. Build Indices
        self.ipc_to_bns = {}
        self.bns_to_ipc = {}
        
        for m in self.mappings:
            ipc_raw = str(m.get('IPC_Section', '')).strip()
            bns_raw = str(m.get('BNS_Section', '')).strip()
            heading = m.get('Heading', '')
            
            if not ipc_raw or ipc_raw.lower() == 'new': continue
            
            # Index IPC -> BNS
            if ipc_raw not in self.ipc_to_bns: self.ipc_to_bns[ipc_raw] = []
            self.ipc_to_bns[ipc_raw].append({
                "target": bns_raw,
                "heading": heading
            })
            
            # Index BNS -> IPC (Key is Parent BNS ID, e.g., "2" for "2(1)")
            bns_parent = self._get_parent_id(bns_raw)
            if bns_parent not in self.bns_to_ipc: self.bns_to_ipc[bns_parent] = []
            self.bns_to_ipc[bns_parent].append({
                "source": ipc_raw,
                "heading": heading,
                "specific_clause": bns_raw
            })
            

    def _load_json(self, f):
        try:
            with open(f, 'r', encoding='utf-8') as file: return json.load(file)
        except: return []

    def _get_parent_id(self, section_id):
        # "2(1)" -> "2", "302" -> "302"
        return re.split(r'[\(\s]', str(section_id).strip())[0]

    def _extract_subsection_text(self, full_text, sub_id):
        """
        THE MAGIC: Extracts "(1) ... " until the next "(2)"
        """
        if not sub_id or not full_text: return full_text
        
        # Regex: Look for "(sub_id)" ... lazy match until next "(digit)" or end
        # We handle variations like "(1)" or "1." if needed, but BNS uses "(1)"
        pattern = r'\(' + re.escape(sub_id) + r'\)(.*?)(?=\(\d+\)|$)'
        match = re.search(pattern, full_text, re.DOTALL)
        
        if match:
            # Return just the relevant snippet
            return f"({sub_id}) {match.group(1).strip()}"
        return full_text # Fallback: return everything if regex fails

    def _smart_fetch_bns(self, bns_full_id):
        """
        Input: "2(1)"
        Output: Just the text for definition of "Act", not the whole dictionary.
        """
        parent_id = self._get_parent_id(bns_full_id)
        
        # 1. Fetch Parent Node
        if parent_id not in self.bns_lookup:
            return "Text not found in DB."
            
        full_text = self.bns_lookup[parent_id].get('section_desc', '')
        
        # 2. Check for Subsection Request
        # Parses "2(1)" to extract sub_id="1"
        match = re.match(r"\d+\s*\((.*?)\)", bns_full_id)
        if match:
            sub_id = match.group(1)
            # 3. Extract Specific Text
            return self._extract_subsection_text(full_text, sub_id)
        
        return full_text

    def process_query(self, user_query):
        clean_query = user_query.upper().strip()
        match = re.search(r'\d+(\(\w+\))*', clean_query) # Matches 2 or 2(1)
        if not match: return {"error": "No section number found."}
        section_id = match.group(0)
        
        if "BNS" in clean_query:
            return self._handle_bns_query(section_id)
        else:
            return self._handle_ipc_query(section_id)

    # ---------------------------------------------------------
    # IPC QUERY (Forward)
    # ---------------------------------------------------------
    def _handle_ipc_query(self, ipc_id):
        if ipc_id not in self.ipc_to_bns:
            return {"error": f"No mapping for IPC {ipc_id}"}

        ipc_text = self.ipc_lookup.get(ipc_id, {}).get('section_desc', '')
        
        secondary_nodes = []
        for target in self.ipc_to_bns[ipc_id]:
            bns_target_id = target['target'] # e.g., "2(1)"
            
            # SMART FETCH: Extracts only "2(1)" text, not all of Section 2
            bns_text = self._smart_fetch_bns(bns_target_id)
            
            secondary_nodes.append({
                "id": bns_target_id,
                "heading": target['heading'],
                "text": bns_text
            })
            
        return self._call_groq(f"IPC {ipc_id}", ipc_text, "BNS", secondary_nodes, "IPC_TO_BNS")

    # ---------------------------------------------------------
    # BNS QUERY (Reverse)
    # ---------------------------------------------------------
    def _handle_bns_query(self, bns_id):
        # Even if user asks "BNS 2(1)", we look up mapping via Parent "2"
        parent_id = self._get_parent_id(bns_id)
        
        if parent_id not in self.bns_to_ipc:
            return {"error": f"No mapping for BNS {bns_id}"}

        # Get Primary Text (Smart Fetch handles 2(1) logic)
        bns_text = self._smart_fetch_bns(bns_id)
        
        secondary_nodes = []
        seen = set()
        for source in self.bns_to_ipc[parent_id]:
            # Filter: If user specifically asked "2(1)", only show IPCs mapped to "2(1)"
            # If user asked "2", show everything.
            if "(" in bns_id and source['specific_clause'] != bns_id:
                continue

            ipc_id = source['source']
            if ipc_id in seen: continue
            seen.add(ipc_id)
            
            ipc_text = self.ipc_lookup.get(ipc_id, {}).get('section_desc', '')
            secondary_nodes.append({
                "id": ipc_id,
                "heading": source['heading'],
                "text": ipc_text
            })
            
        return self._call_groq(f"BNS {bns_id}", bns_text, "IPC", secondary_nodes, "BNS_TO_IPC")

    # ---------------------------------------------------------
    # GROQ ANALYST
    # ---------------------------------------------------------
    def _call_groq(self, p_label, p_text, s_label, s_nodes, mode):
        nodes_block = "\n".join([f"--- {s_label} {n['id']} ---\nTEXT: {n['text'][:1500]}" for n in s_nodes])
        
        prompt = f"""
        You are a Legal Expert.
        
        TASK: Compare {p_label} vs {s_label}.
        
        PRIMARY ({p_label}): "{p_text[:2000]}"
        
        RELATED ({s_label}):
        {nodes_block}
        
        OUTPUT JSON (Strict):
        {{
            "primary": {{ "id": "{p_label}", "text_clean": "Cleaned text..." }},
            "related": [ {{ "id": "...", "text_clean": "Cleaned text..." }} ],
            "analysis": {{
                "summary": "1 sentence.",
                "changes": ["Change 1", "Change 2"]
            }}
        }}
        """
        try:
            res = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(res.choices[0].message.content)
        except Exception as e: return {"error": str(e)}

if __name__ == "__main__":
    be = LegalBackend()
    # Test Smart Extraction: Should return just the "Act" definition, not "Animal"/"Court"
    print(be.process_query("BNS 2(1)"))