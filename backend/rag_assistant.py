import os
import re
import json
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from openai import OpenAI
from backend.web_searcher import get_integrated_web_context

# Load .env file manually if python-dotenv is not installed
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# Embedded Knowledge Base containing official guidelines tagged by department categories
GUIDELINES_CORPUS = [
    {
        "topic": "Fever after vaccination",
        "category": "Health & Medical Services 🏥",
        "keywords": ["fever", "vaccine", "vaccination", "injection", "temp", "temperature", "immunization", "paracetamol", "dpt", "measles"],
        "content": "Mild fever (up to 101°F) is a common, normal reaction after vaccines like Pentavalent, DPT, or Measles. It shows the vaccine is working. Guidance: 1. Give Paracetamol syrup/drops according to the child's weight (approx 15mg/kg per dose, every 4-6 hours if needed). 2. Keep the child hydrated; continue frequent breastfeeding. 3. Sponge the child with lukewarm water (never cold water). 4. Dress the child in light clothing and do not wrap in heavy blankets. Warning: If the fever exceeds 102.5°F, lasts more than 48 hours, or the child is unusually lethargic or having fits, refer immediately to the nearest Medical Officer at the Primary Health Centre (PHC).",
        "source": "Ministry of Health & Family Welfare (MoHFW) immunization guidelines"
    },
    {
        "topic": "Anemia prevention in pregnancy",
        "category": "Health & Medical Services 🏥",
        "keywords": ["anemia", "blood", "weakness", "iron", "folic acid", "ifa", "tablet", "dizziness", "low blood", "nutrition", "diet"],
        "content": "Anemia is highly prevalent. Pregnant women require iron supplementation. Guidance: 1. Consumes iron-rich foods: Green leafy vegetables (spinach, drumstick leaves), jaggery, sesame seeds, ragi, pulses, and lean meat/poultry. 2. Take one Iron and Folic Acid (IFA) tablet daily starting from the second trimester (14th week) for at least 180 days. 3. CRITICAL: Do not take IFA tablets with milk, tea, or coffee, as calcium and tannins inhibit iron absorption. 4. Take IFA tablets with Vitamin C (lemon juice, amla, orange juice) to enhance absorption. 5. Deworming: Administer a single dose of Albendazole (400mg) after the first trimester (usually in the 2nd trimester) to treat worm infestations.",
        "source": "Anemia Mukt Bharat Operational Guidelines"
    },
    {
        "topic": "Danger signs during pregnancy",
        "category": "Health & Medical Services 🏥",
        "keywords": ["danger", "warning", "emergency", "bleeding", "severe headache", "blurred vision", "pain", "swelling", "seizure", "convulsions"],
        "content": "ASHA workers must counsel families to recognize these obstetric danger signs and arrange transport immediately. Danger Signs: 1. Vaginal bleeding (even spotting) at any point during pregnancy. 2. Severe headache, double or blurred vision (signs of pre-eclampsia/eclampsia). 3. Swelling of the face, hands, and feet accompanied by high blood pressure. 4. Severe, persistent abdominal pain. 5. Fits or convulsions (eclampsia). 6. Reduced or absent fetal movements after the 5th month. 7. High fever with chills and foul-smelling vaginal discharge. Action: Arrange immediate transport using 102/108 government ambulance services to the nearest Referral Hospital/CHC.",
        "source": "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) Training Manual"
    },
    {
        "topic": "Exclusive breastfeeding",
        "category": "Nutrition & Child Welfare 🍎",
        "keywords": ["breastfeed", "breastfeeding", "milk", "colostrum", "exclusive", "water", "feeding", "baby food", "newborn food"],
        "content": "Exclusive breastfeeding is crucial for the first 6 months of life. Guidance: 1. Initiate breastfeeding within one hour of birth (early initiation). 2. Feed the newborn 'Colostrum' (first thick, yellowish milk). It is rich in antibodies and acts as the baby's first vaccine. Do not discard it. 3. Give ONLY breast milk. Do NOT give water, honey, ghutti, animal milk, or formula during the first 6 months. Even in hot summer, breast milk contains over 80% water and is sufficient. 4. Breastfeed on demand (whenever the baby cries, at least 8 to 12 times a day and night). 5. Continue breastfeeding up to 2 years of age or beyond along with appropriate complementary feeding starting at 6 months.",
        "source": "WHO & UNICEF Breastfeeding Recommendations"
    },
    {
        "topic": "Newborn hypothermia / warmth",
        "category": "Nutrition & Child Welfare 🍎",
        "keywords": ["warmth", "cold", "hypothermia", "bath", "bathing", "kangaroo", "skin to skin", "newborn care"],
        "content": "Hypothermia (baby getting cold) is a leading cause of neonatal death. Guidance: 1. Delay bathing: Do not bathe the baby for the first 24-48 hours. If the baby is low birth weight, delay bathing for a week. Wipe with a warm damp cloth instead. 2. Keep the baby wrapped in 3-4 layers of dry, warm clothes, including a cap to prevent heat loss from the head. 3. Kangaroo Mother Care (KMC): Promote skin-to-skin contact between the mother (or father) and the baby. KMC provides warmth, promotes breastfeeding, and prevents infections. KMC should be done for at least 1-2 hours at a time, multiple times a day.",
        "source": "WHO Essential Newborn Care Guidelines"
    },
    {
        "topic": "Child growth and malnutrition signs",
        "category": "Nutrition & Child Welfare 🍎",
        "keywords": ["malnutrition", "weight", "growth", "height", "sam", "mam", "thin", "weak child", "undernourished", "nutrition", "anganwadi"],
        "content": "Early detection of Severe Acute Malnutrition (SAM) and Moderate Acute Malnutrition (MAM) prevents child mortality. Indicators to check: 1. Mid-Upper Arm Circumference (MUAC): Check using the red-yellow-green MUAC tape. Under 11.5 cm (Red) indicates SAM. 11.5 cm to 12.5 cm (Yellow) indicates MAM. 2. Weight-for-height: Check against the WHO growth chart. Below -3 standard deviations (SD) is SAM. 3. Bilateral Pitting Edema: Press the top of both feet gently for 3 seconds. If a dent remains, it is a sign of severe malnutrition. Action: Refer SAM children with complications to the nearest Nutrition Rehabilitation Centre (NRC). For MAM or SAM without complications, enroll in Anganwadi supplementary feeding and monitor weekly.",
        "source": "Integrated Child Development Services (ICDS) Growth Standards"
    }
]

