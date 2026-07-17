import sys
import os
import unittest

# Add project root to python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, 'backend'))

from ai_prediction import compute_ai_prediction

class TestAIPrediction(unittest.TestCase):

    def test_compute_ai_prediction_encroachment(self):
        res = compute_ai_prediction(
            forest_loss_pct=12.5,
            encroachments=2,
            health_score=65.0,
            season_classification="Actual Deforestation",
            cloud_pct=10.0
        )
        self.assertEqual(res["prediction"], "Illegal Encroachment & Forest Loss")
        self.assertEqual(res["severity"], "Critical")
        self.assertTrue(res["confidence_score"] > 80.0)
        self.assertTrue(len(res["suggested_actions"]) >= 3)
        self.assertIn("ranger", res["suggested_actions"][0])

    def test_compute_ai_prediction_season(self):
        res = compute_ai_prediction(
            forest_loss_pct=12.5,
            encroachments=0,
            health_score=45.0,
            season_classification="Natural Seasonal Change",
            cloud_pct=0.0
        )
        self.assertEqual(res["prediction"], "Natural Seasonal Vegetation Change")
        self.assertEqual(res["severity"], "Low")
        self.assertIn("deciduous", res["reason"].lower())

    def test_compute_ai_prediction_high_loss(self):
        res = compute_ai_prediction(
            forest_loss_pct=18.0,
            encroachments=0,
            health_score=60.0,
            season_classification=None,
            cloud_pct=10.0
        )
        self.assertEqual(res["prediction"], "Deforestation Alarm (Potential Logging)")
        self.assertEqual(res["severity"], "High")

    def test_compute_ai_prediction_low_health(self):
        res = compute_ai_prediction(
            forest_loss_pct=4.0,
            encroachments=0,
            health_score=35.0,
            season_classification=None,
            cloud_pct=0.0
        )
        self.assertEqual(res["prediction"], "Canopy Ecological Health Decline")
        self.assertEqual(res["severity"], "Moderate")

    def test_compute_ai_prediction_stable(self):
        res = compute_ai_prediction(
            forest_loss_pct=2.0,
            encroachments=0,
            health_score=78.0,
            season_classification=None,
            cloud_pct=0.0
        )
        self.assertEqual(res["prediction"], "Canopy Stable & Healthy")
        self.assertEqual(res["severity"], "Low")

    def test_compute_ai_prediction_trend_degrading(self):
        # Case 1: High forest loss, encroachments, low health -> Degrading
        res = compute_ai_prediction(
            forest_loss_pct=10.0,
            encroachments=1,
            health_score=70.0,
            season_classification=None,
            cloud_pct=0.0
        )
        self.assertEqual(res["trend_direction"], "Degrading 📉")
        self.assertEqual(res["recovery_probability"], 38.0)
        self.assertIn("decline", res["future_prediction"])
        self.assertIn("decreased", res["trend_summary"])

    def test_compute_ai_prediction_trend_improving(self):
        # Case 2: Zero forest loss, zero encroachments, high health -> Improving
        res = compute_ai_prediction(
            forest_loss_pct=1.0,
            encroachments=0,
            health_score=85.0,
            season_classification=None,
            cloud_pct=0.0
        )
        self.assertEqual(res["trend_direction"], "Improving 📈")
        self.assertTrue(res["recovery_probability"] > 80.0)
        self.assertIn("expanding", res["future_prediction"])

    def test_compute_ai_prediction_trend_stable(self):
        # Case 3: Moderate stable parameters -> Stable
        res = compute_ai_prediction(
            forest_loss_pct=3.0,
            encroachments=0,
            health_score=72.0,
            season_classification=None,
            cloud_pct=0.0
        )
        self.assertEqual(res["trend_direction"], "Stable ➡️")
        self.assertTrue(50.0 <= res["recovery_probability"] <= 85.0)

class TestAIPredictionAPI(unittest.TestCase):
    def test_api_endpoint(self):
        import requests
        try:
            # Query the running server's POST /ai-prediction endpoint
            payload = {
                "forest_loss_percentage": 12.5,
                "encroachment_count": 2,
                "health_score": 65.0,
                "season_classification": "Actual Deforestation",
                "cloud_coverage_percentage": 10.0
            }
            response = requests.post("http://127.0.0.1:8000/ai-prediction", json=payload)
            if response.status_code == 200:
                data = response.json()
                self.assertEqual(data["status"], "success")
                self.assertEqual(data["prediction"], "Illegal Encroachment & Forest Loss")
                self.assertEqual(data["severity"], "Critical")
                self.assertTrue(len(data["suggested_actions"]) >= 3)
                print("Successfully verified POST /ai-prediction API endpoint!")
            else:
                self.fail(f"API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[WARNING] Could not query running uvicorn server: {e}")

if __name__ == "__main__":
    unittest.main()
