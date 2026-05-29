import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = "asha_copilot.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Beneficiaries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS beneficiaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        phone TEXT,
        village TEXT NOT NULL,
        pregnancy_status BOOLEAN NOT NULL,
        pregnancy_month INTEGER,
        risk_status TEXT DEFAULT 'low',
        registered_date TEXT NOT NULL
    )
    """)
    
    # 2. Visits table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beneficiary_id INTEGER NOT NULL,
        visit_date TEXT NOT NULL,
        systolic_bp INTEGER NOT NULL,
        diastolic_bp INTEGER NOT NULL,
        weight REAL NOT NULL,
        symptoms TEXT NOT NULL, -- JSON array string
        notes TEXT,
        recommendations TEXT, -- JSON array string
        schemes_eligible TEXT, -- JSON array string
        FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE
    )
    """)
    
    # 3. Alerts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beneficiary_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries (id) ON DELETE CASCADE
    )
    """)
    
    # 4. Schemes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schemes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        criteria TEXT NOT NULL,
        benefits TEXT NOT NULL,
        department TEXT NOT NULL
    )
    """)
    
    # 5. Users table for authentication
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)
    
    # Pre-populate schemes if empty
    cursor.execute("SELECT COUNT(*) as count FROM schemes")
    if cursor.fetchone()["count"] == 0:
        initial_schemes = [
            (
                "PM Matru Vandana Yojana (PMMVY)",
                "Pregnant women (for the first and second child, with conditions)",
                "Cash incentives of ₹5,000 in direct benefit transfer for health and nutrition support.",
                "Ministry of Women and Child Development"
            ),
            (
                "Janani Suraksha Yojana (JSY)",
                "Pregnant women from low-income households (priority in rural areas)",
                "Direct cash assistance (₹1,400 for rural, ₹700 for urban) for institutional delivery.",
                "Ministry of Health and Family Welfare"
            ),
            (
                "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
                "Pregnant women in 2nd or 3rd trimester (4th to 9th month)",
                "Free, comprehensive antenatal check-ups and diagnostic services on the 9th of every month at government health centers.",
                "Ministry of Health and Family Welfare"
            ),
            (
                "Anganwadi Nutrition Support (Supplementary Nutrition)",
                "Pregnant women, lactating mothers, and children under 6 years",
                "Take-Home Rations (THR) and hot cooked meals at local Anganwadi centers to combat malnutrition.",
                "Ministry of Women and Child Development"
            ),
            (
                "Integrated Child Development Services (ICDS) Immunization",
                "Infants and children under 6 years",
                "Free essential vaccinations (BCG, OPV, DPT, Measles, Hepatitis B) and growth monitoring services.",
                "Ministry of Women and Child Development"
            )
        ]
        cursor.executemany("INSERT INTO schemes (name, criteria, benefits, department) VALUES (?, ?, ?, ?)", initial_schemes)
        
    # Pre-populate some dummy beneficiaries for dashboard visual experience
    cursor.execute("SELECT COUNT(*) as count FROM beneficiaries")
    if cursor.fetchone()["count"] == 0:
        dummy_beneficiaries = [
            ("Lakshmi Devi", 23, "9876543210", "Kothapalli", 1, 7, "high", "2026-04-10"),
            ("Priya Sharma", 26, "8765432109", "Cherukupalli", 1, 5, "low", "2026-05-02"),
            ("Anitha Rao", 29, "7654321098", "Kothapalli", 1, 8, "medium", "2026-03-15"),
            ("Sunitha V.", 21, "6543210987", "Ramapuram", 0, None, "low", "2026-05-10"),
            ("Ganga Ma", 31, "8901234567", "Cherukupalli", 1, 9, "high", "2026-02-28")
        ]
        cursor.executemany("INSERT INTO beneficiaries (name, age, phone, village, pregnancy_status, pregnancy_month, risk_status, registered_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", dummy_beneficiaries)
        
        # Add a couple of initial alerts
        dummy_alerts = [
            (1, "high_risk", "Lakshmi Devi has critical BP reading of 145/95 mmHg. Requires immediate clinical referral.", 0, "2026-05-27 10:00:00"),
            (3, "checkup", "Anitha Rao is in her 8th month. PMSMA clinic appointment due on the 9th.", 0, "2026-05-27 11:30:00"),
            (5, "high_risk", "Ganga Ma is in her 9th month and has reported severe swelling and headache.", 0, "2026-05-27 14:15:00")
        ]
        cursor.executemany("INSERT INTO alerts (beneficiary_id, alert_type, message, is_resolved, created_at) VALUES (?, ?, ?, ?, ?)", dummy_alerts)
        
        # Add basic dummy visits to match
        dummy_visits = [
            (1, "2026-05-27", 145, 95, 58.2, json.dumps(["swelling", "dizziness"]), "Visit conducted by ASHA. Patient reported swelling and mild dizziness.", json.dumps(["Refer to nearest Primary Health Centre", "Monitor BP daily", "Bed rest"]), json.dumps(["Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)", "PM Matru Vandana Yojana (PMMVY)"])),
            (2, "2026-05-15", 118, 76, 52.0, json.dumps([]), "Routine checkup. Mother doing well.", json.dumps(["Continue iron & folic acid tablets", "Nutritional diet"]), json.dumps(["PM Matru Vandana Yojana (PMMVY)", "Anganwadi Nutrition Support (Supplementary Nutrition)"])),
            (3, "2026-05-20", 132, 85, 61.5, json.dumps(["back pain"]), "Complained of lower back pain.", json.dumps(["Gentle prenatal exercise", "Calcium supplements"]), json.dumps(["Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)"]))
        ]
        cursor.executemany("INSERT INTO visits (beneficiary_id, visit_date, systolic_bp, diastolic_bp, weight, symptoms, notes, recommendations, schemes_eligible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", dummy_visits)

    # Pre-populate default user if empty
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", ("asha_worker", "password123"))

    conn.commit()
    conn.close()