# Keyword-to-Category mapping for deterministic query classification
CATEGORY_KEYWORDS = {
    "Health & Medical Services 🏥": [
        "fever", "vaccine", "vaccination", "immunization", "pregnancy", "pregnant",
        "anemia", "blood", "iron", "folic", "ifa", "tablet", "bp", "blood pressure",
        "danger", "bleeding", "headache", "convulsions", "seizure", "eclampsia",
        "hospital", "phc", "doctor", "medical", "health", "ambulance", "delivery",
        "anc", "checkup", "prenatal", "postnatal", "maternal", "neonatal",
        "medicine", "disease", "infection", "diarrhea", "pneumonia", "malaria",
        "tb", "tuberculosis", "hiv", "aids", "diabetes", "hypertension",
        "ayushman", "pmsma", "jsy", "janani", "suraksha", "matritva",
        "injection", "paracetamol", "dpt", "measles", "polio", "bcg",
        "symptoms", "treatment", "diagnosis", "referral", "emergency",
        "systolic", "diastolic"
    ],
    "Nutrition & Child Welfare 🍎": [
        "breastfeed", "breastfeeding", "colostrum", "milk", "newborn", "baby",
        "infant", "nutrition", "malnutrition", "sam", "mam", "muac",
        "growth", "stunting", "wasting", "underweight", "anganwadi", "icds",
        "complementary feeding", "weaning", "child food", "baby food",
        "hypothermia", "kangaroo", "skin to skin", "warmth", "bathing",
        "vitamin", "zinc", "ors", "dehydration", "diet", "food",
        "supplementary", "take home ration", "thr", "mid day meal",
        "poshan", "child welfare", "nrc"
    ],
    "Education & Youth Development 🎓": [
        "school", "education", "scholarship", "student", "college",
        "exam", "admission", "enrollment", "dropout", "tuition",
        "post matric", "pre matric", "vidyalaya", "university",
        "training", "youth", "degree", "certificate"
    ],
    "Rural Development & Panchayat 🏡": [
        "panchayat", "gram sabha", "rural", "village", "road", "housing",
        "pmay", "awas", "mgnrega", "nrega", "employment guarantee",
        "land", "patta", "gram panchayat", "block", "district"
    ],
    "Agriculture & Allied Activities 🌾": [
        "farmer", "agriculture", "crop", "seed", "fertilizer", "irrigation",
        "kisan", "pm kisan", "msp", "harvest", "soil", "pesticide",
        "cattle", "livestock", "dairy", "fishery", "poultry"
    ],
    "Women Empowerment & Welfare 👩": [
        "women", "girl child", "dowry", "domestic violence", "beti",
        "mahila", "lado", "protsahan", "self help group", "shg",
        "sukanya", "widow", "empowerment"
    ],
    "Food & Public Distribution 🍚": [
        "ration", "ration card", "pds", "bpl", "apl", "rice", "wheat",
        "sugar", "kerosene", "fair price", "food security", "nfsa",
        "antyodaya", "public distribution"
    ],
    "Sanitation & Environmental Services ♻️": [
        "toilet", "sanitation", "swachh", "bharat", "cleanliness",
        "waste", "garbage", "sewage", "drinking water",
        "handwashing", "hygiene", "odf"
    ],
    "Disaster Management 🚨": [
        "flood", "earthquake", "cyclone", "drought", "disaster",
        "relief", "evacuation", "rescue", "emergency shelter", "ndrf"
    ],
    "Digital & E-Governance 💻": [
        "digital", "online", "portal", "app", "aadhaar", "pan",
        "digilocker", "umang", "e-governance", "csc", "common service"
    ],
    "Banking & Financial Inclusion 🏦": [
        "bank", "account", "jan dhan", "loan", "mudra", "insurance",
        "pmjjby", "pmsby", "pension", "atal", "financial", "credit",
        "savings", "interest", "subsidy"
    ],
    "Skill Development & Employment 🛠️": [
        "skill", "employment", "job", "training", "apprentice",
        "pmkvy", "kaushal", "rozgar", "placement", "livelihood"
    ],
    "Transportation & Public Safety 🚌": [
        "transport", "bus", "road safety", "license", "vehicle",
        "accident", "traffic", "helmet", "public safety"
    ],
    "Tribal & Minority Welfare 🪶": [
        "tribal", "adivasi", "minority", "scheduled tribe", "st",
        "forest rights", "van dhan", "tribal welfare"
    ],
    "Election & Civic Administration 🗳️": [
        "election", "voter", "vote", "voter id", "booth",
        "civic", "municipality", "birth certificate", "death certificate"
    ],
    "Urban Community Support 🏙️": [
        "urban", "slum", "city", "smart city",
        "urban poor", "jnnurm", "pmay urban"
    ]
}

