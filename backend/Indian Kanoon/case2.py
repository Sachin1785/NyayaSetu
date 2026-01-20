import requests
import json

# --- CONFIGURATION ---
API_TOKEN = '81529bda756cc5b1eabc976f104636b1579b51b7' 
BASE_URL = 'https://api.indiankanoon.org'

def search_section_with_filters(
    section, 
    act, 
    court=None, 
    start_date=None, 
    end_date=None, 
    max_pages=0
):
    """
    Searches for a specific legal section with court and date filters.
    
    Args:
        section (str): Section number (e.g., "302", "66A").
        act (str): Full Act name (e.g., "Indian Penal Code").
        court (str, optional): API doctype (e.g., 'supremecourt', 'highcourts', 'delhi').
        start_date (str, optional): 'DD-MM-YYYY' format.
        end_date (str, optional): 'DD-MM-YYYY' format.
    """
    endpoint = f"{BASE_URL}/search/"
    
    headers = {
        'Authorization': f'Token {API_TOKEN}',
        'Accept': 'application/json'
    }
    
    # 1. Construct the Strict Query
    # Using quotes for exact phrases and ANDD for intersection
    query_string = f'"Section {section}" ANDD "{act}"'
    
    # 2. Build the Payload
    params = {
        'formInput': query_string,
        'pagenum': max_pages
    }
    
    # 3. Add Optional Filters if provided
    if court:
        params['doctypes'] = court
    if start_date:
        params['fromdate'] = start_date
    if end_date:
        params['todate'] = end_date

    print(f"Executing: {query_string}")
    print(f"Filters: Court={court}, Date={start_date} to {end_date}")

    try:
        response = requests.post(endpoint, headers=headers, data=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Search failed: {e}")
        return None

# --- USAGE EXAMPLES ---
if __name__ == "__main__":
    
    # Scenario 1: IPC 302 (Murder) in Supreme Court, last 5 years
    print("\n--- SCENARIO 1: Modern Supreme Court Murder Cases ---")
    results = search_section_with_filters(
        section="302",
        act="Indian Penal Code",
        court="supremecourt",       # Filter for Supreme Court only
        start_date="01-01-2019",    # From Jan 1st, 2019
        end_date="31-12-2023"
    )

    print(results)

    # if results and 'docs' in results:
    #     for doc in results['docs'][:2]:
    #         print(f"Case: {doc['title']}")
    #         print(f"Date: {doc['publishdate']}")
    #         print("-" * 30)

    # Scenario 2: BNS 103 (New Murder Law) - Any High Court
    # Since BNS is new, date filtering is less critical, but good for precision.
    # print("\n--- SCENARIO 2: Bharatiya Nyaya Sanhita (New Law) ---")
    # bns_results = search_section_with_filters(
    #     section="103",
    #     act="Bharatiya Nyaya Sanhita",
    #     court="highcourts",         # Filter for ALL High Courts
    #     start_date="01-07-2024"     # BNS came into effect July 1, 2024
    # )
    
    # if bns_results and 'docs' in bns_results:
    #     print(f"Found {len(bns_results['docs'])} cases citing BNS Section 103.")
    # else:
    #     print("No cases found yet (Expected, as law is very recent).")