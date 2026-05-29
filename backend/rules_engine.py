from typing import List, Dict, Any

def evaluate_clinical_risk(age: int, systolic_bp: int, diastolic_bp: int, symptoms: List[str], pregnancy_month: int = None) -> Dict[str, Any]:
    """
    Evaluates clinical risk and returns a dictionary with:
    - risk_level: "low", "medium", or "high"
    - triggers: List of symptoms/vitals that caused this risk level
    - recommendations: Suggested clinical actions
    """
    risk_level = "low"
    triggers = []
    recommendations = []
    
    # Check Blood Pressure (Pre-eclampsia and hypertension checks)
    if systolic_bp >= 140 or diastolic_bp >= 90:
        risk_level = "high"
        triggers.append(f"Severe Hypertension (BP: {systolic_bp}/{diastolic_bp} mmHg)")
        recommendations.append("URGENT: Refer immediately to the nearest Primary Health Centre (PHC) / Community Health Centre (CHC).")
        recommendations.append("Check urine protein for signs of pre-eclampsia.")
    elif systolic_bp >= 130 or diastolic_bp >= 85:
        if risk_level != "high":
            risk_level = "medium"
        triggers.append(f"Mild Hypertension (BP: {systolic_bp}/{diastolic_bp} mmHg)")
        recommendations.append("Monitor blood pressure daily.")
        recommendations.append("Recommend rest, low-salt diet, and follow-up in 3 days.")
        
    # Check Symptoms
    high_risk_symptoms = {
        "bleeding": "Vaginal bleeding during pregnancy requires immediate emergency referral.",
        "severe headache": "Severe headache is a cardinal symptom of severe pre-eclampsia.",
        "blurred vision": "Blurred or double vision indicates central nervous system irritability (pre-eclampsia).",
        "breathing difficulty": "Breathing difficulty may indicate fluid build-up or heart conditions.",
        "convulsions": "Fits/convulsions are obstetric emergencies (eclampsia).",
        "severe abdominal pain": "Severe epigastric or abdominal pain may signal placental abruption or liver issues."
    }
    
    medium_risk_symptoms = {
        "swelling": "Significant swelling of hands/face requires BP monitoring.",
        "fever": "High fever indicates infection, which needs evaluation and paracetamol.",
        "decreased fetal movement": "Reduced movement requires clinical assessment.",
        "dizziness": "Dizziness could indicate severe anemia or low blood pressure."
    }
    
    for symptom in symptoms:
        s_lower = symptom.lower().strip()
        if s_lower in high_risk_symptoms:
            risk_level = "high"
            triggers.append(f"High-risk symptom: {symptom}")
            recommendations.append(f"URGENT: {high_risk_symptoms[s_lower]}")
        elif s_lower in medium_risk_symptoms:
            if risk_level != "high":
                risk_level = "medium"
            triggers.append(f"Symptom: {symptom}")
            recommendations.append(f"Monitor: {medium_risk_symptoms[s_lower]}")

    # Check Age / Obstetric factors
    if pregnancy_month is not None:
        if age > 35:
            if risk_level != "high":
                risk_level = "medium"
            triggers.append(f"Advanced Maternal Age ({age} years)")
            recommendations.append("Schedule more frequent antenatal checkups due to age.")
        elif age < 18:
            if risk_level != "high":
                risk_level = "medium"
            triggers.append(f"Teenage Pregnancy ({age} years)")
            recommendations.append("Provide nutritional counseling and monitor growth closely.")

    # General recommendations if low risk
    if risk_level == "low":
        recommendations.append("Continue daily Iron & Folic Acid (IFA) tablets.")
        recommendations.append("Encourage a balanced diet rich in calcium, iron, and protein.")
        recommendations.append("Schedule next routine antenatal care checkup.")
        
    return {
        "risk_level": risk_level,
        "triggers": triggers,
        "recommendations": recommendations
    }

def match_eligible_schemes(pregnancy_status: bool, pregnancy_month: int = None, age: int = None) -> List[str]:
    """
    Returns a list of scheme names the beneficiary is eligible for.
    """
    eligible_schemes = []
    
    if pregnancy_status:
        # PMMVY is for all pregnant women (for their first/second child)
        eligible_schemes.append("PM Matru Vandana Yojana (PMMVY)")
        
        # JSY is for institutional delivery for pregnant women
        eligible_schemes.append("Janani Suraksha Yojana (JSY)")
        
        # PMSMA check: 2nd or 3rd trimester (4th to 9th month)
        if pregnancy_month is not None and pregnancy_month >= 4:
            eligible_schemes.append("Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)")
            
        # Anganwadi nutrition support covers all pregnant mothers
        eligible_schemes.append("Anganwadi Nutrition Support (Supplementary Nutrition)")
    else:
        # If not pregnant, child immunization schemes and nutrition apply
        eligible_schemes.append("Integrated Child Development Services (ICDS) Immunization")
        eligible_schemes.append("Anganwadi Nutrition Support (Supplementary Nutrition)")
        
    return eligible_schemes
