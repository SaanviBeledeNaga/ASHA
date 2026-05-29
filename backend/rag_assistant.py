import os
import re
import json
from typing import Dict, Any, List
import google.generativeai as genai
from openai import OpenAI

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

# Embedded Knowledge Base containing official maternal, child health, and vaccine guidelines
GUIDELINES_CORPUS = [
    {
        "topic": "Fever after vaccination",
        "keywords": ["fever", "vaccine", "vaccination", "injection", "temp", "temperature", "immunization", "paracetamol", "dpt", "measles"],
        "content": "Mild fever (up to 101°F) is a common, normal reaction after vaccines like Pentavalent, DPT, or Measles. It shows the vaccine is working. Guidance: 1. Give Paracetamol syrup/drops according to the child's weight (approx 15mg/kg per dose, every 4-6 hours if needed). 2. Keep the child hydrated; continue frequent breastfeeding. 3. Sponge the child with lukewarm water (never cold water). 4. Dress the child in light clothing and do not wrap in heavy blankets. Warning: If the fever exceeds 102.5°F, lasts more than 48 hours, or the child is unusually lethargic or having fits, refer immediately to the nearest Medical Officer at the Primary Health Centre (PHC).",
        "source": "Ministry of Health & Family Welfare (MoHFW) immunization guidelines"
    },
    {
        "topic": "Anemia prevention in pregnancy",
        "keywords": ["anemia", "blood", "weakness", "iron", "folic acid", "ifa", "tablet", "dizziness", "low blood", "nutrition", "diet"],
        "content": "Anemia is highly prevalent. Pregnant women require iron supplementation. Guidance: 1. Consumes iron-rich foods: Green leafy vegetables (spinach, drumstick leaves), jaggery, sesame seeds, ragi, pulses, and lean meat/poultry. 2. Take one Iron and Folic Acid (IFA) tablet daily starting from the second trimester (14th week) for at least 180 days. 3. CRITICAL: Do not take IFA tablets with milk, tea, or coffee, as calcium and tannins inhibit iron absorption. 4. Take IFA tablets with Vitamin C (lemon juice, amla, orange juice) to enhance absorption. 5. Deworming: Administer a single dose of Albendazole (400mg) after the first trimester (usually in the 2nd trimester) to treat worm infestations.",
        "source": "Anemia Mukt Bharat Operational Guidelines"
    },
    {
        "topic": "Danger signs during pregnancy",
        "keywords": ["danger", "warning", "emergency", "bleeding", "severe headache", "blurred vision", "pain", "swelling", "seizure", "convulsions"],
        "content": "ASHA workers must counsel families to recognize these obstetric danger signs and arrange transport immediately. Danger Signs: 1. Vaginal bleeding (even spotting) at any point during pregnancy. 2. Severe headache, double or blurred vision (signs of pre-eclampsia/eclampsia). 3. Swelling of the face, hands, and feet accompanied by high blood pressure. 4. Severe, persistent abdominal pain. 5. Fits or convulsions (eclampsia). 6. Reduced or absent fetal movements after the 5th month. 7. High fever with chills and foul-smelling vaginal discharge. Action: Arrange immediate transport using 102/108 government ambulance services to the nearest Referral Hospital/CHC.",
        "source": "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) Training Manual"
    },
    {
        "topic": "Exclusive breastfeeding",
        "keywords": ["breastfeed", "breastfeeding", "milk", "colostrum", "exclusive", "water", "feeding", "baby food", "newborn food"],
        "content": "Exclusive breastfeeding is crucial for the first 6 months of life. Guidance: 1. Initiate breastfeeding within one hour of birth (early initiation). 2. Feed the newborn 'Colostrum' (first thick, yellowish milk). It is rich in antibodies and acts as the baby's first vaccine. Do not discard it. 3. Give ONLY breast milk. Do NOT give water, honey, ghutti, animal milk, or formula during the first 6 months. Even in hot summer, breast milk contains over 80% water and is sufficient. 4. Breastfeed on demand (whenever the baby cries, at least 8 to 12 times a day and night). 5. Continue breastfeeding up to 2 years of age or beyond along with appropriate complementary feeding starting at 6 months.",
        "source": "WHO & UNICEF Breastfeeding Recommendations"
    },
    {
        "topic": "Newborn hypothermia / warmth",
        "keywords": ["warmth", "cold", "hypothermia", "bath", "bathing", "kangaroo", "skin to skin", "newborn care"],
        "content": "Hypothermia (baby getting cold) is a leading cause of neonatal death. Guidance: 1. Delay bathing: Do not bathe the baby for the first 24-48 hours. If the baby is low birth weight, delay bathing for a week. Wipe with a warm damp cloth instead. 2. Keep the baby wrapped in 3-4 layers of dry, warm clothes, including a cap to prevent heat loss from the head. 3. Kangaroo Mother Care (KMC): Promote skin-to-skin contact between the mother (or father) and the baby. KMC provides warmth, promotes breastfeeding, and prevents infections. KMC should be done for at least 1-2 hours at a time, multiple times a day.",
        "source": "WHO Essential Newborn Care Guidelines"
    },
    {
        "topic": "Child growth and malnutrition signs",
        "keywords": ["malnutrition", "weight", "growth", "height", "sam", "mam", "thin", "weak child", "undernourished", "nutrition", "anganwadi"],
        "content": "Early detection of Severe Acute Malnutrition (SAM) and Moderate Acute Malnutrition (MAM) prevents child mortality. Indicators to check: 1. Mid-Upper Arm Circumference (MUAC): Check using the red-yellow-green MUAC tape. Under 11.5 cm (Red) indicates SAM. 11.5 cm to 12.5 cm (Yellow) indicates MAM. 2. Weight-for-height: Check against the WHO growth chart. Below -3 standard deviations (SD) is SAM. 3. Bilateral Pitting Edema: Press the top of both feet gently for 3 seconds. If a dent remains, it is a sign of severe malnutrition. Action: Refer SAM children with complications to the nearest Nutrition Rehabilitation Centre (NRC). For MAM or SAM without complications, enroll in Anganwadi supplementary feeding and monitor weekly.",
        "source": "Integrated Child Development Services (ICDS) Growth Standards"
    }
]

