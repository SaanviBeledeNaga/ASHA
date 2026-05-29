from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Beneficiary Schema
class BeneficiaryBase(BaseModel):
    name: str = Field(..., example="Lakshmi Devi")
    age: int = Field(..., example=24)
    phone: Optional[str] = Field(None, example="9876543210")
    village: str = Field(..., example="Kothapalli")
    pregnancy_status: bool = Field(True, description="True if pregnant, False if postpartum or child focus")
    pregnancy_month: Optional[int] = Field(None, example=7, description="Pregnancy month if pregnant (1-9)")

class BeneficiaryCreate(BeneficiaryBase):
    pass

class BeneficiaryResponse(BeneficiaryBase):
    id: int
    risk_status: str = Field("low", description="low, medium, high")
    registered_date: str
    
    class Config:
        from_attributes = True

# Visit Schema
class VisitCreate(BaseModel):
    beneficiary_id: int
    visit_date: str = Field(..., example="2026-05-27")
    systolic_bp: int = Field(..., example=120)
    diastolic_bp: int = Field(..., example=80)
    weight: float = Field(..., example=55.5)
    symptoms: List[str] = Field(default_factory=list, example=["dizziness", "swelling"])
    notes: Optional[str] = Field(None, example="Complained of mild swelling in feet. Recommended hydration and rest.")

class VisitResponse(VisitCreate):
    id: int
    recommendations: List[str] = Field(default_factory=list)
    schemes_eligible: List[str] = Field(default_factory=list)
    
    class Config:
        from_attributes = True

# Alert Schema
class AlertResponse(BaseModel):
    id: int
    beneficiary_id: int
    beneficiary_name: str
    alert_type: str = Field(..., description="high_risk, immunization, checkup")
    message: str
    is_resolved: bool
    created_at: str

    class Config:
        from_attributes = True

# Voice extraction schemas
class VoiceExtractResponse(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    pregnancy_month: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    weight: Optional[float] = None
    symptoms: List[str] = []
    notes: str
    raw_transcription: str

# RAG Guidance Schemas
class RAGQueryRequest(BaseModel):
    query: str = Field(..., example="fever after vaccine")

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[str]