# Helper DB Functions
def add_beneficiary(name: str, age: int, phone: Optional[str], village: str, pregnancy_status: bool, pregnancy_month: Optional[int]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    reg_date = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("""
    INSERT INTO beneficiaries (name, age, phone, village, pregnancy_status, pregnancy_month, risk_status, registered_date)
    VALUES (?, ?, ?, ?, ?, ?, 'low', ?)
    """, (name, age, phone, village, pregnancy_status, pregnancy_month, reg_date))
    beneficiary_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return beneficiary_id

def update_beneficiary_risk(beneficiary_id: int, risk_status: str, pregnancy_month: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if pregnancy_month is not None:
        cursor.execute("UPDATE beneficiaries SET risk_status = ?, pregnancy_month = ? WHERE id = ?", (risk_status, pregnancy_month, beneficiary_id))
    else:
        cursor.execute("UPDATE beneficiaries SET risk_status = ? WHERE id = ?", (risk_status, beneficiary_id))
    conn.commit()
    conn.close()

def get_beneficiary(beneficiary_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM beneficiaries WHERE id = ?", (beneficiary_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_all_beneficiaries() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM beneficiaries ORDER BY registered_date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_visit(beneficiary_id: int, visit_date: str, systolic_bp: int, diastolic_bp: int, weight: float, symptoms: List[str], notes: Optional[str], recommendations: List[str], schemes: List[str]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO visits (beneficiary_id, visit_date, systolic_bp, diastolic_bp, weight, symptoms, notes, recommendations, schemes_eligible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        beneficiary_id,
        visit_date,
        systolic_bp,
        diastolic_bp,
        weight,
        json.dumps(symptoms),
        notes,
        json.dumps(recommendations),
        json.dumps(schemes)
    ))
    visit_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return visit_id

def get_beneficiary_visits(beneficiary_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM visits WHERE beneficiary_id = ? ORDER BY visit_date DESC", (beneficiary_id,))
    rows = cursor.fetchall()
    conn.close()
    
    res = []
    for row in rows:
        d = dict(row)
        d["symptoms"] = json.loads(d["symptoms"])
        d["recommendations"] = json.loads(d["recommendations"])
        d["schemes_eligible"] = json.loads(d["schemes_eligible"])
        res.append(d)
    return res

def add_alert(beneficiary_id: int, alert_type: str, message: str) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO alerts (beneficiary_id, alert_type, message, is_resolved, created_at)
    VALUES (?, ?, ?, 0, ?)
    """, (beneficiary_id, alert_type, message, created_at))
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id

def resolve_alert(alert_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET is_resolved = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()

def get_active_alerts() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT a.*, b.name as beneficiary_name 
    FROM alerts a
    JOIN beneficiaries b ON a.beneficiary_id = b.id
    WHERE a.is_resolved = 0
    ORDER BY a.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_schemes() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schemes")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_user(username: str, password: str) -> bool:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username.strip(), password))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def authenticate_user(username: str, password: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username.strip(), password))
    user = cursor.fetchone()
    conn.close()
    return user is not None
