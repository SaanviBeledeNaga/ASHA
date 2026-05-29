# ASHA Copilot AI — PPT Diagrams & Visual References

> All diagrams below use **Mermaid** syntax fully compatible with **Typora**. Open this file in Typora to see all diagrams rendered live. To export for PowerPoint, use **Typora → File → Export → PDF/HTML** or right-click any diagram → **Copy as Image**.

---

## 1. System Architecture Diagram (Slide 6)

```mermaid
graph TB
    subgraph USER["👩‍⚕️ ASHA Worker Interface"]
        A["🎙️ Voice Input<br/>(Hindi / Telugu / English)"]
        B["📱 Web Application<br/>(HTML + CSS + JS)"]
    end

    subgraph AI["🧠 AI Processing Layer"]
        C["Speech-to-Text<br/>Gemini 2.5 Flash / Whisper"]
        D["NLP Clinical Extraction<br/>Gemini / GPT-4o-mini"]
        E["Regex Fallback Parser<br/>(Offline Mode)"]
    end

    subgraph BACKEND["⚙️ FastAPI Backend"]
        F["REST API Server<br/>/api/voice-visit<br/>/api/visits<br/>/api/alerts<br/>/api/rag-chat<br/>/api/sync"]
        G["Clinical Rules Engine<br/>BP Thresholds<br/>Danger Symptom Matching<br/>Age Risk Factors"]
        H["Scheme Matcher<br/>PMMVY / JSY / PMSMA<br/>Anganwadi / ICDS"]
    end

    subgraph DATA["🗄️ Data Layer"]
        I["SQLite Database<br/>Beneficiaries<br/>Visits<br/>Alerts<br/>Schemes<br/>Users"]
    end

    subgraph RAG["📚 RAG Pipeline"]
        J["Guideline Knowledge Base<br/>MoHFW / WHO / UNICEF<br/>Embedded Corpus"]
        K["Keyword Ranking +<br/>LLM Response Generation"]
    end

    subgraph DASH["📊 Supervisor Dashboard"]
        L["Next.js Dashboard<br/>KPI Cards<br/>Risk Charts<br/>Alert Management"]
    end

    A --> C
    C --> D
    D --> F
    E -.->|Offline Fallback| F
    B --> F
    F --> G
    F --> H
    G --> I
    H --> I
    F --> I
    F --> K
    J --> K
    K --> F
    I --> L
    G -->|High-Risk Alert| L

    style USER fill:#1a237e,stroke:#4FC3F7,color:#fff
    style AI fill:#004d40,stroke:#00BFA6,color:#fff
    style BACKEND fill:#263238,stroke:#78909C,color:#fff
    style DATA fill:#1b5e20,stroke:#66BB6A,color:#fff
    style RAG fill:#4a148c,stroke:#CE93D8,color:#fff
    style DASH fill:#b71c1c,stroke:#EF9A9A,color:#fff
```

---

## 2. User Journey / Workflow Diagram (Slide 8)

```mermaid
flowchart LR
    A["🔐 ASHA Worker<br/>Logs In"] --> B["🎙️ Records Visit<br/>via Voice"]
    B --> C["🧠 AI Extracts<br/>Medical Data"]
    C --> D["⚠️ Risk Engine<br/>Evaluates Danger Signs"]
    D --> E{"Risk Level?"}
    E -->|HIGH| F["🚨 Alert Pushed<br/>to Supervisor"]
    E -->|MEDIUM| G["📋 Monitor &<br/>Follow-Up Scheduled"]
    E -->|LOW| H["✅ Routine Care<br/>Continue IFA Tablets"]
    F --> I["💾 Visit Saved<br/>to Database"]
    G --> I
    H --> I
    I --> J["📊 Dashboard<br/>Updates Automatically"]
    J --> K["👨‍⚕️ Supervisor<br/>Reviews & Resolves"]

    style A fill:#1565c0,stroke:#42a5f5,color:#fff
    style B fill:#00695c,stroke:#4db6ac,color:#fff
    style C fill:#4527a0,stroke:#9575cd,color:#fff
    style D fill:#e65100,stroke:#ff9800,color:#fff
    style E fill:#37474f,stroke:#90a4ae,color:#fff
    style F fill:#c62828,stroke:#ef5350,color:#fff
    style G fill:#ef6c00,stroke:#ffa726,color:#fff
    style H fill:#2e7d32,stroke:#66bb6a,color:#fff
    style I fill:#283593,stroke:#5c6bc0,color:#fff
    style J fill:#00838f,stroke:#4dd0e1,color:#fff
    style K fill:#6a1b9a,stroke:#ab47bc,color:#fff
```

---

## 3. Voice Processing Pipeline (Slide 6 — Detail)

