import requests

def search_ddg_api(query: str) -> str:
    try:
        url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1"
        response = requests.get(url, timeout=5)
        print("API RESPONSE CODE:", response.status_code)
        data = response.json()
        
        results = []
        abstract = data.get("AbstractText", "")
        if abstract:
            results.append(f"Abstract: {abstract}")
            
        for topic in data.get("RelatedTopics", [])[:3]:
            text = topic.get("Text", "")
            if text:
                results.append(f"Topic: {text}")
                
        return "\n\n".join(results)
    except Exception as e:
        return f"Error: {e}"

print("TESTING DUCKDUCKGO JSON API:")
print(search_ddg_api("anemia in pregnancy"))
