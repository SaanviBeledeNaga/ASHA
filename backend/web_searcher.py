import requests
import urllib.parse

def search_web_ddg(query: str) -> str:
    """
    Queries DuckDuckGo's Instant Answer API for a clean abstract summary.
    """
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        results = []
        abstract = data.get("AbstractText", "")
        if abstract:
            results.append(f"Abstract Summary: {abstract}")
            
        for topic in data.get("RelatedTopics", [])[:2]:
            text = topic.get("Text", "")
            if text:
                results.append(f"Standard Detail: {text}")
                
        return "\n".join(results)
    except Exception as e:
        print(f"DDG API Error: {e}")
        return ""

def search_web_wikipedia(query: str) -> str:
    """
    Queries the Wikipedia OpenSearch API to get highly reliable clinical summaries.
    """
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote(query)}&limit=3&namespace=0&format=json"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        # Opensearch format: [query, [titles], [descriptions], [links]]
        titles = data[1]
        descriptions = data[2]
        
        results = []
        for title, desc in zip(titles, descriptions):
            if title and desc:
                results.append(f"Wikipedia Topic ({title}): {desc}")
                
        return "\n".join(results)
    except Exception as e:
        print(f"Wikipedia API Error: {e}")
        return ""

def get_integrated_web_context(query: str) -> str:
    """
    Assembles summaries from DDG and Wikipedia into a unified search context block.
    """
    ddg_context = search_web_ddg(query)
    wiki_context = search_web_wikipedia(query)
    
    combined = []
    if ddg_context:
        combined.append(ddg_context)
    if wiki_context:
        combined.append(wiki_context)
        
    return "\n\n".join(combined)
