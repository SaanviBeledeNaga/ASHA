import unittest
import sys
import os

# Add parent directory to path to ensure backend imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.rules_engine import evaluate_clinical_risk, match_eligible_schemes
from backend.voice_extractor import fallback_regex_extractor

class TestRulesEngine(unittest.TestCase):
    
    def test_low_risk_vitals(self):
        """BP 118/76 with no symptoms should be low risk"""
        res = evaluate_clinical_risk(age=24, systolic_bp=118, diastolic_bp=76, symptoms=[], pregnancy_month=5)
        self.assertEqual(res["risk_level"], "low")
        self.assertIn("Continue daily Iron & Folic Acid", res["recommendations"][0])
        
    def test_high_risk_hypertension(self):
        """BP 145/95 should trigger high risk hypertension warning"""
        res = evaluate_clinical_risk(age=25, systolic_bp=145, diastolic_bp=95, symptoms=[], pregnancy_month=6)
        self.assertEqual(res["risk_level"], "high")
        self.assertTrue(any("URGENT" in r for r in res["recommendations"]))
        self.assertTrue(any("Hypertension" in t for t in res["triggers"]))

    def test_high_risk_symptom(self):
        """Presence of vaginal bleeding must immediately trigger high risk and referral"""
        res = evaluate_clinical_risk(age=22, systolic_bp=115, diastolic_bp=75, symptoms=["bleeding"], pregnancy_month=4)
        self.assertEqual(res["risk_level"], "high")
        self.assertTrue(any("bleeding" in t.lower() for t in res["triggers"]))
        self.assertTrue(any("bleeding" in r.lower() for r in res["recommendations"]))

    def test_medium_risk_symptom(self):
        """Mild swelling or dizziness should trigger medium risk classification"""
        res = evaluate_clinical_risk(age=26, systolic_bp=120, diastolic_bp=80, symptoms=["swelling"], pregnancy_month=5)
        self.assertEqual(res["risk_level"], "medium")
        self.assertTrue(any("swelling" in t.lower() for t in res["triggers"]))
        
    def test_age_factor(self):
        """Age > 35 should trigger medium risk status during pregnancy"""
        res = evaluate_clinical_risk(age=38, systolic_bp=118, diastolic_bp=76, symptoms=[], pregnancy_month=6)
        self.assertEqual(res["risk_level"], "medium")
        self.assertTrue(any("age" in t.lower() for t in res["triggers"]))

    def test_scheme_matching(self):
        """PMSMA must only be matched during 2nd and 3rd trimesters (month >= 4)"""
        # Pregnant Month 2 (1st trimester)
        schemes_m2 = match_eligible_schemes(pregnancy_status=True, pregnancy_month=2, age=24)
        self.assertIn("PM Matru Vandana Yojana (PMMVY)", schemes_m2)
        self.assertNotIn("Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)", schemes_m2)
        
        # Pregnant Month 6 (2nd trimester)
        schemes_m6 = match_eligible_schemes(pregnancy_status=True, pregnancy_month=6, age=24)
        self.assertIn("PM Matru Vandana Yojana (PMMVY)", schemes_m6)
        self.assertIn("Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)", schemes_m6)
        
        # Non-pregnant mother (child focus)
        schemes_non_preg = match_eligible_schemes(pregnancy_status=False, age=24)
        self.assertIn("Integrated Child Development Services (ICDS) Immunization", schemes_non_preg)
        self.assertNotIn("Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)", schemes_non_preg)

class TestVoiceExtractorFallback(unittest.TestCase):
    
    def test_regex_extraction_high_risk(self):
        """Regex should correctly extract variables from standard Hinglish/English strings"""
        sample_text = "Visit for Lakshmi Devi, age 23, in Kothapalli. She is in month 7 of pregnancy. BP is elevated, systolic 145 over 95. Weight is 58. She complains of swelling and severe headache."
        data = fallback_regex_extractor(sample_text)
        
        self.assertEqual(data["name"], "Lakshmi Devi")
        self.assertEqual(data["age"], 23)
        self.assertEqual(data["pregnancy_month"], 7)
        self.assertEqual(data["systolic_bp"], 145)
        self.assertEqual(data["diastolic_bp"], 95)
        self.assertEqual(data["weight"], 58.0)
        self.assertIn("swelling", data["symptoms"])
        self.assertIn("severe headache", data["symptoms"])

    def test_regex_extraction_normal(self):
        """Regex should parse values with varied phrase layouts"""
        sample_text = "Anitha Rao, age 29. month 8 checkup. Weight is 61.5. BP level 122 over 78. Minor back pain."
        data = fallback_regex_extractor(sample_text)
        
        self.assertEqual(data["name"], "Anitha Rao")
        self.assertEqual(data["age"], 29)
        self.assertEqual(data["pregnancy_month"], 8)
        self.assertEqual(data["systolic_bp"], 122)
        self.assertEqual(data["diastolic_bp"], 78)
        self.assertEqual(data["weight"], 61.5)
        self.assertIn("back pain", data["symptoms"])

if __name__ == "__main__":
    unittest.main()
