"use client";

import React, { useState, useEffect, useRef } from "react";

// Types
interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  isList?: boolean;
  listItems?: string[];
}

interface Scheme {
  name: string;
  desc: string;
  benefit: string;
  eligibility: string;
  icon: string;
  tags: string[];
}

export default function Home() {
  // --- STATE ---
  const [currentStep, setCurrentStep] = useState<"splash" | "language" | "login" | "category" | "dashboard">("splash");
  const [currentView, setCurrentView] = useState<"chat" | "schemes" | "data" | "applications" | "notifications" | "history" | "settings" | "help">("chat");
  const [language, setLanguage] = useState<"hi" | "te" | "en">("hi");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Health & Medical Services");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Form State
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("सुषमा देवी");

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice Simulation State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micPulse, setMicPulse] = useState(false);

  // Scheme Search/Filter State
  const [schemeSearch, setSchemeSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  // OCR Upload State
  const [ocrStatus, setOcrStatus] = useState<"idle" | "uploading" | "scanning" | "success">("idle");
  const [ocrData, setOcrData] = useState({
    name: "",
    dob: "",
    gender: "",
    aadhaar: "",
    address: ""
  });

  // Reference elements
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    // Splash screen transition
    const timer = setTimeout(() => {
      setCurrentStep("language");
    }, 2500);

    // Load session persistence
    const savedLogin = localStorage.getItem("asha_logged_in");
    const savedLang = localStorage.getItem("asha_lang");
    if (savedLogin === "true") {
      setIsLoggedIn(true);
      setUserName(localStorage.getItem("asha_username") || "सुषमा देवी");
      if (savedLang) setLanguage(savedLang as any);
    }
    return () => clearTimeout(timer);
  }, []);

  // Set standard chat messages after language loads
  useEffect(() => {
    const defaultMessages: Record<string, Message[]> = {
      hi: [
        {
          id: "m1",
          sender: "bot",
          text: "नमस्ते सुषमा देवी! 👋 मैं आपका जनमित्र AI सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
          timestamp: "10:30 AM"
        },
        {
          id: "m2",
          sender: "user",
          text: "मुझे गर्भवती महिलाओं के लिए सरकारी योजनाओं के बारे में बताइए।",
          timestamp: "10:31 AM"
        },
        {
          id: "m3",
          sender: "bot",
          text: "ज़रूर! मैं आपको गर्भवती महिलाओं के लिए उपलब्ध प्रमुख सरकारी योजनाओं के बारे में जानकारी देता हूँ।\n\nकुछ प्रमुख योजनाएँ हैं:",
          timestamp: "10:32 AM",
          isList: true,
          listItems: [
            "प्रधानमंत्री मातृ वंदना योजना (PMMVY) - ₹5000 वित्तीय सहायता",
            "जननी सुरक्षा योजना (JSY) - सुरक्षित प्रसव हेतु नकद सहायता",
            "प्रधानमंत्री सुरक्षित मातृत्व अभियान (PMSMA) - मुफ़्त स्वास्थ्य जाँच",
            "आंगनवाड़ी पोषाहार सेवाएँ - पूरक पोषण आहार"
          ]
        }
      ],
      te: [
        {
          id: "m1",
          sender: "bot",
          text: "నమస్తే సుష్మా దేవి! 👋 నేను మీ జన్మిత్ర AI సహాయకుడిని. నేను మీకు ఎలా సహాయం చేయగలను?",
          timestamp: "10:30 AM"
        },
        {
          id: "m2",
          sender: "user",
          text: "గర్భిణీ స్త్రీల కోసం అందుబాటులో ఉన్న ప్రభుత్వ పథకాల గురించి చెప్పండి.",
          timestamp: "10:31 AM"
        },
        {
          id: "m3",
          sender: "bot",
          text: "తప్పకుండా! గర్భిణీ స్త్రీల కోసం అందుబాటులో ఉన్న కొన్ని ప్రధాన ప్రభుత్వ పథకాల వివరాలు ఇక్కడ ఉన్నాయి:",
          timestamp: "10:32 AM",
          isList: true,
          listItems: [
            "ప్రధానమంత్రి మాతృ వందన యోజన (PMMVY) - ₹5000 నగదు బదిలీ సహాయం",
            "జనని సురక్ష యోజన (JSY) - ప్రభుత్వ ప్రసవాల కోసం సహాయం",
            "ప్రధానమంత్రి సురక్షిత మాతృత్వ అభియాన్ (PMSMA) - ఉచిత ఆరోగ్య పరీక్షలు",
            "అంగన్వాడీ పౌష్టికాహార సేవలు - గర్భిణీలకు అదనపు పోషణ సప్లిమెంట్స్"
          ]
        }
      ],
      en: [
        {
          id: "m1",
          sender: "bot",
          text: "Namaste Sushma Devi! 👋 I am your JanMitra AI Assistant. How can I assist you today?",
          timestamp: "10:30 AM"
        },
        {
          id: "m2",
          sender: "user",
          text: "Tell me about the government schemes available for pregnant women.",
          timestamp: "10:31 AM"
        },
        {
          id: "m3",
          sender: "bot",
          text: "Sure! Let me provide you with information on key government schemes available for maternal health and welfare.\n\nHere are the top schemes:",
          timestamp: "10:32 AM",
          isList: true,
          listItems: [
            "PM Matru Vandana Yojana (PMMVY) - ₹5000 maternity financial support",
            "Janani Suraksha Yojana (JSY) - Cash assistance for institutional delivery",
            "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA) - Free comprehensive checkups",
            "Anganwadi Nutrition Support - Supplementary nutrition support"
          ]
        }
      ]
    };
    setChatMessages(defaultMessages[language]);
  }, [language]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // --- LOCALIZED TRANSLATIONS ENGINE ---
  const translations = {
    hi: {
      appName: "जनमित्र AI",
      copilot: "COPILOT",
      subtitle: "आपका बहुभाषी सरकारी सहायता साथी",
      loading: "AI सेवाएँ शुरू हो रही हैं...",
      chooseLang: "अपनी पसंदीदा भाषा चुनें",
      continue: "आगे बढ़ें",
      welcomeBack: "आपका स्वागत है!",
      authSub: "अपने डिजिटल सहायक में सुरक्षित लॉगिन करें",
      phone: "फ़ोन नंबर",
      password: "पासवर्ड",
      rememberMe: "मुझे याद रखें",
      login: "लॉगिन करें",
      signup: "नया खाता बनाएँ",
      otpLogin: "OTP के साथ लॉगिन करें",
      formHelp: "फॉर्म भरने में मदद चाहिए?",
      secTitle: "अपनी सेवा श्रेणी चुनें",
      secSub: "उस विभाग का चयन करें जिसमें आपको सहायता की आवश्यकता है",
      onlineStatus: "ऑनलाइन",
      changeCat: "श्रेणी बदलें",
      inputPlaceholder: "पूछने के लिए टाइप करें...",
      micSubtext: "या बोलने के लिए माइक्रोफ़ोन दबाएँ",
      youCanAsk: "आप यह पूछ सकते हैं",
      secLabel: "श्रेणी",
      searchSchemes: "सरकारी योजनाएं खोजें...",
      allFilters: "सभी",
      ocrHeader: "आधार / पैन कार्ड सुरक्षित अपलोड",
      ocrSub: "कैमरा, गैलरी या ड्रैग एंड ड्रॉप द्वारा फ़ाइल अपलोड करें",
      analyzing: "दस्तावेज़ का विश्लेषण किया जा रहा है...",
      saveSecurely: "सुरक्षित सहेजें",
      encrypted: "एन्क्रिप्टेड डेटा संरक्षण",
      savedApps: "सेव किए गए आवेदन",
      notifications: "सूचनाएँ",
      settings: "सेटिंग्स",
      help: "सहायता और समर्थन",
      history: "आवाज़ इतिहास",
      aiAssistant: "AI सहायक (चैट)",
      findSchemes: "योजनाएँ जानें",
      enterData: "डेटा दर्ज करें",
      vaccineAlert: "टीकाकरण अनुस्मारक",
      schemeDeadline: "आवेदन की अंतिम तिथि",
      referralHospital: "नज़दीकी ब्लॉक अस्पताल",
      pensionUpdate: "वृद्धावस्था पेंशन अपडेट",
      searchPlaceholder: "योजना का नाम खोजें..."
    },
    te: {
      appName: "జన్మిత్ర AI",
      copilot: "COPILOT",
      subtitle: "మీ బహుభాషా ప్రభుత్వ సహాయక భాగస్వామి",
      loading: "AI సేవలు ప్రారంభమవుతున్నాయి...",
      chooseLang: "మీ ప్రాధాన్యత భాషను ఎంచుకోండి",
      continue: "కొనసాగించండి",
      welcomeBack: "స్వాగతం!",
      authSub: "మీ డిజిటల్ సహాయకుడికి సురక్షితంగా లాగిన్ అవ్వండి",
      phone: "ఫోన్ నంబర్",
      password: "పాస్ వర్డ్",
      rememberMe: "గుర్తుంచుకో",
      login: "లాగిన్ అవ్వండి",
      signup: "కొత్త ఖాతా సృష్టించండి",
      otpLogin: "OTP ద్వారా లాగిన్ అవ్వండి",
      formHelp: "ఫారమ్ నింపడంలో సహాయం కావాలా?",
      secTitle: "మీ సేవా విభాగాన్ని ఎంచుకోండి",
      secSub: "మీకు సహాయం అవసరమైన ప్రభుత్వ శాఖను ఎంచుకోండి",
      onlineStatus: "ఆన్‌లైన్",
      changeCat: "విభాగం మార్చండి",
      inputPlaceholder: "అడగడానికి టైప్ చేయండి...",
      micSubtext: "లేదా మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి",
      youCanAsk: "మీరు ఇలా అడగవచ్చు",
      secLabel: "విభాగం",
      searchSchemes: "ప్రభుత్వ పథకాలను శోధించండి...",
      allFilters: "అన్నీ",
      ocrHeader: "ఆధార్ / పాన్ కార్డ్ అప్‌లోడ్",
      ocrSub: "కెమెరా లేదా ఫైల్ అప్‌లోడ్ ద్వారా పత్రం పంపండి",
      analyzing: "పత్రాన్ని విశ్లేషిస్తోంది...",
      saveSecurely: "సురక్షితంగా సేవ్ చేయి",
      encrypted: "సురక్షిత ప్రభుత్వ నిల్వ",
      savedApps: "సేవ్ చేసిన దరఖాస్తులు",
      notifications: "నోటిఫికేషన్లు",
      settings: "సెట్టింగులు",
      help: "సహాయం & మద్దతు",
      history: "వాయిస్ చరిత్ర",
      aiAssistant: "AI సహాయకుడు (చాట్)",
      findSchemes: "పథకాల అన్వేషణ",
      enterData: "డేటా నమోదు",
      vaccineAlert: "టీకా రిమైండర్",
      schemeDeadline: "పథకం దరఖాస్తు గడువు",
      referralHospital: "సమీప ప్రభుత్వ ఆసుపత్రి",
      pensionUpdate: "పెన్షన్ సమాచారం",
      searchPlaceholder: "పథకం పేరును శోధించండి..."
    },
    en: {
      appName: "JanMitra AI",
      copilot: "COPILOT",
      subtitle: "Your Multilingual Government Assistance Companion",
      loading: "Initializing AI Services...",
      chooseLang: "Choose your preferred language",
      continue: "Continue",
      welcomeBack: "Welcome!",
      authSub: "Securely login to your AI Digital Companion",
      phone: "Phone Number",
      password: "Password",
      rememberMe: "Remember Me",
      login: "Login",
      signup: "Create Account",
      otpLogin: "Continue with OTP",
      formHelp: "Need help filling this form?",
      secTitle: "Select Your Service Category",
      secSub: "Choose the department you need help with",
      onlineStatus: "Online",
      changeCat: "Change Category",
      inputPlaceholder: "Type here to ask...",
      micSubtext: "or press microphone to speak",
      youCanAsk: "You Can Ask",
      secLabel: "Category",
      searchSchemes: "Search government schemes...",
      allFilters: "All",
      ocrHeader: "Secure Aadhaar / PAN Upload",
      ocrSub: "Upload file via Camera, Gallery, or Drag & Drop",
      analyzing: "Analyzing document...",
      saveSecurely: "Save Securely",
      encrypted: "Encrypted Government Storage Active",
      savedApps: "Saved Applications",
      notifications: "Notifications",
      settings: "Settings",
      help: "Help & Support",
      history: "Voice History",
      aiAssistant: "AI Assistant (Chat)",
      findSchemes: "Know Your Schemes",
      enterData: "Enter Your Data",
      vaccineAlert: "Immunization Reminder",
      schemeDeadline: "Scheme Registration Deadline",
      referralHospital: "Nearest Referral PHC",
      pensionUpdate: "Social Welfare Pension Update",
      searchPlaceholder: "Search schemes..."
    }
  };

  const t = translations[language];

  // --- DATA SOURCES ---
  const categoriesList = [
    { id: "A", name: "Health & Medical Services 🏥", labelHi: "स्वास्थ्य सेवाएँ 🏥", labelTe: "ఆరోగ్య సేవలు 🏥" },
    { id: "B", name: "Nutrition & Child Welfare 🍎", labelHi: "पोषण एवं बाल कल्याण 🍎", labelTe: "పోషణ & శిశు సంక్షేమం 🍎" },
    { id: "C", name: "Education & Youth Development 🎓", labelHi: "शिक्षा एवं युवा विकास 🎓", labelTe: "విద్య & యువజన అభివృద్ధి 🎓" },
    { id: "D", name: "Rural Development & Panchayat 🏡", labelHi: "ग्रामीण विकास एवं पंचायत 🏡", labelTe: "గ్రామీణ అభివృద్ధి & పంచాయతీ 🏡" },
    { id: "E", name: "Agriculture & Allied Activities 🌾", labelHi: "कृषि एवं संबद्ध गतिविधियाँ 🌾", labelTe: "వ్యవసాయం & అనుబంధ రంగాలు 🌾" },
    { id: "F", name: "Women Empowerment & Welfare 👩", labelHi: "महिला सशक्तिकरण एवं कल्याण 👩", labelTe: "మహిళా సాధికారత & సంక్షేమం 👩" },
    { id: "G", name: "Food & Public Distribution 🍚", labelHi: "खाद्य एवं सार्वजनिक वितरण 🍚", labelTe: "ఆహారం & ప్రజా పంపిణీ 🍚" },
    { id: "H", name: "Sanitation & Environmental Services ♻️", labelHi: "स्वच्छता एवं पर्यावरण सेवाएँ ♻️", labelTe: "పారిశుధ్యం & పర్యావరణ సేవలు ♻️" },
    { id: "I", name: "Disaster Management 🚨", labelHi: "आपदा प्रबंधन 🚨", labelTe: "విపత్తు నిర్వహణ 🚨" },
    { id: "J", name: "Digital & E-Governance 💻", labelHi: "डिजिटल एवं ई-गवर्नेंस 💻", labelTe: "డిజిటల్ & ఈ-గవర్నెన్స్ 💻" },
    { id: "K", name: "Urban Community Support 🏙️", labelHi: "शहरी सामुदायिक सहायता 🏙️", labelTe: "పట్టణ సమాజ మద్దతు 🏙️" },
    { id: "L", name: "Skill Development & Employment 🛠️", labelHi: "कौशल विकास एवं रोजगार 🛠️", labelTe: "నైపుణ్యాభివృద్ధి & ఉపాధి 🛠️" },
    { id: "M", name: "Transportation & Public Safety 🚌", labelHi: "परिवहन एवं सार्वजनिक सुरक्षा 🚌", labelTe: "రవాణా & ప్రజా రక్షణ 🚌" },
    { id: "N", name: "Tribal & Minority Welfare 🪶", labelHi: "जनजातीय एवं अल्पसंख्यक कल्याण 🪶", labelTe: "గిరిజన & మైనారిటీ సంక్షేమం 🪶" },
    { id: "O", name: "Election & Civic Administration 🗳️", labelHi: "चुनाव एवं नागरिक प्रशासन 🗳️", labelTe: "ఎన్నికలు & పౌర పరిపాలన 🗳️" },
    { id: "P", name: "Banking & Financial Inclusion 🏦", labelHi: "बैंकिंग एवं वित्तीय समावेशन 🏦", labelTe: "బ్యాంకింగ్ & ఆర్థిక భాగస్వామ్యం 🏦" }
  ];

  const getLocalizedCategoryName = (engName: string) => {
    const found = categoriesList.find(c => c.name === engName);
    if (!found) return engName;
    if (language === "hi") return found.labelHi;
    if (language === "te") return found.labelTe;
    return found.name;
  };

  const suggestionPills = [
    {
      hi: "आयुष्मान भारत योजना क्या है?",
      te: "ఆయుష్మాన్ భారత్ యోజన అంటే ఏమిటి?",
      en: "What is Ayushman Bharat Yojana?"
    },
    {
      hi: "नज़दीकी अस्पताल कौन सा है?",
      te: "సమీప ఆసుపత్రి ఎక్కడ ఉంది?",
      en: "Where is the nearest hospital?"
    },
    {
      hi: "टीकाकरण शेड्यूल क्या है?",
      te: "టీకా షెడ్యూల్ ఏమిటి?",
      en: "What is the vaccination schedule?"
    },
    {
      hi: "राशन कार्ड के लिए पात्रता क्या है?",
      te: "రేషన్ కార్డు అర్హతలు ఏమిటి?",
      en: "What are the eligibility rules for Ration Card?"
    }
  ];

  const governmentSchemes: Scheme[] = [
    {
      name: "PM Matru Vandana Yojana (PMMVY)",
      desc: "Financial support of ₹5000 provided in direct cash benefit transfers directly to pregnant women and lactating mothers for nutritional wellness.",
      benefit: "₹5,000 cash incentive in 3 installments",
      eligibility: "Pregnant women and lactating mothers for their first child.",
      icon: "🤰",
      tags: ["Pregnancy", "Women", "Health"]
    },
    {
      name: "Janani Suraksha Yojana (JSY)",
      desc: "Maternal safe delivery promotion scheme reducing maternal and neonatal mortality by promoting institutional deliveries under public healthcare institutions.",
      benefit: "Cash assistance of ₹1,400 (Rural) and ₹700 (Urban) directly to mother.",
      eligibility: "Low-income pregnant women prioritizing rural areas.",
      icon: "🏥",
      tags: ["Pregnancy", "Health", "Rural"]
    },
    {
      name: "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
      desc: "Free diagnostic and standard health checkups provided by doctors on the 9th of every month at Government medical institutions to identify high-risk cases.",
      benefit: "Free medical diagnostics, OB-GYN consultations, and nutritional therapy guidelines.",
      eligibility: "Pregnant women in their 2nd and 3rd trimesters.",
      icon: "👩‍⚕️",
      tags: ["Pregnancy", "Health"]
    },
    {
      name: "Lado Protsahan Scheme",
      desc: "Comprehensive girl child welfare assurance scheme designed to sponsor standard higher education and secure social empowerment for girl children.",
      benefit: "₹2,00,000 savings bond directly upon institutional birth.",
      eligibility: "Girl children born in low-income registered families.",
      icon: "👧",
      tags: ["Women", "Students"]
    },
    {
      name: "PM Kisan Samman Nidhi",
      desc: "Direct income assurance support schema providing minimal budget backing to all agricultural landholder households to procure input seeds and fertilizers.",
      benefit: "₹6,000 yearly credit delivered in three equal ₹2,000 installments.",
      eligibility: "All small and marginal landholder farmer families.",
      icon: "🌾",
      tags: ["Farmers", "Rural"]
    },
    {
      name: "Post-Matric Scholarship Scheme",
      desc: "Financial assistance program helping children from underrepresented communities complete high-level higher education degrees without financial burden.",
      benefit: "100% academic fee waiver and monthly stipend up to ₹1,200.",
      eligibility: "Students from scheduled castes or backward classes with income < ₹2.5LPA.",
      icon: "🎓",
      tags: ["Students", "Education"]
    }
  ];

  // --- ACTIONS & HANDLERS ---
  const handleLanguageSelect = (lang: "hi" | "te" | "en") => {
    setLanguage(lang);
    localStorage.setItem("asha_lang", lang);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    // Simulate persistent local storage login
    const parsedName = phone.includes("9876") ? "सुषमा देवी" : "ASHA Worker";
    setUserName(parsedName);
    setIsLoggedIn(true);
    localStorage.setItem("asha_logged_in", "true");
    localStorage.setItem("asha_username", parsedName);
    
    setCurrentStep("category");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("asha_logged_in");
    setCurrentStep("login");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    const userMsg: Message = {
      id: "u-" + Date.now(),
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI response based on standard Indian healthcare guidelines
    setTimeout(() => {
      let botResponse = "मुझे आपकी बात समझ आ गई है। मैं डेटाबेस में संबंधित जानकारी ढूंढ रहा हूँ...";
      if (language === "te") botResponse = "నేను మీ ప్రశ్నను విశ్లేషిస్తున్నాను. సంబంధిత సమాచారం కోసం వెతుకుతున్నాను...";
      if (language === "en") botResponse = "I have received your query. Searching government databases for matching schemes or clinical guidelines...";

      const textLower = userMsg.text.toLowerCase();
      if (textLower.includes("pregnant") || textLower.includes("गर्भवती") || textLower.includes("గర్భిణీ")) {
        if (language === "hi") {
          botResponse = "गर्भवती महिलाओं के लिए प्रमुख कल्याणकारी योजनाओं में **प्रधानमंत्री मातृ वंदना योजना (PMMVY)** शामिल है, जिसके तहत **₹5,000** की सहायता प्रदान की जाती है। सुरक्षित प्रसव के लिए **जननी सुरक्षा योजना (JSY)** और मासिक जाँच के लिए **PMSMA** उपलब्ध है।";
        } else if (language === "te") {
          botResponse = "గర్భిణీ స్త్రీల సంక్షేమం కొరకు **ప్రధానమంత్రి మాతృ వందన యోజన (PMMVY)** ద్వారా **₹5,000** ఆర్థిక సాయం లభిస్తుంది. సురక్షిత ప్రసవం కోసం **జనని సురక్ష యోజన (JSY)** ఉపయోగపడుతుంది.";
        } else {
          botResponse = "For pregnant women, the **PM Matru Vandana Yojana (PMMVY)** provides **₹5,000** in cash transfers. The **Janani Suraksha Yojana (JSY)** gives cash support for deliveries, and **PMSMA** offers free medical diagnostics on the 9th of every month.";
        }
      } else if (textLower.includes("hospital") || textLower.includes("अस्पताल") || textLower.includes("ఆసుపత్రి")) {
        if (language === "hi") {
          botResponse = "आपके गाँव से सबसे नज़दीकी **प्राथमिक स्वास्थ्य केंद्र (PHC) गोपालपुरम** में स्थित है, जो 4 किमी दूरी पर है। आपातकालीन सहायता के लिए आप **102 / 108** डायल कर सकती हैं।";
        } else if (language === "te") {
          botResponse = "మీ గ్రామానికి అత్యంత సమీపంలో ఉన్న **ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) గోపాలపురం** లో ఉంది (4 కి.మీ దూరంలో). అత్యవసర అంబులెన్స్ కోసం **102 / 108** కి కాల్ చేయండి.";
        } else {
          botResponse = "The nearest **Primary Health Centre (PHC)** to your registered location is in **Gopalapuram** (4 km away). For free emergency transport, dial **102 / 108** government ambulance services.";
        }
      }

      const botMsg: Message = {
        id: "b-" + Date.now(),
        sender: "bot",
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  // Simulate Mic speaking/listening
  const handleMicClick = () => {
    if (isSpeaking) {
      setIsSpeaking(false);
      setMicPulse(false);
      return;
    }

    setIsSpeaking(true);
    setMicPulse(true);

    // After 3 seconds, generate a voice simulated message
    setTimeout(() => {
      let voiceText = "क्या लक्ष्मी देवी को टीकाकरण के बाद बुखार आना सामान्य है?";
      if (language === "te") voiceText = "లక్ష్మి దేవికి టీకా వేసిన తర్వాత జ్వరం రావడం సాధారణమేనా?";
      if (language === "en") voiceText = "Is it normal for Lakshmi Devi to get a fever after her DPT vaccination?";

      const userVoiceMsg: Message = {
        id: "u-v-" + Date.now(),
        sender: "user",
        text: `🎤 [आवाज़ / Voice]: "${voiceText}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, userVoiceMsg]);
      setIsSpeaking(false);
      setMicPulse(false);
      setIsTyping(true);

      setTimeout(() => {
        let botVoiceResponse = "हाँ! पेंटावेलेंट या DPT टीकाकरण के बाद बच्चों में **हल्का बुखार आना सामान्य बात है**। यह दर्शाता है कि टीका ठीक से काम कर रहा है। बुखार कम करने के लिए डॉक्टर की सलाह के अनुसार पैरासिटामोल ड्रॉप्स (15mg/kg) दे सकती हैं। यदि बुखार 102.5°F से अधिक हो या 48 घंटे से ज़्यादा रहे, तो तुरंत PHC ले जाएँ।";
        if (language === "te") botVoiceResponse = "అవును! పెంటావాలెంట్ లేదా DPT టీకా తర్వాత శిశువులకు **తేలికపాటి జ్వరం రావడం సాధారణం**. దీని అర్థం టీకా చక్కగా పనిచేస్తోంది. శిశువు బరువు ప్రకారం పారాసిటమాల్ డ్రాప్స్ ఇవ్వవచ్చు. జ్వరం 102.5°F దాటినా, లేదా 48 గంటల కంటే ఎక్కువ సమయం ఉన్నా PHC వైద్యులను సంప్రదించండి.";
        if (language === "en") botVoiceResponse = "Yes! **Mild fever (up to 101°F) is a very common reaction** after DPT or Pentavalent vaccines. It shows the vaccine is working. Give Paracetamol drops based on weight (15mg/kg) every 4-6 hours if needed. If the fever exceeds 102.5°F or lasts > 48 hours, refer immediately to the PHC.";

        const botVoiceMsg: Message = {
          id: "b-v-" + Date.now(),
          sender: "bot",
          text: botVoiceResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => [...prev, botVoiceMsg]);
        setIsTyping(false);
      }, 1500);
    }, 3500);
  };

  // Click Suggestion Pills
  const handlePillClick = (text: string) => {
    setChatInput(text);
  };

  // Simulate high-tech Aadhaar OCR scanning
  const handleOcrSimulate = () => {
    setOcrStatus("uploading");
    setTimeout(() => {
      setOcrStatus("scanning");
      setTimeout(() => {
        setOcrStatus("success");
        setOcrData({
          name: "SUSHMA DEVI",
          dob: "12/04/1998",
          gender: "FEMALE",
          aadhaar: "XXXX-XXXX-8921",
          address: "GOPALAPURAM VILLAGE, WARD 3, ANDHRA PRADESH"
        });
      }, 2500);
    }, 1000);
  };

  // --- RENDERS ---

  return (
    <div className="flex-1 flex flex-col relative w-full h-full min-h-screen">
      
      {/* Background Floating Cyber Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="particle" style={{ left: "10%", width: "120px", height: "120px", animationDelay: "0s", animationDuration: "14s" }}></div>
        <div className="particle" style={{ left: "40%", width: "150px", height: "150px", animationDelay: "2s", animationDuration: "18s" }}></div>
        <div className="particle" style={{ left: "80%", width: "100px", height: "100px", animationDelay: "4s", animationDuration: "12s" }}></div>
      </div>

      {/* ========================================================
          1️⃣ SPLASH SCREEN (currentStep === "splash")
          ======================================================== */}
      {currentStep === "splash" && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-[#0F172A] z-50 p-6">
          <div className="w-40 h-40 rounded-full flex items-center justify-center pulse-orb relative bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-[0_0_50px_rgba(0,194,255,0.4)]">
            <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H14l1-6.109-8.982 11.795H9.813z" />
            </svg>
          </div>
          <h1 className="mt-8 text-4xl sm:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent glow-text-cyan font-heading">
            JanMitra AI Copilot
          </h1>
          <p className="mt-3 text-slate-400 text-lg sm:text-xl font-light tracking-wide text-center">
            Your Multilingual Government Assistance Companion
          </p>
          <div className="mt-16 w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-purple-500 w-1/3 rounded-full animate-[laserScan_1.5s_infinite_linear]"></div>
          </div>
          <span className="mt-4 text-xs tracking-widest text-slate-500 font-semibold uppercase animate-pulse">
            {t.loading}
          </span>
        </div>
      )}

      {/* ========================================================
          2️⃣ LANGUAGE SELECTION PAGE (currentStep === "language")
          ======================================================== */}
      {currentStep === "language" && (
        <div className="flex-1 flex items-center justify-center p-6 z-10">
          <div className="w-full max-w-lg glass-panel p-8 sm:p-10 rounded-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9yM3 9h18M3 15h18" />
              </svg>
            </div>
            
            <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-white text-center font-heading">
              JanMitra AI
            </h2>
            <p className="mt-2 text-slate-400 text-sm text-center">
              Choose your preferred language / अपनी पसंदीदा भाषा चुनें / మీ ప్రాధాన్యత భాషను ఎంచుకోండి
            </p>

            <div className="mt-8 w-full flex flex-col gap-4">
              <button 
                onClick={() => handleLanguageSelect("en")}
                className={`w-full py-4 px-6 rounded-xl font-medium border text-left flex items-center justify-between transition-all duration-300 accessible-focus ${
                  language === "en" 
                    ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,194,255,0.2)]" 
                    : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🇬🇧</span>
                  <span>English (Global)</span>
                </div>
                {language === "en" && <span className="text-cyan-400 font-bold">✔</span>}
              </button>

              <button 
                onClick={() => handleLanguageSelect("hi")}
                className={`w-full py-4 px-6 rounded-xl font-medium border text-left flex items-center justify-between transition-all duration-300 accessible-focus ${
                  language === "hi" 
                    ? "bg-purple-500/10 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(124,58,237,0.2)]" 
                    : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🇮🇳</span>
                  <span>हिंदी (Hindi)</span>
                </div>
                {language === "hi" && <span className="text-purple-400 font-bold">✔</span>}
              </button>

              <button 
                onClick={() => handleLanguageSelect("te")}
                className={`w-full py-4 px-6 rounded-xl font-medium border text-left flex items-center justify-between transition-all duration-300 accessible-focus ${
                  language === "te" 
                    ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,194,255,0.2)]" 
                    : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🇮🇳</span>
                  <span>తెలుగు (Telugu)</span>
                </div>
                {language === "te" && <span className="text-cyan-400 font-bold">✔</span>}
              </button>
            </div>

            <button 
              onClick={() => isLoggedIn ? setCurrentStep("category") : setCurrentStep("login")}
              className="mt-8 w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(0,194,255,0.25)] hover:shadow-[0_0_30px_rgba(0,194,255,0.4)] active:scale-95 duration-200 accessible-focus"
            >
              {t.continue} &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          3️⃣ LOGIN / SIGNUP PAGE (currentStep === "login")
          ======================================================== */}
      {currentStep === "login" && (
        <div className="flex-1 flex items-center justify-center p-6 z-10">
          <div className="w-full max-w-4xl glass-panel-heavy rounded-2xl overflow-hidden grid md:grid-cols-2 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            
            {/* Left Side: Modern Gov-Tech Cyber Illustration */}
            <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-r border-slate-800">
              <div>
                <span className="text-sm font-semibold tracking-wider text-cyan-400 uppercase font-heading">
                  🇮🇳 National e-Governance Portal
                </span>
                <h3 className="mt-3 text-3xl font-extrabold text-white leading-tight font-heading">
                  AI Assured Health & Social Empowerment
                </h3>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                  Interactive voice logs, optical document OCR scanners, and instant regional scheme matching designed for rural workers, ASHA companions, and farmers.
                </p>
              </div>

              {/* Glowing decorative dashboard preview mock */}
              <div className="w-full aspect-video rounded-xl bg-slate-900/60 p-4 border border-slate-700/50 shadow-inner flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-2/3 bg-slate-800 rounded-full"></div>
                  <div className="h-2 w-5/6 bg-slate-800 rounded-full"></div>
                  <div className="h-2 w-1/2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>✅ Encrypted Gateway</span>
                  <span>🔒 MeitY Approved</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active Server Node: PHC Gopalapuram</span>
              </div>
            </div>

            {/* Right Side: Glassmorphism Login Card */}
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white tracking-wide font-heading">
                {t.welcomeBack}
              </h3>
              <p className="mt-1.5 text-xs text-slate-400">
                {t.authSub}
              </p>

              <form onSubmit={handleLoginSubmit} className="mt-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 tracking-wider">
                    {t.phone} <span className="text-cyan-400">(Demo: 9876543210)</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit number"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 tracking-wider">
                    {t.password} <span className="text-cyan-400">(Demo: password)</span>
                  </label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-900" />
                    <span>{t.rememberMe}</span>
                  </label>
                  <button type="button" className="text-cyan-400 hover:underline">Forgot Password?</button>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(0,194,255,0.25)] hover:shadow-[0_0_30px_rgba(0,194,255,0.4)] active:scale-98 transition-all duration-200 accessible-focus"
                  >
                    {t.login}
                  </button>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-medium rounded-xl border border-slate-700/60 transition-all duration-200"
                  >
                    {t.otpLogin}
                  </button>
                </div>
              </form>

              {/* Voice Assistance Button */}
              <div className="mt-8 flex items-center justify-center">
                <button 
                  onClick={() => {
                    setPhone("9876543210");
                    setPassword("password");
                  }}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 text-xs font-semibold hover:bg-cyan-950/60 active:scale-95 transition-all shadow-[0_0_10px_rgba(0,194,255,0.08)] cursor-pointer"
                >
                  <svg className="w-4 h-4 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>{t.formHelp} (Auto Fill)</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          4️⃣ CATEGORY SELECTION PAGE (currentStep === "category")
          ======================================================== */}
      {currentStep === "category" && (
        <div className="flex-1 flex flex-col justify-center items-center p-6 z-10 max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mb-8">
            <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-heading">
              Step 3 of 4
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white font-heading">
              {t.secTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {t.secSub}
            </p>
          </div>

          <div className="w-full category-grid">
            {categoriesList.map((cat) => {
              const localizedName = language === "hi" ? cat.labelHi : language === "te" ? cat.labelTe : cat.name;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer accessible-focus ${
                    isSelected 
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,194,255,0.2)] scale-[1.03]" 
                      : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60 hover:-translate-y-1"
                  }`}
                >
                  <div className="text-2xl mb-3">{cat.name.split(" ").pop()}</div>
                  <h4 className="text-sm font-semibold tracking-wide leading-snug">
                    {localizedName.slice(0, -3)}
                  </h4>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-slate-900 text-xs font-extrabold">
                      ✔
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setCurrentStep("dashboard")}
            disabled={!selectedCategory}
            className="mt-10 px-10 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-xl tracking-wider transition-all shadow-[0_0_20px_rgba(0,194,255,0.2)] duration-200 accessible-focus"
          >
            {t.continue} &rarr;
          </button>
        </div>
      )}

      {/* ========================================================
          5️⃣ MAIN AI COPILOT DASHBOARD (currentStep === "dashboard")
          ======================================================== */}
      {currentStep === "dashboard" && (
        <div className="flex-1 flex flex-col md:flex-row relative z-10 w-full min-h-screen">
          
          {/* --------------------------------------------------------
              LEFT SIDEBAR
              -------------------------------------------------------- */}
          <aside className="w-full md:w-[280px] bg-[#111827]/85 border-b md:border-r border-slate-800/60 backdrop-blur-xl flex flex-col justify-between shrink-0 p-4 md:p-5 z-20">
            
            <div className="space-y-6">
              {/* App Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,194,255,0.3)]">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-wider text-white font-heading leading-tight uppercase">
                    {t.appName.split(" ")[0]} <span className="text-cyan-400">{t.appName.split(" ")[1] || "AI"}</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase leading-none">
                    {t.copilot}
                  </span>
                </div>
              </div>

              {/* Profile Card Info Panel */}
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-base">
                    👩
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs text-slate-400 tracking-wider">Welcome!</h4>
                  <p className="text-sm font-bold text-white truncate font-heading">{userName}</p>
                </div>
              </div>

              {/* Active Category Selector Drawer Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block pl-1">
                  {t.secLabel}
                </label>
                <button 
                  onClick={() => setCurrentStep("category")}
                  className="w-full p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/60 transition-all text-xs text-left text-cyan-300 flex items-center justify-between"
                >
                  <span className="truncate">{getLocalizedCategoryName(selectedCategory)}</span>
                  <span className="text-slate-500 font-bold">&rarr;</span>
                </button>
              </div>

              {/* Menu Navigation Items */}
              <nav className="space-y-1">
                {[
                  { id: "chat", label: t.aiAssistant, icon: "💬" },
                  { id: "schemes", label: t.findSchemes, icon: "🎁" },
                  { id: "data", label: t.enterData, icon: "💳" },
                  { id: "applications", label: t.savedApps, icon: "📁" },
                  { id: "notifications", label: t.notifications, icon: "🔔", badge: 3 },
                  { id: "history", label: t.history, icon: "🎙️" },
                  { id: "settings", label: t.settings, icon: "⚙️" },
                  { id: "help", label: t.help, icon: "❓" }
                ].map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as any)}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer accessible-focus ${
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/25 to-transparent text-cyan-300 border-l-4 border-cyan-400 shadow-sm" 
                          : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom: Language Selector + Logout Controls */}
            <div className="mt-8 pt-4 border-t border-slate-800/60 space-y-4">
              
              {/* Multilingual Switcher Drawer */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Lang</span>
                <div className="flex bg-slate-900/80 rounded-lg p-0.5 border border-slate-800">
                  <button 
                    onClick={() => handleLanguageSelect("en")}
                    className={`py-1 px-2.5 rounded text-[10px] font-bold transition-all ${language === "en" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500"}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={() => handleLanguageSelect("hi")}
                    className={`py-1 px-2.5 rounded text-[10px] font-bold transition-all ${language === "hi" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-slate-500"}`}
                  >
                    हिंदी
                  </button>
                  <button 
                    onClick={() => handleLanguageSelect("te")}
                    className={`py-1 px-2.5 rounded text-[10px] font-bold transition-all ${language === "te" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500"}`}
                  >
                    తెలుగు
                  </button>
                </div>
              </div>

              {/* Theme Selector + Signout */}
              <div className="flex items-center justify-between text-xs">
                <button 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 text-slate-300"
                  title="Toggle Theme"
                >
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>
                <button 
                  onClick={handleLogout}
                  className="py-1.5 px-3 rounded-lg bg-rose-950/20 text-rose-300 border border-rose-900/30 font-semibold hover:bg-rose-950/40 transition-all active:scale-95 duration-150 cursor-pointer"
                >
                  Logout ↩
                </button>
              </div>

            </div>

          </aside>

          {/* --------------------------------------------------------
              RIGHT MAIN PANEL
              -------------------------------------------------------- */}
          <main className="flex-1 flex flex-col bg-[#0F172A] z-10 relative overflow-hidden">
            
            {/* Top Workspace Header */}
            <header className="py-4 px-6 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shadow-md">
                    🤖
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide font-heading">
                    {language === "hi" ? "जनमित्र AI सहायक" : language === "te" ? "జన్మిత్ర AI సహాయకుడు" : "JanMitra AI Assistant"}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                    {t.onlineStatus}
                  </span>
                </div>
              </div>

              {/* Dynamic Header Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:inline-flex py-1 px-3 rounded-full bg-cyan-950/30 text-cyan-300 border border-cyan-900/30 text-[10px] font-bold">
                  {selectedCategory}
                </div>
                <button className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 text-slate-400 hover:text-white" title="Read Aloud Toggle">
                  🔊
                </button>
              </div>
            </header>

            {/* ========================================================
                VIEW: AI ASSISTANT CHAT
                ======================================================== */}
            {currentView === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Scrollable Dialogue Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatMessages.map((msg) => {
                    const isBot = msg.sender === "bot";
                    return (
                      <div key={msg.id} className={`flex gap-3 max-w-3xl ${isBot ? "" : "ml-auto flex-row-reverse"}`}>
                        
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          isBot ? "bg-slate-800 text-base" : "bg-gradient-to-tr from-cyan-400 to-purple-500 text-sm"
                        }`}>
                          {isBot ? "🤖" : "👩"}
                        </div>

                        {/* Speech Bubble */}
                        <div className="space-y-1">
                          <div className={`py-3 px-4 rounded-2xl text-sm leading-relaxed border ${
                            isBot 
                              ? "bg-slate-800/60 border-slate-700/40 text-slate-200" 
                              : "bg-gradient-to-br from-cyan-900/60 to-purple-900/60 border-cyan-800/40 text-cyan-100"
                          }`}>
                            
                            {/* Rich Text Formatter with Bold Support */}
                            <p className="whitespace-pre-wrap">
                              {msg.text.split("**").map((chunk, idx) => 
                                idx % 2 === 1 ? <strong key={idx} className="text-cyan-300 font-extrabold">{chunk}</strong> : chunk
                              )}
                            </p>

                            {/* Optional list items (schemes list rendering) */}
                            {msg.isList && msg.listItems && (
                              <ul className="mt-3 space-y-2 list-disc list-inside text-xs pl-2 text-slate-300">
                                {msg.listItems.map((item, idx) => (
                                  <li key={idx}>
                                    {item.split(" - ").map((p, pidx) => 
                                      pidx === 0 ? <strong key={pidx} className="text-white">{p}</strong> : ` - ${p}`
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}

                          </div>

                          {/* Timestamp and feedback flags */}
                          <div className={`flex items-center gap-3 text-[10px] text-slate-500 ${isBot ? "" : "justify-end"}`}>
                            <span>{msg.timestamp}</span>
                            {isBot && (
                              <div className="flex gap-2">
                                <button className="hover:text-cyan-400" title="Copy text">📋</button>
                                <button className="hover:text-cyan-400" title="Like">👍</button>
                                <button className="hover:text-cyan-400" title="Dislike">👎</button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}

                  {/* Typing Indicator Animation */}
                  {isTyping && (
                    <div className="flex gap-3 max-w-lg">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 shadow-sm text-base">
                        🤖
                      </div>
                      <div className="py-3 px-4 rounded-2xl bg-slate-800/40 border border-slate-700/30 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0s" }}></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Bottom Center interactive suggestion bar */}
                <div className="px-6 py-3 border-t border-slate-800/40 bg-slate-900/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wider">
                    {t.youCanAsk}
                  </span>
                  <div className="flex gap-2.5 overflow-x-auto pb-1.5 select-none scrollbar-none">
                    {suggestionPills.map((pill, idx) => {
                      const pillText = pill[language];
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePillClick(pillText)}
                          className="py-1.5 px-3 rounded-full bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500 text-slate-300 hover:text-cyan-200 text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95"
                        >
                          {pillText}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Core glowing input search bar */}
                <div className="p-6 border-t border-slate-800/60 bg-[#111827]/40">
                  <div className="relative max-w-4xl mx-auto flex items-center">
                    
                    {/* Glowing outer boundary container */}
                    <div className="w-full flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 rounded-2xl py-3 px-4 shadow-[0_0_20px_rgba(0,194,255,0.05)] focus-within:shadow-[0_0_30px_rgba(0,194,255,0.15)] focus-within:border-cyan-400/80 transition-all duration-300">
                      
                      {/* Left Visualizer voice waves */}
                      <div className="hidden sm:flex items-center gap-0.5 shrink-0 px-1">
                        <span className={`w-0.5 rounded bg-cyan-400 ${isSpeaking ? "voice-wave-bar" : "h-2"}`} style={{ animationDelay: "0s" }}></span>
                        <span className={`w-0.5 rounded bg-cyan-400/80 ${isSpeaking ? "voice-wave-bar" : "h-3"}`} style={{ animationDelay: "0.2s" }}></span>
                        <span className={`w-0.5 rounded bg-cyan-400/60 ${isSpeaking ? "voice-wave-bar" : "h-1.5"}`} style={{ animationDelay: "0.4s" }}></span>
                      </div>

                      {/* Text Input */}
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                        placeholder={t.inputPlaceholder}
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none border-none pl-1"
                      />

                      {/* Right Waveform visualizer */}
                      <div className="hidden sm:flex items-center gap-0.5 shrink-0 px-1">
                        <span className={`w-0.5 rounded bg-cyan-400/60 ${isSpeaking ? "voice-wave-bar" : "h-1.5"}`} style={{ animationDelay: "0.4s" }}></span>
                        <span className={`w-0.5 rounded bg-cyan-400/80 ${isSpeaking ? "voice-wave-bar" : "h-3"}`} style={{ animationDelay: "0.2s" }}></span>
                        <span className={`w-0.5 rounded bg-cyan-400 ${isSpeaking ? "voice-wave-bar" : "h-2"}`} style={{ animationDelay: "0s" }}></span>
                      </div>

                      {/* Input Accessories */}
                      <div className="flex items-center gap-2 text-slate-400 border-l border-slate-800 pl-3 shrink-0">
                        <button className="hover:text-cyan-400 text-sm font-semibold" title="Keyboard layout">⌨️</button>
                        <button className="hover:text-cyan-400 text-sm" title="Attach file">📎</button>
                        
                        {/* Send Button */}
                        <button 
                          onClick={handleSendChat}
                          className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-900 flex items-center justify-center active:scale-95 transition-all duration-150"
                        >
                          &rarr;
                        </button>
                      </div>

                    </div>

                    {/* CENTRAL GLOWING MICROPHONE BUTTON */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center">
                      <button 
                        onClick={handleMicClick}
                        className={`w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 flex items-center justify-center text-white cursor-pointer transition-all duration-300 accessible-focus z-20 ${
                          micPulse ? "animate-[pulseGlow_1.5s_infinite_ease-in-out] scale-105" : "shadow-[0_0_20px_rgba(0,194,255,0.3)] hover:scale-105"
                        }`}
                      >
                        <svg className={`w-6 h-6 ${micPulse ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase mt-1 tracking-wider">
                        {isSpeaking ? "Listening..." : t.micSubtext}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* ========================================================
                VIEW: KNOW YOUR SCHEMES PAGE
                ======================================================== */}
            {currentView === "schemes" && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden select-none">
                
                {/* Search Bar + Filter Category Chips */}
                <div className="space-y-4">
                  <div className="relative max-w-2xl">
                    <input 
                      type="text"
                      value={schemeSearch}
                      onChange={(e) => setSchemeSearch(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full py-3 pl-10 pr-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                    />
                    <span className="absolute left-3.5 top-3.5 text-slate-500">🔍</span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 select-none">
                    {["All", "Pregnancy", "Women", "Farmers", "Students", "Health"].map((filter) => {
                      const isActive = selectedFilter === filter;
                      return (
                        <button
                          key={filter}
                          onClick={() => setSelectedFilter(filter)}
                          className={`py-1.5 px-4 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-150 ${
                            isActive 
                              ? "bg-cyan-500 text-slate-900 shadow-md" 
                              : "bg-slate-800/50 text-slate-400 hover:text-white"
                          }`}
                        >
                          {filter === "All" ? t.allFilters : filter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Schemes Cards Grid */}
                <div className="flex-1 overflow-y-auto mt-6 grid md:grid-cols-2 gap-5 pr-2">
                  {governmentSchemes
                    .filter(s => {
                      const matchesSearch = s.name.toLowerCase().includes(schemeSearch.toLowerCase()) || s.desc.toLowerCase().includes(schemeSearch.toLowerCase());
                      const matchesFilter = selectedFilter === "All" || s.tags.includes(selectedFilter);
                      return matchesSearch && matchesFilter;
                    })
                    .map((scheme) => {
                      const isExpanded = expandedScheme === scheme.name;
                      return (
                        <div 
                          key={scheme.name}
                          className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-slate-600 transition-all duration-300 group"
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl bg-slate-850 p-2 rounded-lg">{scheme.icon}</span>
                              <h4 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors font-heading leading-tight">
                                {scheme.name}
                              </h4>
                            </div>
                            <p className="mt-3 text-slate-400 text-xs leading-relaxed">
                              {scheme.desc}
                            </p>

                            {isExpanded && (
                              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                                <div>
                                  <strong className="text-cyan-300">Financial Benefits:</strong>
                                  <p className="text-slate-300">{scheme.benefit}</p>
                                </div>
                                <div>
                                  <strong className="text-purple-300">Eligibility Criteria:</strong>
                                  <p className="text-slate-300">{scheme.eligibility}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 flex justify-between items-center gap-2">
                            <button 
                              onClick={() => setExpandedScheme(isExpanded ? null : scheme.name)}
                              className="text-xs text-slate-500 hover:text-white underline cursor-pointer"
                            >
                              {isExpanded ? "Show Less" : "Learn More Details"}
                            </button>
                            <button 
                              onClick={() => {
                                alert(`Successfully submitted application for ${scheme.name}!`);
                              }}
                              className="py-1.5 px-4 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-900 border border-cyan-500/30 font-bold rounded-lg text-xs tracking-wider transition-all duration-150"
                            >
                              Apply Now
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

              </div>
            )}

            {/* ========================================================
                VIEW: ENTER YOUR DATA (OCR PORTAL)
                ======================================================== */}
            {currentView === "data" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full select-none">
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-extrabold text-white tracking-wide font-heading">
                    {t.ocrHeader}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {t.ocrSub}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                  
                  {/* File Upload Zone / Laser Scanner Simulation */}
                  <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-700/60 aspect-video relative overflow-hidden">
                    
                    {/* Glowing Scanner laser */}
                    {ocrStatus === "scanning" && (
                      <div className="absolute left-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_rgba(0,194,255,0.9)] laser-scanner"></div>
                    )}

                    {ocrStatus === "idle" && (
                      <div className="text-center space-y-4">
                        <span className="text-4xl block">💳</span>
                        <p className="text-xs text-slate-400">Drag & Drop or click below to simulate Aadhaar OCR scan</p>
                        <button 
                          onClick={handleOcrSimulate}
                          className="py-2 px-5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500 hover:to-purple-600 text-cyan-300 hover:text-white font-bold rounded-xl text-xs border border-cyan-500/30 transition-all duration-200 cursor-pointer active:scale-95"
                        >
                          Simulate Aadhaar scan 📸
                        </button>
                      </div>
                    )}

                    {ocrStatus === "uploading" && (
                      <div className="text-center space-y-3">
                        <span className="text-2xl animate-spin block">🔄</span>
                        <p className="text-xs text-cyan-300 font-bold uppercase tracking-widest animate-pulse">Uploading file...</p>
                      </div>
                    )}

                    {ocrStatus === "scanning" && (
                      <div className="text-center space-y-3 z-10">
                        <span className="text-2xl block animate-bounce">🔍</span>
                        <p className="text-xs text-purple-300 font-bold uppercase tracking-widest animate-pulse">
                          {t.analyzing}
                        </p>
                      </div>
                    )}

                    {ocrStatus === "success" && (
                      <div className="text-center space-y-3">
                        <span className="text-4xl block animate-bounce">✅</span>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                          Data successfully extracted!
                        </p>
                        <button 
                          onClick={() => setOcrStatus("idle")}
                          className="text-xs text-slate-500 hover:text-slate-300 underline"
                        >
                          Upload another document
                        </button>
                      </div>
                    )}

                  </div>

                  {/* Extracted Fields Form */}
                  <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                      Extracted Fields
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                        <input 
                          type="text"
                          value={ocrData.name}
                          onChange={(e) => setOcrData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Extracting name..."
                          className="w-full py-2 px-3.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">DOB</label>
                          <input 
                            type="text"
                            value={ocrData.dob}
                            placeholder="DOB..."
                            className="w-full py-2 px-3.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gender</label>
                          <input 
                            type="text"
                            value={ocrData.gender}
                            placeholder="Gender..."
                            className="w-full py-2 px-3.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aadhaar Number</label>
                        <input 
                          type="text"
                          value={ocrData.aadhaar}
                          placeholder="Aadhaar..."
                          className="w-full py-2 px-3.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registered Address</label>
                        <textarea 
                          value={ocrData.address}
                          rows={2}
                          placeholder="Address..."
                          className="w-full py-2 px-3.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5">
                        🛡️ {t.encrypted}
                      </span>
                      <button 
                        onClick={() => {
                          alert("Data saved securely to national health repository!");
                          setCurrentView("chat");
                        }}
                        disabled={!ocrData.name}
                        className="py-2 px-5 bg-gradient-to-r from-cyan-500 to-purple-600 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-lg cursor-pointer"
                      >
                        {t.saveSecurely} &rarr;
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ========================================================
                VIEW: NOTIFICATIONS VIEW
                ======================================================== */}
            {currentView === "notifications" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full select-none">
                <h3 className="text-2xl font-extrabold text-white tracking-wide font-heading mb-6">
                  {t.notifications}
                </h3>

                <div className="space-y-4">
                  {[
                    { id: 1, title: t.vaccineAlert, desc: "Lakshmi Devi's 9-month measles vaccination checkup is scheduled for next Tuesday at Sub-Centre Kothapalli.", type: "high_risk", date: "Due in 5 days" },
                    { id: 2, title: t.schemeDeadline, desc: "PMMVY maternal benefit installment submission deadline closes in 4 days. Please verify documents.", type: "warning", date: "June 2, 2026" },
                    { id: 3, title: t.referralHospital, desc: "Dr. Anjali Verma (OB-GYN) will be available at PMSMA clinic Gopalapuram on June 9th.", type: "info", date: "June 9, 2026" },
                    { id: 4, title: t.pensionUpdate, desc: "Verification required for Old Age pension eligibility in Panchayat Cherukupalli.", type: "info", date: "Verified" }
                  ].map((notif) => {
                    const borderClass = notif.type === "high_risk" ? "border-l-4 border-rose-500" : notif.type === "warning" ? "border-l-4 border-amber-500" : "border-l-4 border-cyan-500";
                    const bgClass = notif.type === "high_risk" ? "bg-rose-950/10" : notif.type === "warning" ? "bg-amber-950/10" : "bg-cyan-950/10";
                    return (
                      <div key={notif.id} className={`p-4 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4 ${borderClass} ${bgClass}`}>
                        <div>
                          <h4 className="text-sm font-bold text-white font-heading leading-tight">{notif.title}</h4>
                          <p className="mt-1.5 text-xs text-slate-400">{notif.desc}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
                          {notif.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW: SAVED APPLICATIONS VIEW
                ======================================================== */}
            {currentView === "applications" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full select-none">
                <h3 className="text-2xl font-extrabold text-white tracking-wide font-heading mb-6">
                  {t.savedApps}
                </h3>

                <div className="space-y-4">
                  {[
                    { id: 1, name: "PM Matru Vandana Yojana (PMMVY)", status: "Approved", tracker: "1st Installment Paid (₹2,000)", date: "Approved on: May 20, 2026", color: "text-emerald-400" },
                    { id: 2, name: "Janani Suraksha Yojana (JSY)", status: "Pending Verification", tracker: "Institutional Delivery Cert missing", date: "Submitted: May 27, 2026", color: "text-amber-400" },
                    { id: 3, name: "Lado Protsahan Savings Bond", status: "Draft Saved", tracker: "Auto-filled using secure Aadhaar scan", date: "Last edited: June 27, 2026", color: "text-slate-400" }
                  ].map((app) => (
                    <div key={app.id} className="glass-panel p-5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white font-heading leading-tight">{app.name}</h4>
                        <p className="mt-1 text-xs text-slate-400">Current Track: {app.tracker}</p>
                        <span className="mt-2 text-[10px] font-bold text-slate-500 uppercase block">{app.date}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold uppercase tracking-wider ${app.color}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW: VOICE HISTORY VIEW
                ======================================================== */}
            {currentView === "history" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full select-none">
                <h3 className="text-2xl font-extrabold text-white tracking-wide font-heading mb-6">
                  {t.history}
                </h3>

                <div className="space-y-4">
                  {[
                    { id: 1, title: "Fever after vaccination check", transcript: "क्या लक्ष्मी देवी को टीकाकरण के बाद बुखार आना सामान्य है?", date: "Today, 10:45 AM" },
                    { id: 2, title: "Pregnancy schemes search", transcript: "मुझे गर्भवती महिलाओं के लिए सरकारी योजनाओं के बारे में बताइए।", date: "Today, 10:31 AM" },
                    { id: 3, title: "Emergency transportation query", transcript: "नज़दीकी अस्पताल कौन सा है और एम्बुलेंस कैसे मिलेगी?", date: "Yesterday, 4:15 PM" }
                  ].map((hist) => (
                    <div key={hist.id} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-cyan-300 tracking-wide font-heading">{hist.title}</strong>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{hist.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"🎤 {hist.transcript}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW: SETTINGS & HELP
                ======================================================== */}
            {currentView === "settings" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full select-none">
                <h3 className="text-2xl font-extrabold text-white tracking-wide font-heading mb-6">
                  {t.settings}
                </h3>
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Device Accessibility Settings</h4>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between text-xs text-slate-300">
                      <span>Enable Text-To-Speech (Read Aloud) by default</span>
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900" />
                    </label>
                    <label className="flex items-center justify-between text-xs text-slate-300">
                      <span>Vibrational haptics on voice mic activation</span>
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900" />
                    </label>
                    <label className="flex items-center justify-between text-xs text-slate-300">
                      <span>Persistent low bandwidth mode (Compress charts / images)</span>
                      <input type="checkbox" className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {currentView === "help" && (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-4xl mx-auto w-full select-none">
                <h3 className="text-2xl font-extrabold text-white tracking-wide font-heading mb-6">
                  {t.help}
                </h3>
                <div className="space-y-4 text-xs text-slate-400">
                  <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <strong className="text-white block mb-1">How do I verify if my Aadhaar is scanned securely?</strong>
                    <span>JanMitra AI runs on a fully end-to-end encrypted protocol conforming to Aadhaar security regulations. The file is analyzed strictly via on-device sandboxed OCR models.</span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40">
                    <strong className="text-white block mb-1">How can I apply for PMMVY scheme online?</strong>
                    <span>Go to the 'Know Your Schemes' tab in the sidebar menu, click 'Learn More Details' on the PMMVY card, and click 'Apply Now' to auto-fill the application with your secure Aadhaar credentials.</span>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>
      )}

    </div>
  );
}
