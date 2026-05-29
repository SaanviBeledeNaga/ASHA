import os
import shutil
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

# 6. Guideline RAG Search Endpoints
class RAGQuerySchema(BaseModel):
    query: str

@app.post("/api/rag-chat")
def query_guidelines(body: RAGQuerySchema):
    try:
        response = generate_rag_response(body.query)
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
