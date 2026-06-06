import os
import shutil
import json
import re
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from backend.database import (
    init_db, add_beneficiary, get_beneficiary, get_all_beneficiaries,
    add_visit, get_beneficiary_visits, add_alert, get_active_alerts,
    resolve_alert, update_beneficiary_risk, add_user, authenticate_user
)
from backend.rules_engine import evaluate_clinical_risk, match_eligible_schemes
from backend.voice_extractor import transcribe_audio, extract_structured_data
from backend.rag_assistant import generate_rag_response
from backend.ocr_extractor import extract_aadhaar_data, extract_register_data

# Create app
app = FastAPI(title="ASHA Copilot API", description="AI Companion Backend for ASHA workers")

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Run database setup on startup
@app.on_event("startup")
def startup_event():
    init_db()
    # Create temp directory for audio files if not exists
    os.makedirs("temp", exist_ok=True)

# 1. Root and Static Files serving
# Mount static files folder
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/css", StaticFiles(directory="static/css"), name="css")
app.mount("/js", StaticFiles(directory="static/js"), name="js")

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

# 2. Beneficiary Management Endpoints
class BeneficiaryCreateSchema(BaseModel):
    name: str
    age: int
    phone: Optional[str] = None
    village: str
    pregnancy_status: bool
    pregnancy_month: Optional[int] = None

class AutofillProfileSchema(BaseModel):
    name: str
    dob: str
    gender: str
    aadhaar: str
    address: str

# Global state to store the active beneficiary profile for form autofilling
active_autofill_profile = {
    "name": "SUSHMA DEVI",
    "dob": "12/04/1998",
    "gender": "FEMALE",
    "aadhaar": "XXXX-XXXX-8921",
    "address": "GOPALAPURAM VILLAGE, WARD 3, ANDHRA PRADESH"
}

