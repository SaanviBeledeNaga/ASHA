import os
import re
import json
from typing import Dict, Any, Optional
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

# Initialize client wrappers
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

def transcribe_audio(audio_path: str) -> str:
    """
    Transcribes audio using Gemini or OpenAI Whisper. If no key, falls back to a simulated message.
    """
    if GEMINI_KEY:
        try:
            # Upload the audio file to Google AI
            audio_file = genai.upload_file(path=audio_path)
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content([
                "Please transcribe this audio exactly. Do not add any introduction, translation, or extra comments. Just provide the direct transcription.",
                audio_file
            ])
            # Clean up the file from Gemini
            try:
                genai.delete_file(audio_file.name)
            except Exception as delete_err:
                print(f"Failed to delete uploaded audio file: {delete_err}")
            return response.text.strip()
        except Exception as e:
            print(f"Gemini transcription failed: {e}")

    if OPENAI_KEY:
        try:
            client = OpenAI(api_key=OPENAI_KEY)
            with open(audio_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file
                )
            return transcription.text
        except Exception as e:
            print(f"OpenAI transcription failed: {e}")
            
    # Mock fallback for demo
    # We will check if the client provided a custom mock header or return a default
    return "Lakshmi Devi, age 24, 7 months pregnant. BP is 140 over 95. She complains of severe swelling in her feet and a headache."

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Parses a transcription text (which might be in Hinglish, Teluglish, or English)
    and extracts structured medical entities using Gemini, OpenAI, or a robust regex fallback.
    """
    system_prompt = """
    You are ASHA Copilot AI, an expert medical transcription assistant.
    You will receive a transcript of an ASHA worker talking about a patient visit. The language might be English, Hindi, Telugu, or mixed (Hinglish, Teluglish).
    Extract the following information into a clean JSON structure:
    1. name: string or null
    2. age: integer or null
    3. pregnancy_month: integer or null (1 to 9)
    4. systolic_bp: integer or null (e.g. 120 from "120 over 80" or "120/80")
    5. diastolic_bp: integer or null (e.g. 80 from "120 over 80" or "120/80")
    6. weight: float or null (in kg, e.g., 55 or 55.5)
    7. symptoms: list of strings (must choose from: "swelling", "severe headache", "blurred vision", "bleeding", "convulsions", "severe abdominal pain", "fever", "decreased fetal movement", "dizziness", "back pain")
    8. notes: A concise summary string (1-2 sentences) explaining the patient's state and visit context.

    Do not include any formatting or explanation outside of valid JSON.
    Example:
    {
      "name": "Lakshmi",
      "age": 24,
      "pregnancy_month": 7,
      "systolic_bp": 140,
      "diastolic_bp": 95,
      "weight": 58.0,
      "symptoms": ["swelling", "severe headache"],
      "notes": "Patient is in 7th month of pregnancy. BP is elevated at 140/95. Complained of swelling in feet and headache."
    }
    """

    # Try Gemini API if available
    if GEMINI_KEY:
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(
                f"{system_prompt}\n\nTranscript: \"{text}\"",
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
            data["raw_transcription"] = text
            return data
        except Exception as e:
            print(f"Gemini NLP extraction failed: {e}")

    # Try OpenAI API if available
    if OPENAI_KEY:
        try:
            client = OpenAI(api_key=OPENAI_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content.strip())
            data["raw_transcription"] = text
            return data
        except Exception as e:
            print(f"OpenAI NLP extraction failed: {e}")

    # Fallback to local rule-based regex parsing for offline/no-key demo compatibility
    return fallback_regex_extractor(text)


def fallback_regex_extractor(text: str) -> Dict[str, Any]:
    """
    A robust regex-based extractor that parses name, age, pregnancy month, blood pressure, weight,
    and common symptoms from English, Hinglish, or Teluglish phrases for the zero-config demo mode.
    """
    text_lower = text.lower()
    
    # 1. Extract BP (e.g., "140 over 95", "120/80", "130 and 85", "bp 140, 90")
    systolic = None
    diastolic = None
    bp_match = re.search(r'(\d{2,3})\s*(?:over|/|and|\s)\s*(\d{2,3})', text_lower)
    if bp_match:
        systolic = int(bp_match.group(1))
        diastolic = int(bp_match.group(2))
    else:
        # Look for numbers near bp
        bp_numbers = re.findall(r'bp\s*(\d{2,3})[\s,]+(\d{2,3})', text_lower)
        if bp_numbers:
            systolic = int(bp_numbers[0][0])
            diastolic = int(bp_numbers[0][1])
            
    # 2. Extract Name
    # Match phrases like "name is X", "patient is X", "Lakshmi Devi", or capitalized words at the beginning
    name = None
    name_patterns = [
        r'name is\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)',
        r'patient\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)',
        r'([a-zA-Z]+\s+devi)',
        r'([a-zA-Z]+\s+sharma)',
        r'([a-zA-Z]+\s+rao)'
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text_lower)
        if match:
            # Capitalize properly
            name = match.group(1).title()
            break
            
    if not name:
        # Check standard dummy names
        for k in ["Lakshmi Devi", "Priya Sharma", "Anitha Rao", "Sunitha V.", "Ganga Ma", "Lakshmi", "Priya", "Anitha", "Sunitha", "Ganga", "Kamala", "Sita"]:
            if k.lower() in text_lower:
                name = k
                break
                
    # 3. Extract Age
    age = None
    age_match = re.search(r'age\s*(?:is)?\s*(\d{2})|(\d{2})\s*(?:years|years old|age)', text_lower)
    if age_match:
        age = int(age_match.group(1) or age_match.group(2))
        
    # 4. Extract Pregnancy Month
    month = None
    month_match = re.search(r'(?:month|months|pregnancy month)\s*(?:is)?\s*(\d+)|(\d+)\s*(?:month|months|th month|pregnancy month)', text_lower)
    if month_match:
        val = month_match.group(1) or month_match.group(2)
        month = int(val)
        if month > 9:
            month = None  # sanity check
            
    # 5. Extract Weight
    weight = None
    weight_match = re.search(r'weight\s*(?:is)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos)?|(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos)', text_lower)
    if weight_match:
        val = weight_match.group(1) or weight_match.group(2)
        weight = float(val)
        
    # 6. Extract Symptoms
    symptoms = []
    available_symptoms = {
        "swelling": ["swelling", "edema", "vupu", "soojan"],
        "severe headache": ["headache", "head ache", "talanoppi", "sir dard"],
        "blurred vision": ["blurred vision", "double vision", "mabbu", "drishti"],
        "bleeding": ["bleeding", "rakthasravam", "khoon"],
        "convulsions": ["convulsions", "fits", "fitsu", "jhhatka"],
        "severe abdominal pain": ["abdominal pain", "stomach pain", "kanti noppi", "pet dard"],
        "fever": ["fever", "jwaram", "bukhar"],
        "decreased fetal movement": ["decreased movement", "fetal movement", "bidda kadalika"],
        "dizziness": ["dizziness", "giddy", "kallu tiragadam", "chakkar"],
        "back pain": ["back pain", "nadumu noppi", "peeth dard"]
    }
    
    for sym_name, keywords in available_symptoms.items():
        for keyword in keywords:
            if keyword in text_lower:
                symptoms.append(sym_name)
                break
                
    # Create notes summary
    notes_list = []
    if name:
        notes_list.append(f"Visit conducted for {name}.")
    if systolic and diastolic:
        notes_list.append(f"Blood pressure measured at {systolic}/{diastolic} mmHg.")
    if month:
        notes_list.append(f"Beneficiary is in month {month} of pregnancy.")
    if symptoms:
        notes_list.append(f"Complaining of {', '.join(symptoms)}.")
    else:
        notes_list.append("No active physical symptoms reported.")
        
    notes = " ".join(notes_list)
    
    return {
        "name": name or "Unknown",
        "age": age or 25,
        "pregnancy_month": month or 6,
        "systolic_bp": systolic or 120,
        "diastolic_bp": diastolic or 80,
        "weight": weight or 55.0,
        "symptoms": symptoms,
        "notes": notes,
        "raw_transcription": text
    }