```mermaid
flowchart TD
    A["🎤 ASHA Worker Speaks<br/>'Lakshmi Devi, age 23, BP 145/95<br/>swelling hai aur headache...'"]
    
    A --> B{"API Key<br/>Available?"}
    B -->|Yes - Gemini| C["Gemini 2.5 Flash<br/>Audio Transcription"]
    B -->|Yes - OpenAI| D["OpenAI Whisper<br/>Audio Transcription"]
    B -->|No Key| E["Demo Fallback<br/>Preset Transcript"]
    
    C --> F["Raw Transcript Text"]
    D --> F
    E --> F
    
    F --> G{"LLM Key<br/>Available?"}
    G -->|Gemini| H["Gemini NLP Extraction<br/>(JSON response mode)"]
    G -->|OpenAI| I["GPT-4o-mini Extraction<br/>(JSON object mode)"]
    G -->|No Key| J["Regex Fallback Parser<br/>Hinglish/Teluglish/English"]
    
    H --> K["Structured Medical JSON"]
    I --> K
    J --> K
    
    K --> L["📋 Extracted Fields:<br/>Name: Lakshmi Devi<br/>Age: 23<br/>BP: 145/95<br/>Month: 7<br/>Symptoms: swelling, headache<br/>Weight: 58 kg"]

    style A fill:#1b5e20,stroke:#66bb6a,color:#fff
    style F fill:#01579b,stroke:#29b6f6,color:#fff
    style K fill:#4a148c,stroke:#ce93d8,color:#fff
    style L fill:#263238,stroke:#78909c,color:#fff
```

---

## 4. Clinical Rules Engine Logic (Slide 6 — Detail)

```mermaid
flowchart TD
    A["Patient Visit Data<br/>Age, BP, Symptoms, Pregnancy Month"]
    
    A --> B{"Systolic BP ≥ 140<br/>or Diastolic BP ≥ 90?"}
    B -->|Yes| C["🔴 HIGH RISK<br/>Severe Hypertension<br/>URGENT: Refer to PHC/CHC"]
    B -->|No| D{"Systolic BP ≥ 130<br/>or Diastolic BP ≥ 85?"}
    D -->|Yes| E["🟡 MEDIUM RISK<br/>Mild Hypertension<br/>Monitor BP daily"]
    D -->|No| F["Check Symptoms"]
    
    F --> G{"Has High-Risk Symptoms?<br/>Bleeding, Severe Headache,<br/>Blurred Vision, Convulsions,<br/>Breathing Difficulty,<br/>Severe Abdominal Pain"}
    G -->|Yes| H["🔴 HIGH RISK<br/>Emergency Symptom Detected<br/>Immediate Referral Required"]
    G -->|No| I{"Has Medium-Risk Symptoms?<br/>Swelling, Fever,<br/>Decreased Fetal Movement,<br/>Dizziness"}
    I -->|Yes| J["🟡 MEDIUM RISK<br/>Monitoring Required"]
    I -->|No| K["Check Age Factors"]
    
    K --> L{"Pregnant & Age > 35<br/>or Age < 18?"}
    L -->|Yes| M["🟡 MEDIUM RISK<br/>Advanced Maternal Age /<br/>Teenage Pregnancy"]
    L -->|No| N["🟢 LOW RISK<br/>Continue IFA Tablets<br/>Balanced Diet<br/>Schedule Next ANC Visit"]

    style C fill:#c62828,stroke:#ef5350,color:#fff
    style H fill:#c62828,stroke:#ef5350,color:#fff
    style E fill:#e65100,stroke:#ff9800,color:#fff
    style J fill:#e65100,stroke:#ff9800,color:#fff
    style M fill:#e65100,stroke:#ff9800,color:#fff
    style N fill:#2e7d32,stroke:#66bb6a,color:#fff
```

---

## 5. RAG Guideline Assistant Pipeline (Slide 6 — Detail)

```mermaid
flowchart LR
    A["👩‍⚕️ ASHA Worker Query<br/>'What to do for fever<br/>after vaccination?'"]
    
    A --> B["🔍 Keyword-Based<br/>Guideline Search"]
    B --> C["📚 Embedded Knowledge Base<br/>6 Official Guideline Topics"]
    C --> D["🏆 Ranked Matches<br/>(Score-based sorting)"]
    D --> E["Top 2 Guideline<br/>Contexts Selected"]
    
    E --> F{"LLM Available?"}
    F -->|Gemini| G["Gemini 2.5 Flash<br/>Generates Answer<br/>Grounded in Guidelines"]
    F -->|OpenAI| H["GPT-4o-mini<br/>Generates Answer<br/>Grounded in Guidelines"]
    F -->|No Key| I["Direct Guideline<br/>Text Response<br/>(Template Fallback)"]
    
    G --> J["💬 Response to Worker<br/>+ Source Citations"]
    H --> J
    I --> J

    style A fill:#1565c0,stroke:#42a5f5,color:#fff
    style C fill:#4a148c,stroke:#ce93d8,color:#fff
    style E fill:#00695c,stroke:#4db6ac,color:#fff
    style J fill:#263238,stroke:#78909c,color:#fff
```

