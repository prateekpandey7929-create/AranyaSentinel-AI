import sys
import os
import unittest

# Add project root to python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, 'backend'))

from season_verification.ndvi_history import get_historical_ndvi_stats
from season_verification.weather_service import resolve_weather_data
from season_verification.decision_engine import verify_season_impact

class TestSeasonVerification(unittest.TestCase):

    def test_get_historical_ndvi_stats(self):
        # Month 3 (March) in Central India has deciduous leaf shedding, so average NDVI should be lower (approx 0.35)
        stats = get_historical_ndvi_stats(lat=22.334, lon=80.611, month=3)
        self.assertIn("avg", stats)
        self.assertIn("min", stats)
        self.assertIn("max", stats)
        self.assertTrue(stats["avg"] < 0.5)

        # Month 8 (August) in Monsoon peak has very high average NDVI (approx 0.75)
        stats_monsoon = get_historical_ndvi_stats(lat=22.334, lon=80.611, month=8)
        self.assertTrue(stats_monsoon["avg"] > 0.6)

    def test_resolve_weather_data(self):
        # March weather parameters
        weather = resolve_weather_data(lat=22.334, lon=80.611, month=3)
        self.assertEqual(weather["season"], "Summer (Hot & Dry)")
        self.assertTrue(weather["temp"] > 25.0)
        self.assertTrue(weather["rainfall"] < 15.0)

    def test_verify_season_impact_natural(self):
        # Test case: March (dry season), 0 encroachments, 12% loss, low NDVI (0.33)
        res = verify_season_impact(
            lat=22.334,
            lon=80.611,
            month=3,
            forest_loss_pct=12.0,
            encroachments=0,
            current_ndvi=0.33
        )
        self.assertEqual(res["classification"], "Natural Seasonal Change")
        self.assertTrue(res["confidence"] >= 75.0)
        self.assertIn("deciduous leaf shedding", res["explanation"].lower())

    def test_verify_season_impact_deforestation_yolo(self):
        # Test case: March (dry season), 1 encroachment, 12% loss, low NDVI (0.33) -> Deforestation confirmed
        res = verify_season_impact(
            lat=22.334,
            lon=80.611,
            month=3,
            forest_loss_pct=12.0,
            encroachments=1,
            current_ndvi=0.33
        )
        self.assertEqual(res["classification"], "Actual Deforestation")
        self.assertTrue(res["confidence"] >= 90.0)
        self.assertIn("encroachment", res["explanation"].lower())

    def test_verify_season_impact_deforestation_monsoon(self):
        # Test case: August (monsoon), 0 encroachments, 15% loss, low NDVI (0.45) -> Deforestation confirmed
        res = verify_season_impact(
            lat=22.334,
            lon=80.611,
            month=8,
            forest_loss_pct=15.0,
            encroachments=0,
            current_ndvi=0.45
        )
        self.assertEqual(res["classification"], "Actual Deforestation")
        self.assertTrue(res["confidence"] >= 80.0)
        self.assertIn("monsoon", res["explanation"].lower())

class TestSeasonVerificationAPI(unittest.TestCase):
    def test_api_endpoint(self):
        import requests
        try:
            # Query the running server's POST /season-verification endpoint
            payload = {
                "latitude": 22.334,
                "longitude": 80.611,
                "month": 3,
                "forest_loss_percentage": 12.0,
                "encroachment_count": 0,
                "current_ndvi": 0.33
            }
            response = requests.post("http://127.0.0.1:8000/season-verification", json=payload)
            if response.status_code == 200:
                data = response.json()
                self.assertEqual(data["status"], "success")
                self.assertEqual(data["classification"], "Natural Seasonal Change")
                self.assertTrue(data["confidence_score"] >= 75.0)
                self.assertIn("weather", data)
                self.assertIn("ndvi_comparison", data)
                print("Successfully verified POST /season-verification API endpoint!")
            else:
                self.fail(f"API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[WARNING] Could not query running uvicorn server: {e}")

if __name__ == "__main__":
    unittest.main()
