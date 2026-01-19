import requests
from bs4 import BeautifulSoup
import logging
from typing import Optional, Dict

# --- CONFIGURATION ---
# TODO: Replace with your actual API Token from api.indiankanoon.org
API_TOKEN = '81529bda756cc5b1eabc976f104636b1579b51b7' 
BASE_URL = 'https://api.indiankanoon.org'

# Configure logging
logging.basicConfig(level=logging.INFO)

def _make_request(endpoint: str, params: Optional[Dict] = None, method: str = 'POST') -> Optional[Dict]:
    """Internal helper to handle authentication and error catching."""
    headers = {
        'Authorization': f'Token {API_TOKEN}',
        'Accept': 'application/json'
    }
    url = f"{BASE_URL}/{endpoint}"
    try:
        if method == 'POST':
            response = requests.post(url, headers=headers, data=params)
        else:
            response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as err:
        logging.error(f"Request Failed: {err}")
        return None

def search_legal_cases(query: str, court: Optional[str] = None, max_cites: int = 5) -> Dict:
    """
    Searches for legal cases.
    Args:
        query: The search term (e.g., "defamation" or "murder ANDD kidnapping").
        court: Filter by court (e.g., 'supremecourt', 'highcourts', 'delhi').
    """
    params = {'formInput': query, 'maxcites': max_cites}
    if court:
        params['doctypes'] = court
    return _make_request("search/", params=params)

def search_by_section(section: str, act: str) -> Dict:
    """
    Searches for cases specifically citing a Law Section (e.g., Section 302 IPC).
    """
    # Construct strict query: "Section X" ANDD "Act Name"
    query = f'"Section {section}" ANDD "{act}"'
    return search_legal_cases(query=query)

def get_clean_verdict_text(doc_id: int) -> str:
    """
    Fetches a document and strips HTML to return clean text for the LLM.
    """
    data = _make_request(f"doc/{doc_id}/")
    if not data or 'doc' not in data:
        return "Error: Document content not found."

    soup = BeautifulSoup(data['doc'], "html.parser")
    for script in soup(["script", "style"]):
        script.extract()
    
    # Get text with double newlines for paragraphs
    text = soup.get_text(separator="\n\n")
    return "\n".join([line.strip() for line in text.splitlines() if line.strip()])