def search_guidelines(query: str) -> List[Dict[str, Any]]:
    """
    Performs a keyword-based ranking of the guidelines corpus.
    Returns sorted list of matches with scores.
    """
    query_tokens = set(re.findall(r'\w+', query.lower()))
    matches = []
    
    for guide in GUIDELINES_CORPUS:
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

def generate_rag_response(query: str) -> Dict[str, Any]:
    """
    Searches relevant guidelines and generates an LLM answer.
    If no LLM keys, returns the best guideline directly.
    """
    matches = search_guidelines(query)
    
    if not matches:
        return {
            "query": query,
            "answer": "I could not find specific guidelines in the database matching your query. Please refer to your primary ASHA handbook or consult the block medical officer.",
            "sources": []
        }
        
    # Take the top matched guidelines
    top_matches = matches[:2]
    context_str = "\n\n".join([f"Source: {m['source']}\nTopic: {m['topic']}\nGuidelines: {m['content']}" for m in top_matches])
    
    system_prompt = f"""
    You are ASHA Copilot, a supportive AI assistant for Accredited Social Health Activists (ASHA workers) in India.
    Your task is to answer the ASHA worker's clinical or procedural question based ONLY on the guidelines context provided below.
    Provide the response in simple, easy-to-understand language. Use bullet points for steps where appropriate.
    Always emphasize safety: if there are warning signs, list them clearly and advise when to refer the patient to a PHC/doctor.
    Do not add any medical advice or recommendations that are not supported by the provided guidelines.

    Guidelines Context:
    {context_str}
    """

    # Try Gemini API
    if GEMINI_KEY:
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(
                f"{system_prompt}\n\nQuestion: \"{query}\""
            )
            return {
                "query": query,
                "answer": response.text.strip(),
                "sources": [m["source"] for m in top_matches]
            }
        except Exception as e:
            print(f"Gemini RAG generation failed: {e}")

    # Try OpenAI API
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
                "sources": [m["source"] for m in top_matches]
            }
        except Exception as e:
            print(f"OpenAI RAG generation failed: {e}")

    # Fallback to local template if no keys are set
    best_match = top_matches[0]
    local_answer = f"""Here is the official guideline regarding **{best_match['topic']}**:

{best_match['content']}

*Source: {best_match['source']}*
"""
    return {
        "query": query,
        "answer": local_answer,
        "sources": [best_match["source"]]
    }
Keep = True