---

## 6. Database Schema Diagram (Slide 7 — Technical Reference)

```mermaid
erDiagram
    BENEFICIARIES {
        int id PK
        string name
        int age
        string phone
        string village
        boolean pregnancy_status
        int pregnancy_month
        string risk_status
        string registered_date
    }
    
    VISITS {
        int id PK
        int beneficiary_id FK
        string visit_date
        int systolic_bp
        int diastolic_bp
        float weight
        json symptoms
        string notes
        json recommendations
        json schemes_eligible
    }
    
    ALERTS {
        int id PK
        int beneficiary_id FK
        string alert_type
        string message
        boolean is_resolved
        string created_at
    }
    
    SCHEMES {
        int id PK
        string name
        string criteria
        string benefits
        string department
    }
    
    USERS {
        int id PK
        string username
        string password
    }

    BENEFICIARIES ||--o{ VISITS : "has many"
    BENEFICIARIES ||--o{ ALERTS : "triggers"
```

---

## 7. Offline Sync Architecture (Slide 6 — Detail)

```mermaid
sequenceDiagram
    participant ASHA as 👩‍⚕️ ASHA Worker
    participant APP as 📱 Web App
    participant LOCAL as 💾 Local SQLite Cache
    participant API as ⚙️ FastAPI Server
    participant DB as 🗄️ SQLite Database

    Note over ASHA,DB: 🟢 ONLINE MODE
    ASHA->>APP: Records visit via voice
    APP->>API: POST /api/voice-visit
    API->>DB: Save visit + run rules engine
    DB-->>API: Visit ID + Risk Level
    API-->>APP: Structured response
    APP-->>ASHA: Display results + risk badge

    Note over ASHA,DB: 🔴 OFFLINE MODE
    ASHA->>APP: Records visit via voice
    APP->>LOCAL: Store in offline queue
    LOCAL-->>APP: Queued for sync
    APP-->>ASHA: "Saved offline — will sync later"

    Note over ASHA,DB: 🔄 SYNC WHEN ONLINE
    APP->>API: POST /api/sync (batch payload)
    API->>DB: Process all queued beneficiaries + visits
    DB-->>API: Sync results (counts)
    API-->>APP: "Synced: 3 beneficiaries, 5 visits"
    APP-->>ASHA: Sync complete notification
```

---

## 8. Government Scheme Matching Logic (Slide 5 — Feature Detail)

```mermaid
flowchart TD
    A["Beneficiary Profile"]
    A --> B{"Is Pregnant?"}
    
    B -->|Yes| C["✅ PM Matru Vandana Yojana<br/>(PMMVY) — ₹5,000 cash"]
    B -->|Yes| D["✅ Janani Suraksha Yojana<br/>(JSY) — Delivery incentive"]
    B -->|Yes| E{"Pregnancy Month ≥ 4?"}
    E -->|Yes| F["✅ PMSMA<br/>Free ANC on 9th of every month"]
    E -->|No| G["⏳ Not yet eligible for PMSMA"]
    B -->|Yes| H["✅ Anganwadi Nutrition Support<br/>THR + Hot cooked meals"]
    
    B -->|No / Postpartum| I["✅ ICDS Immunization<br/>BCG, OPV, DPT, Measles, Hep-B"]
    B -->|No / Postpartum| J["✅ Anganwadi Nutrition<br/>For child under 6 years"]

    style C fill:#1b5e20,stroke:#66bb6a,color:#fff
    style D fill:#1b5e20,stroke:#66bb6a,color:#fff
    style F fill:#1b5e20,stroke:#66bb6a,color:#fff
    style H fill:#1b5e20,stroke:#66bb6a,color:#fff
    style I fill:#00695c,stroke:#4db6ac,color:#fff
    style J fill:#00695c,stroke:#4db6ac,color:#fff
    style G fill:#37474f,stroke:#90a4ae,color:#fff
```

---

## 9. Supervisor Dashboard KPI Layout (Slide 11 — Reference)

```mermaid
graph LR
    subgraph KPI1["Total Registered"]
        A1["5"]
        A2["Pregnant/Postpartum mothers"]
    end

    subgraph KPI2["High-Risk Cases"]
        B1["2"]
        B2["Immediate medical focus"]
    end

    subgraph KPI3["Active Alerts"]
        C1["3"]
        C2["Awaiting resolution"]
    end

    subgraph KPI4["Visits Tracked"]
        D1["3"]
        D2["This month's logs"]
    end

    KPI1 --- KPI2 --- KPI3 --- KPI4

    style KPI1 fill:#1565c0,stroke:#42a5f5,color:#fff
    style KPI2 fill:#c62828,stroke:#ef5350,color:#fff
    style KPI3 fill:#e65100,stroke:#ff9800,color:#fff
    style KPI4 fill:#2e7d32,stroke:#66bb6a,color:#fff
```

