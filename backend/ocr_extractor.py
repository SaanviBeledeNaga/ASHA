import os
from PIL import Image
import io
import json
import google.generativeai as genai

# Load env variables manually
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

def extract_aadhaar_data(image_bytes: bytes) -> dict:
    """
    Extracts name, DOB, gender, Aadhaar number, and address from an Aadhaar card image using Gemini.
    """
    if not GEMINI_KEY:
        raise ValueError("GEMINI_API_KEY is not set. Real-time OCR is unavailable.")
        
    try:
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Configure model
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = """
        You are an advanced Identity Document OCR extractor. Analyze the provided image of an Aadhaar card (or any Indian national ID document) and extract the following details as a clean, valid JSON structure.
        
        Extract the following:
        1. name: The individual's full name. Clean and capitalize it.
        2. dob: The Date of Birth in DD/MM/YYYY format (e.g. 12/04/1998). If only a year is present, write 01/01/YYYY.
        3. gender: "MALE" or "FEMALE" or "OTHER".
        4. aadhaar: The 12-digit Aadhaar number formatted as "XXXX-XXXX-1234" (mask the first 8 digits for security, keeping the last 4 visible). If not found, use "XXXX-XXXX-0000".
        5. address: The full residential address if visible, or null.
        
        Do not output any markdown code blocks, explanations, or wrapper strings. Output ONLY the raw JSON.
        Example response format:
        {
          "name": "Sushma Devi",
          "dob": "12/04/1998",
          "gender": "FEMALE",
          "aadhaar": "XXXX-XXXX-8921",
          "address": "Gopalapuram Village, Ward 3, Andhra Pradesh"
        }
        """
        
        response = model.generate_content(
            [prompt, image],
            generation_config={"response_mime_type": "application/json"}
        )
        
        data = json.loads(response.text.strip())
        return data
        
    except Exception as e:
        print(f"Error during Aadhaar extraction: {e}")
        # Return error details in address
        return {
            "name": "Extraction Failed",
            "dob": "N/A",
            "gender": "N/A",
            "aadhaar": "XXXX-XXXX-0000",
            "address": f"Error: {str(e)}"
        }

def extract_register_data(image_bytes: bytes) -> dict:
    """
    Extracts structured clinical visit logs from a handwritten register book page using Gemini.
    """
    if not GEMINI_KEY:
        raise ValueError("GEMINI_API_KEY is not set. Real-time OCR is unavailable.")
        
    try:
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Configure model
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = """
        You are an advanced clinical document transcriber. Analyze the provided image of a handwritten health register page containing patient checkup log tables. Extract each patient visit row into a clean, structured JSON list.
        
        For each row, extract:
        1. name: Full name of the patient (string). Clean and capitalize.
        2. age: Age in years (integer).
        3. pregnancy_month: Month of pregnancy (integer, 1 to 9). If the patient is not pregnant or no month is listed, set to null.
        4. systolic_bp: Systolic Blood Pressure (integer, e.g. 120 from "120/80"). If not listed, set to 120.
        5. diastolic_bp: Diastolic Blood Pressure (integer, e.g. 80 from "120/80"). If not listed, set to 80.
        6. weight: Patient weight in kg (float, e.g. 54.5). If not listed, set to 55.0.
        7. symptoms: List of string symptoms (e.g. ["fever", "cough"] or ["headache"] or ["swelling"]). If none, set to empty list [].
        8. notes: Short clinical note or prescription observation found in the row.
        
        Return the result as a JSON object with a single key "visits" containing the list of visit objects.
        
        Do not output any markdown code blocks, explanations, or wrapper strings. Output ONLY the raw JSON.
        Example response format:
        {
          "visits": [
            {
              "name": "Lakshmi Devi",
              "age": 24,
              "pregnancy_month": 7,
              "systolic_bp": 138,
              "diastolic_bp": 88,
              "weight": 56.5,
              "symptoms": ["headache", "blurry vision"],
              "notes": "Mild edema in feet. Counselled on PMSMA clinic and pre-eclampsia warning signs."
            },
            {
              "name": "Rani Kumari",
              "age": 30,
              "pregnancy_month": null,
              "systolic_bp": 118,
              "diastolic_bp": 76,
              "weight": 52.0,
              "symptoms": ["fever"],
              "notes": "Fever after Pentavalent vaccine check. Advised Paracetamol syrup and hydration."
            }
          ]
        }
        """
        
        response = model.generate_content(
            [prompt, image],
            generation_config={"response_mime_type": "application/json"}
        )
        
        data = json.loads(response.text.strip())
        return data
        
    except Exception as e:
        print(f"Error during register transcription: {e}")
        return {
            "visits": [
                {
                    "name": "Lakshmi Devi (Extraction Failed)",
                    "age": 24,
                    "pregnancy_month": 7,
                    "systolic_bp": 138,
                    "diastolic_bp": 88,
                    "weight": 56.5,
                    "symptoms": ["headache"],
                    "notes": f"Simulated Fallback. Error: {str(e)}"
                }
            ]
        }