@app.post("/api/beneficiaries")
def create_beneficiary(data: BeneficiaryCreateSchema):
    try:
        ben_id = add_beneficiary(
            name=data.name,
            age=data.age,
            phone=data.phone,
            village=data.village,
            pregnancy_status=data.pregnancy_status,
            pregnancy_month=data.pregnancy_month
        )
        return {"status": "success", "id": ben_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/beneficiaries")
def list_beneficiaries():
    return get_all_beneficiaries()

# 3. Visit Logging and Rules Engine Triggering Endpoints
class VisitCreateSchema(BaseModel):
    name: str # helper for matching name to ID
    age: int
    pregnancy_month: Optional[int] = None
    systolic_bp: int
    diastolic_bp: int
    weight: float
    symptoms: List[str]
    notes: Optional[str] = None
    recommendations: Optional[List[str]] = None
    schemes_eligible: Optional[List[str]] = None

@app.post("/api/visits")
def create_visit(visit: VisitCreateSchema):
    try:
        # Match beneficiary by name (or register new if not exists)
        conn = get_all_beneficiaries()
        beneficiary_id = None
        for b in conn:
            if b["name"].lower() == visit.name.lower():
                beneficiary_id = b["id"]
                break
                
        if beneficiary_id is None:
            # Register new beneficiary if first checkup and not already registered
            # Default village is Gopalapuram for auto-registrations
            beneficiary_id = add_beneficiary(
                name=visit.name,
                age=visit.age,
                phone=None,
                village="Gopalapuram",
                pregnancy_status=(visit.pregnancy_month is not None),
                pregnancy_month=visit.pregnancy_month
            )
            
        # Run rules engine to extract risk assessment and recommended actions
        rules = evaluate_clinical_risk(
            age=visit.age,
            systolic_bp=visit.systolic_bp,
            diastolic_bp=visit.diastolic_bp,
            symptoms=visit.symptoms,
            pregnancy_month=visit.pregnancy_month
        )
        
        # Match schemes
        schemes = match_eligible_schemes(
            pregnancy_status=(visit.pregnancy_month is not None),
            pregnancy_month=visit.pregnancy_month,
            age=visit.age
        )
        
        # Save visit log
        visit_id = add_visit(
            beneficiary_id=beneficiary_id,
            visit_date=visit.notes.split(":")[-1].strip() if (visit.notes and "Date:" in visit.notes) else "2026-05-27",
            systolic_bp=visit.systolic_bp,
            diastolic_bp=visit.diastolic_bp,
            weight=visit.weight,
            symptoms=visit.symptoms,
            notes=visit.notes,
            recommendations=rules["recommendations"],
            schemes=schemes
        )
        
        # Update beneficiary risk level in database
        update_beneficiary_risk(beneficiary_id, rules["risk_level"], visit.pregnancy_month)
        
        # Trigger High-Risk Alarm if evaluated risk level is 'high'
        if rules["risk_level"] == "high":
            alert_msg = f"{visit.name} evaluated at HIGH RISK. " + " ".join(rules["triggers"])
            add_alert(beneficiary_id, "high_risk", alert_msg)
            
        return {
            "status": "success",
            "visit_id": visit_id,
            "risk_level": rules["risk_level"],
            "recommendations": rules["recommendations"],
            "schemes_eligible": schemes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/visits/{beneficiary_id}")
def list_visits(beneficiary_id: int):
    return get_beneficiary_visits(beneficiary_id)

# 4. Critical Alerts Endpoints
@app.get("/api/alerts")
def list_alerts():
    return get_active_alerts()

@app.post("/api/alerts/{alert_id}/resolve")
def resolve_critical_alert(alert_id: int):
    try:
        resolve_alert(alert_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. Voice Processing and Clinical Data NLP Extraction Endpoints
class VoiceTextPayload(BaseModel):
    text: str

@app.post("/api/voice-visit")
async def process_voice_visit(
    file: Optional[UploadFile] = File(None),
    payload: Optional[VoiceTextPayload] = None
):
    try:
        # If actual audio WAV is uploaded via file
        if file:
            temp_path = f"temp/{file.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Transcribe audio using Whisper
            text = transcribe_audio(temp_path)
            
            # Clean up temp file
            os.remove(temp_path)
        elif payload:
            # If preset string sent directly
            text = payload.text
        else:
            raise HTTPException(status_code=400, detail="Must provide audio file or text query.")
            
        # Parse text into structured medical data using LLM
        extracted_data = extract_structured_data(text)
        return extracted_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5b. Document OCR Extractor Endpoint
@app.post("/api/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        extracted_data = extract_aadhaar_data(contents)
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5b-i. Active Autofill Profile Retrieval & Management Endpoints
@app.get("/api/autofill-profile")
def get_autofill_profile():
    return active_autofill_profile

@app.post("/api/autofill-profile")
def update_autofill_profile(profile: AutofillProfileSchema):
    global active_autofill_profile
    active_autofill_profile = {
        "name": profile.name,
        "dob": profile.dob,
        "gender": profile.gender,
        "aadhaar": profile.aadhaar,
        "address": profile.address
    }
    return {"status": "success", "profile": active_autofill_profile}

class PageFieldSchema(BaseModel):
    asha_id: str
    id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    placeholder: Optional[str] = None
    aria_label: Optional[str] = None
    label_text: Optional[str] = None
    radio_option: Optional[str] = None

class MapFieldsRequestSchema(BaseModel):
    fields: List[PageFieldSchema]

def ai_map_fields(fields_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Load .env variables if not already done
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

    GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
    OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")

    system_prompt = """
    You are an AI specialized in web form mapping. Your task is to analyze a list of web form fields and map them to the corresponding beneficiary profile attributes:
    - 'name': Full name of the applicant, beneficiary, candidate, or worker.
    - 'dob': Date of birth, birthdate, age, or DOB.
    - 'gender': Gender, sex, or gender type. Radio button options like Male/Female/Other should ALL be mapped to 'gender'.
    - 'aadhaar': Aadhaar card number, UID, unique ID, identity card, or national ID.
    - 'address': Address, residence, home address, village, registered address, or location. Textareas in a form are frequently used for address fields.

    IMPORTANT: For radio buttons, each option (e.g., Male, Female, Other) should be mapped to 'gender'. The 'radio_option' field tells you what the option text is.
    IMPORTANT: If a textarea has a generic label like "Your answer" but appears after gender/aadhaar fields, it is likely an address field.

    You must output a valid JSON array of objects, where each object corresponds to a field in the input list.
    Each object must have the following fields:
    1. 'asha_id': The exact unique tracking ID ('asha_id') passed in the input object.
    2. 'mapped_field': One of the values: 'name', 'dob', 'gender', 'aadhaar', 'address', or null if it does not fit any profile attribute.
    3. 'confidence': A decimal value between 0.0 and 1.0 representing your confidence in the mapping.

    Format the output STRICTLY as a JSON array. Do not include markdown code block syntax (like ```json ... ```), only the raw JSON string.

    Input fields to analyze:
    {fields_json}
    """

    fields_json = json.dumps(fields_list)
    prompt = system_prompt.format(fields_json=fields_json)

    # 1. Try Gemini
    if GEMINI_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            text = response.text.strip()
            # Clean potential markdown block formatting
            text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text, flags=re.IGNORECASE)
            return json.loads(text)
        except Exception as e:
            print(f"Gemini AI field mapping failed: {e}")

    # 2. Try OpenAI
    if OPENAI_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            text = response.choices[0].message.content.strip()
            text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text, flags=re.IGNORECASE)
            return json.loads(text)
        except Exception as e:
            print(f"OpenAI AI field mapping failed: {e}")

    # 3. Fallback to rule-based mapping
    mappings = []
    
    # Synonym patterns (dictionary-based fuzzy match)
    patterns = {
        "name": ["name", "full_name", "fullname", "first_name", "beneficiary", "worker", "user", "applicant", "candidate"],
        "dob": ["dob", "birth", "birthdate", "date_of_birth", "birth_date", "date", "age"],
        "aadhaar": ["aadhaar", "aadhar", "uid", "unique", "national_id", "identity", "card_number", "id_number"],
        "address": ["address", "addr", "residence", "village", "city", "location", "full_address", "registered"],
        "gender": ["gender", "sex", "gender_type"]
    }
    
    # Track what fields have been assigned to detect remaining unassigned textareas
    assigned_fields = set()
    
    for f in fields_list:
        matched_field = None
        highest_score = 0.0
        
        field_type = (f.get("type") or "").lower()
        radio_option = (f.get("radio_option") or "").lower()
        
        # Special handling for radio buttons: always map to gender
        if field_type == "radio" or radio_option:
            matched_field = "gender"
            highest_score = 0.90
            mappings.append({
                "asha_id": f.get("asha_id"),
                "mapped_field": matched_field,
                "confidence": highest_score
            })
            assigned_fields.add("gender")
            continue
        
        # Check text fields
        id_str = (f.get("id") or "").lower()
        name_str = (f.get("name") or "").lower()
        placeholder_str = (f.get("placeholder") or "").lower()
        aria_label_str = (f.get("aria_label") or "").lower()
        label_text_str = (f.get("label_text") or "").lower()
        
        combined_text = f"{id_str} {name_str} {placeholder_str} {aria_label_str} {label_text_str}"
        
        for field, keywords in patterns.items():
            for kw in keywords:
                if kw in combined_text:
                    score = 0.5
                    if kw in label_text_str:
                        score = 0.90
                    elif kw in aria_label_str:
                        score = 0.85
                    elif kw in placeholder_str:
                        score = 0.75
                    elif kw in name_str:
                        score = 0.70
                        
                    if score > highest_score:
                        highest_score = score
                        matched_field = field
        
        # Heuristic: if this is a textarea with a generic/empty label and address hasn't been assigned yet,
        # it's very likely the address field (common in Google Forms)
        if not matched_field and field_type == "textarea" and "address" not in assigned_fields:
            generic_labels = ["", "your answer", "type your answer"]
            if label_text_str.strip() in generic_labels:
                matched_field = "address"
                highest_score = 0.70
                print(f"[Fallback] Textarea with generic label assigned to 'address': {f.get('asha_id')}")
        
        if matched_field:
            assigned_fields.add(matched_field)
                        
        mappings.append({
            "asha_id": f.get("asha_id"),
            "mapped_field": matched_field,
            "confidence": highest_score if matched_field else 0.0
        })
        
    return mappings

@app.post("/api/map-fields")
def map_page_fields(payload: MapFieldsRequestSchema):
    try:
        fields_list = [f.dict() for f in payload.fields]
        mappings = ai_map_fields(fields_list)
        return {"status": "success", "mappings": mappings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5c. Register Digitization OCR Endpoint
@app.post("/api/ocr-register")
async def perform_register_ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        extracted_data = extract_register_data(contents)
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5d. User Authentication Endpoints
class UserAuthSchema(BaseModel):
    username: str
    password: str

@app.post("/api/register")
def register_user(data: UserAuthSchema):
    try:
        success = add_user(data.username, data.password)
        if not success:
            raise HTTPException(status_code=400, detail="Username already exists")
        return {"status": "success", "message": "User registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
def login_user(data: UserAuthSchema):
    try:
        is_valid = authenticate_user(data.username, data.password)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        return {"status": "success", "username": data.username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Guideline RAG Search Endpoints
class RAGQuerySchema(BaseModel):
    query: str
    category: Optional[str] = None
    is_offline: Optional[bool] = False

@app.post("/api/rag-chat")
def query_guidelines(body: RAGQuerySchema):
    try:
        response = generate_rag_response(
            query=body.query,
            category=body.category,
            is_offline=body.is_offline
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 7. Offline Sync Sync Endpoint
class SyncPayload(BaseModel):
    beneficiaries: List[BeneficiaryCreateSchema]
    visits: List[VisitCreateSchema]

@app.post("/api/sync")
def sync_offline_records(payload: SyncPayload):
    synced_bens = 0
    synced_visits = 0
    
    # 1. Sync beneficiaries first
    for ben in payload.beneficiaries:
        try:
            add_beneficiary(
                name=ben.name,
                age=ben.age,
                phone=ben.phone,
                village=ben.village,
                pregnancy_status=ben.pregnancy_status,
                pregnancy_month=ben.pregnancy_month
            )
            synced_bens += 1
        except Exception as e:
            print(f"Sync error for beneficiary {ben.name}: {e}")
            
    # 2. Sync visits (which handles auto-alert registration and risk rules)
    for visit in payload.visits:
        try:
            create_visit(visit)
            synced_visits += 1
        except Exception as e:
            print(f"Sync error for visit {visit.name}: {e}")
            
    return {
        "status": "success",
        "synced_beneficiaries": synced_bens,
        "synced_visits": synced_visits
    }

# 8. User Auth Endpoints
class UserAuthSchema(BaseModel):
    username: str
    password: str

@app.post("/api/register")
def register_user(user: UserAuthSchema):
    success = add_user(user.username, user.password)
    if not success:
        raise HTTPException(status_code=400, detail="Username already exists.")
    return {"status": "success", "message": "User registered successfully."}

@app.post("/api/login")
def login_user(user: UserAuthSchema):
    authenticated = authenticate_user(user.username, user.password)
    if not authenticated:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {"status": "success", "message": "Login successful."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