---

## 10. Technology Stack Visual (Slide 7 — Alternative)

```mermaid
graph TB
    ROOT(("ASHA Copilot<br/>Tech Stack"))

    ROOT --> FE["Frontend"]
    ROOT --> BE["Backend"]
    ROOT --> AINLP["AI & NLP"]
    ROOT --> DB["Database"]
    ROOT --> RAGP["RAG Pipeline"]
    ROOT --> CE["Clinical Engine"]

    FE --> FE1["HTML5 + CSS3 + JS"]
    FE --> FE2["Next.js Dashboard"]
    FE --> FE3["Dark Theme UI"]
    FE --> FE4["Responsive Design"]

    BE --> BE1["FastAPI Python"]
    BE --> BE2["REST APIs"]
    BE --> BE3["Pydantic Validation"]
    BE --> BE4["CORS Middleware"]
    BE --> BE5["Uvicorn ASGI"]

    AINLP --> AI1["Gemini 2.5 Flash"]
    AINLP --> AI2["OpenAI Whisper"]
    AINLP --> AI3["GPT-4o-mini"]
    AINLP --> AI4["Regex Fallback"]

    DB --> DB1["SQLite Primary"]
    DB --> DB2["SQLite Offline Cache"]
    DB --> DB3["JSON Storage"]

    RAGP --> R1["Keyword Ranking"]
    RAGP --> R2["Guideline Corpus"]
    RAGP --> R3["LLM Generation"]
    RAGP --> R4["Source Citations"]

    CE --> CE1["BP Thresholds"]
    CE --> CE2["Symptom Matching"]
    CE --> CE3["Age Risk Factors"]
    CE --> CE4["Scheme Eligibility"]

    style ROOT fill:#0d47a1,stroke:#42a5f5,color:#fff
    style FE fill:#1565c0,stroke:#42a5f5,color:#fff
    style BE fill:#00695c,stroke:#4db6ac,color:#fff
    style AINLP fill:#4527a0,stroke:#9575cd,color:#fff
    style DB fill:#1b5e20,stroke:#66bb6a,color:#fff
    style RAGP fill:#6a1b9a,stroke:#ab47bc,color:#fff
    style CE fill:#e65100,stroke:#ff9800,color:#fff
```

---

## 11. Feature Comparison Matrix (Slide 3 — Enhancement)

```mermaid
graph TB
    subgraph BUILT["Implemented Features - High Impact"]
        V["Voice Recording"]
        R["Risk Detection"]
        M["Multilingual NLP"]
        RAG["RAG Assistant"]
        OS["Offline Sync"]
        D["Supervisor Dashboard"]
        SM["Scheme Matching"]
    end

    subgraph FUTURE["Future Scope - Scalable"]
        W["Wearable Integration"]
        T["Telemedicine"]
        P["Predictive ML"]
    end

    V -->|Voice-to-text| R
    R -->|Alerts| D
    M -->|Hindi/Telugu/English| V
    RAG -->|Guideline queries| D
    OS -->|Batch sync| D
    SM -->|PMMVY/JSY| D

    W -.->|Phase 2| R
    T -.->|Phase 2| D
    P -.->|Phase 2| R

    style BUILT fill:#1b5e20,stroke:#66bb6a,color:#fff
    style FUTURE fill:#37474f,stroke:#90a4ae,color:#fff
    style V fill:#1565c0,stroke:#42a5f5,color:#fff
    style R fill:#c62828,stroke:#ef5350,color:#fff
    style M fill:#00695c,stroke:#4db6ac,color:#fff
    style RAG fill:#6a1b9a,stroke:#ab47bc,color:#fff
    style OS fill:#e65100,stroke:#ff9800,color:#fff
    style D fill:#0d47a1,stroke:#42a5f5,color:#fff
    style SM fill:#2e7d32,stroke:#66bb6a,color:#fff
```

---

> **How to use these diagrams in Typora:**
> 1. Open this file in **Typora** — all diagrams render automatically
> 2. To copy a diagram as image: **Right-click the diagram → Copy as Image**
> 3. To export all diagrams: **File → Export → PDF** or **File → Export → HTML**
> 4. For PowerPoint: Export as HTML, then screenshot individual diagrams, or use **Copy as Image** for each
> 5. For higher quality: Paste the Mermaid code at [mermaid.live](https://mermaid.live) and export as SVG

