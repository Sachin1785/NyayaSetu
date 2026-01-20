import requests
import json
from bs4 import BeautifulSoup  # You may need to install this: pip install beautifulsoup4

# --- CONFIGURATION ---
API_TOKEN = '81529bda756cc5b1eabc976f104636b1579b51b7'  # Replace with your actual token
BASE_URL = 'https://api.indiankanoon.org'

def advanced_search(
    query, 
    doctypes=None, 
    from_date=None, 
    to_date=None, 
    author=None, 
    bench=None, 
    max_cites=5
):
    """
    Searches Indian Kanoon with advanced filters.
    
    Args:
        query (str): Main search term (e.g., "Section 302 IPC").
        doctypes (str): 'supremecourt', 'highcourts', 'delhi', 'criminal', etc.
        from_date (str): 'DD-MM-YYYY' format.
        to_date (str): 'DD-MM-YYYY' format.
        author (str): Name of the judge who wrote the judgment.
        bench (str): Name of a judge who was on the bench.
        max_cites (int): Number of citations to retrieve per result.
    """
    endpoint = f"{BASE_URL}/search/"
    
    headers = {
        'Authorization': f'Token {API_TOKEN}',
        'Accept': 'application/json'
    }
    
    # Build the parameters dictionary dynamically
    params = {
        'formInput': query,
        'maxcites': max_cites
    }
    
    if doctypes: params['doctypes'] = doctypes
    if from_date: params['fromdate'] = from_date
    if to_date: params['todate'] = to_date
    if author: params['author'] = author
    if bench: params['bench'] = bench

    try:
        print(f"Sending request to: {endpoint} with params: {params}")
        response = requests.post(endpoint, headers=headers, data=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Search Error: {e}")
        return None

def get_document_clean(doc_id):
    """
    Fetches a document and removes HTML tags for clean reading.
    """
    endpoint = f"{BASE_URL}/doc/{doc_id}/"
    headers = {'Authorization': f'Token {API_TOKEN}'}

    try:
        response = requests.post(endpoint, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # The raw text is usually inside the 'doc' key with HTML tags
        raw_html = data.get('doc', '')
        
        # Clean the HTML
        soup = BeautifulSoup(raw_html, "html.parser")
        clean_text = soup.get_text(separator="\n\n") # Preserves paragraph spacing
        
        return clean_text
    except Exception as e:
        print(f"Fetch Error: {e}")
        return None

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    
    # EXAMPLE 1: Broad search for "Cyber Fraud"
    # term = "cyber fraud"
    
    # EXAMPLE 2: Specific search for "Murder" cases in Supreme Court after 2010
    # Note: 'ANDD', 'ORR', 'NOTT' are the specific operators for this API
    term = "murder ANDD kidnapping" 
    
    print(f"--- Searching for: '{term}' ---")
    
    results = advanced_search(
        query=term,
        doctypes="supremecourt",  # Restrict to Supreme Court
        from_date="01-01-2015",   # Only cases after Jan 1st, 2015
        max_cites=3               # Get top 3 citations for each
    )

    if results and 'docs' in results:
        print(f"Found {len(results['docs'])} results (showing top 3):\n")
        
        for i, doc in enumerate(results['docs'][:3]):
            print(f"[{i+1}] CASE TITLE: {doc.get('title')}")
            print(f"    Court: {doc.get('docsource')}")
            print(f"    Date: {doc.get('publishdate')}")
            print(f"    Citations: {doc.get('numcites')} cited this document")
            
            # Print the context snippet (highlighting match)
            print(f"    Snippet: {doc.get('headline')}")
            print("-" * 50)
            
            # Let's fetch the full text for the first result only
            if i == 0:
                doc_id = doc.get('tid')
                print(f"\n>> Downloading full text for Document ID {doc_id}...\n")
                clean_verdict = get_document_clean(doc_id)
                
                if clean_verdict:
                    print("--- START OF VERDICT ---")
                    print(clean_verdict[:1000]) # Print first 1000 chars
                    print("...\n--- END OF PREVIEW ---")
    else:
        print("No results found.")