def classify_query_category(query: str) -> Optional[str]:
    """
    Deterministic keyword-based classifier that identifies the best-matching
    category for a user query. Returns None if no category matches confidently.
    """
    query_lower = query.lower()
    query_tokens = set(re.findall(r'\w+', query_lower))
    
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            # Support multi-word keyword matching
            if " " in keyword:
                if keyword in query_lower:
                    score += 5
            elif keyword in query_tokens:
                score += 3
            # Partial substring match for longer keywords
            elif len(keyword) > 3 and keyword in query_lower:
                score += 1
        if score > 0:
            scores[cat] = score
    
    if not scores:
        return None
    
    # Return the category with the highest score
    best_category = max(scores, key=scores.get)
    return best_category

def search_guidelines(query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Performs a keyword-based ranking of the guidelines corpus.
    Restricts search to the active department category if supplied.
    """
    query_tokens = set(re.findall(r'\w+', query.lower()))
    matches = []
    
    for guide in GUIDELINES_CORPUS:
        # Category Restriction: only match guidelines within the active department
        if category and guide.get("category") != category:
            continue
            
        score = 0
        # Score matching keywords
        for keyword in guide["keywords"]:
            if keyword in query_tokens:
                score += 3
        # Score content matches
        content_lower = guide["content"].lower()
        for token in query_tokens:
            if token in content_lower:
                score += 1
                
        if score > 0:
            matches.append({
                "topic": guide["topic"],
                "content": guide["content"],
                "source": guide["source"],
                "score": score
            })
            
    # Sort matches by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches

def generate_rag_response(query: str, category: Optional[str] = None, is_offline: Optional[bool] = False) -> Dict[str, Any]:
    """
    Unified RAG responder supporting category scoping, offline generative fallback, 
    and online real-time web-grounded search.
    Includes a deterministic category orchestrator that reroutes out-of-scope queries.
    """
    # 0. Deterministic Category Orchestration — classify the query first
    detected_category = classify_query_category(query)
    
    if category and detected_category and detected_category != category:
        # Query belongs to a DIFFERENT category — reroute the user
        return {
            "query": query,
            "answer": None,
            "sources": [],
            "reroute": True,
            "detected_category": detected_category,
            "active_category": category,
            "reroute_message": f"This question appears to be about **{detected_category}**, but your active category is **{category}**. Please switch to the correct category to get the best answer."
        }
    
    # 1. Scope local guidelines matching search
    matches = search_guidelines(query, category)
    
    # 2. Configure System scoping prompt
    dept_info = f"Active Department: {category or 'General maternal & child welfare'}"
    
    scoping_instructions = f"""
    You are ASHA Copilot, a clinical support AI for ASHA workers in India.
    Your active workspace department is strictly: [{dept_info}].
    
    CRITICAL RULE: You must ONLY answer questions, provide guidelines, or discuss topics directly related to the active department [{dept_info}].
    If the worker asks about another category (e.g. pregnancy health but active department is Education or Nutrition), or vice versa, you MUST politely refuse to answer, explain the department mismatch, and instruct them to change the active department in the left sidebar first.
    """
    
    # 3. Handle Offline Mode
    if is_offline:
        if not matches:
            return {
                "query": query,
                "answer": f"⚠️ Device is currently in **OFFLINE MODE**.\nNo pre-loaded local handbook guidelines found for this query in [{dept_info}]. Please switch to ONLINE MODE to consult the live web knowledge base.",
                "sources": []
            }
            
        # Generative RAG with local handbook only
        top_matches = matches[:2]
        context_str = "\n\n".join([f"Source: {m['source']}\nTopic: {m['topic']}\nGuidelines: {m['content']}" for m in top_matches])
        
        system_prompt = f"""
        {scoping_instructions}
        
        Answer the clinical query using ONLY the pre-loaded offline local guidelines provided below. Do not assume or formulate details outside of these guidelines.
        
        Offline Guidelines Context:
        {context_str}
        
        Provide the response in simple language with bullet points. Emphasize referral safety steps clearly.
        Add a note at the end: "*(Note: This guidance was generated in Offline Mode using matching local handbook entries.)*"
        """
        
        if GEMINI_KEY:
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(f"{system_prompt}\n\nQuestion: \"{query}\"")
                return {
                    "query": query,
                    "answer": response.text.strip(),
                    "sources": [m["source"] for m in top_matches]
                }
            except Exception as e:
                print(f"Gemini offline RAG failed: {e}")
                
        # Zero-key static fallback
        best_match = top_matches[0]
        return {
            "query": query,
            "answer": f"Here is the local offline guideline regarding **{best_match['topic']}**:\n\n{best_match['content']}\n\n*Source: {best_match['source']}*",
            "sources": [best_match["source"]]
        }
        
    # 4. Handle Online Mode
    # Scenario A: Local Guideline is matched
    if matches:
        top_matches = matches[:2]
        context_str = "\n\n".join([f"Source: {m['source']}\nTopic: {m['topic']}\nGuidelines: {m['content']}" for m in top_matches])
        
        system_prompt = f"""
        {scoping_instructions}
        
        Answer the clinical query primarily based on the official guidelines context provided below. Supplement with standard medical guidelines only if necessary.
        
        Guidelines Context:
        {context_str}
        
        Provide response in simple language with bullet points and emphasize safety referrals.
        """
        
        if GEMINI_KEY:
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(f"{system_prompt}\n\nQuestion: \"{query}\"")
                return {
                    "query": query,
                    "answer": response.text.strip(),
                    "sources": [m["source"] for m in top_matches]
                }
            except Exception as e:
                print(f"Gemini online RAG failed: {e}")

    # Scenario B: No Local Guideline matched -> Perform Web Grounded Search
    else:
        # Perform live web search to DuckDuckGo/Wikipedia
        web_context = get_integrated_web_context(query)
        
        system_prompt = f"""
        {scoping_instructions}
        
        CRITICAL RULE: The local handbook contains no matching entries for this question. You MUST answer this query directly using the live web search context below. Do not use your own pre-trained medical knowledge base directly unless supported by this web context.
        
        Web Search Context:
        {web_context}
        
        Provide the response in simple language, using bullet points for steps.
        Always highlight warning signs and ambulance referral steps (102/108) clearly.
        Add a footnote at the end: "*(Note: This guidance was gathered in Online Mode directly from live web search summaries.)*"
        """
        
        if GEMINI_KEY:
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(f"{system_prompt}\n\nQuestion: \"{query}\"")
                return {
                    "query": query,
                    "answer": response.text.strip(),
                    "sources": ["Live Web Search (DuckDuckGo & Wikipedia APIs)"]
                }
            except Exception as e:
                print(f"Gemini Web RAG failed: {e}")
                
        if OPENAI_KEY:
            try:
                client = OpenAI(api_key=OPENAI_KEY)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ]
                )
                return {
                    "query": query,
                    "answer": response.choices[0].message.content.strip(),
                    "sources": ["Live Web Search (DuckDuckGo & Wikipedia APIs)"]
                }
            except Exception as e:
                print(f"OpenAI Web RAG failed: {e}")

        # Zero-key fallback
        return {
            "query": query,
            "answer": f"I could not search the web or find specific guidelines in the offline database matching your query for active department [{dept_info}]. Please switch categories or consult the block medical officer.",
            "sources": []
        }
