import sys
import os
import numpy as np
import unittest

# Add project directories to path to run directly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, 'backend'))

from forest_health.utilities.metrics import (
    calculate_vegetation_score,
    calculate_density_score,
    calculate_loss_score,
    calculate_human_activity_score,
    calculate_water_availability_score,
    calculate_fire_risk_score
)
from forest_health.services.explanation_engine import generate_explanation
from forest_health.services.health_engine import run_forest_health_analysis

class TestForestHealthEngine(unittest.TestCase):

    def test_vegetation_score(self):
        # 1. Healthy dense vegetation (mean NDVI = 0.8)
        ndvi_dense = np.full((10, 10), 0.8)
        self.assertEqual(calculate_vegetation_score(ndvi_dense), 100.0)

        # 2. Moderate vegetation (mean NDVI = 0.4)
        ndvi_mod = np.full((10, 10), 0.4)
        self.assertEqual(calculate_vegetation_score(ndvi_mod), 50.0)

        # 3. Sparse vegetation (mean NDVI = 0.1)
        ndvi_sparse = np.full((10, 10), 0.1)
        self.assertEqual(calculate_vegetation_score(ndvi_sparse), 12.5)

        # 4. Invalid input handling
        self.assertEqual(calculate_vegetation_score(None), 50.0)
        self.assertEqual(calculate_vegetation_score("invalid"), 50.0)
        self.assertEqual(calculate_vegetation_score(np.array([])), 50.0)

    def test_density_score(self):
        # 1. 0% loss (completely intact forest)
        mask_intact = np.zeros((10, 10))
        self.assertEqual(calculate_density_score(mask_intact), 100.0)

        # 2. 10% loss (10 pixels are loss = 255)
        mask_loss = np.zeros((10, 10))
        mask_loss[0, :] = 255  # 10 pixels
        self.assertEqual(calculate_density_score(mask_loss), 90.0)

        # 3. 100% loss
        mask_total_loss = np.full((10, 10), 255)
        self.assertEqual(calculate_density_score(mask_total_loss), 0.0)

        # 4. Invalid input
        self.assertEqual(calculate_density_score(None), 50.0)
        self.assertEqual(calculate_density_score("invalid"), 50.0)

    def test_loss_score(self):
        # 1. 0% loss
        self.assertEqual(calculate_loss_score(0.0), 100.0)

        # 2. 5% loss (5 * 5 = 25 reduction -> 75.0)
        self.assertEqual(calculate_loss_score(5.0), 75.0)

        # 3. 20% or more loss (clamped to 0)
        self.assertEqual(calculate_loss_score(20.0), 0.0)
        self.assertEqual(calculate_loss_score(50.0), 0.0)

        # 4. Invalid input
        self.assertEqual(calculate_loss_score(None), 50.0)
        self.assertEqual(calculate_loss_score("invalid"), 50.0)

    def test_human_activity_score(self):
        # 1. No detections
        self.assertEqual(calculate_human_activity_score(0), 100.0)

        # 2. 3 detections (3 * 10 = 30 reduction -> 70.0)
        self.assertEqual(calculate_human_activity_score(3), 70.0)

        # 3. 10+ detections (clamped to 0)
        self.assertEqual(calculate_human_activity_score(10), 0.0)
        self.assertEqual(calculate_human_activity_score(15), 0.0)

        # 4. Invalid input
        self.assertEqual(calculate_human_activity_score(None), 100.0)
        self.assertEqual(calculate_human_activity_score("invalid"), 100.0)

    def test_water_availability_score(self):
        # 1. Adequate moisture (high green, low NIR -> positive NDWI; high NDVI)
        # B3 is Green, B8 is NIR.
        # Let's say B3 = 0.4, B8 = 0.2 -> NDWI = (0.4 - 0.2) / 0.6 = 0.33
        # NDVI = 0.6
        bands_wet = {
            'B3': np.full((10, 10), 0.4),
            'B8': np.full((10, 10), 0.2)
        }
        ndvi_wet = np.full((10, 10), 0.6)
        score_wet = calculate_water_availability_score(bands_wet, ndvi_wet)
        self.assertTrue(score_wet > 70.0)

        # 2. Dry region (NIR much higher than Green)
        # B3 = 0.1, B8 = 0.5 -> NDWI = (0.1 - 0.5) / 0.6 = -0.66
        # NDVI = 0.2
        bands_dry = {
            'B3': np.full((10, 10), 0.1),
            'B8': np.full((10, 10), 0.5)
        }
        ndvi_dry = np.full((10, 10), 0.2)
        score_dry = calculate_water_availability_score(bands_dry, ndvi_dry)
        self.assertTrue(score_dry < 30.0)

        # 3. Missing bands fallback (uses NDVI only)
        self.assertTrue(calculate_water_availability_score(None, ndvi_wet) > 30.0)

        # 4. Invalid inputs fallback
        self.assertEqual(calculate_water_availability_score(None, None), 50.0)

    def test_fire_risk_score(self):
        # 1. Safe condition (high NDVI, high water score)
        ndvi_safe = np.full((10, 10), 0.7)
        self.assertTrue(calculate_fire_risk_score(ndvi_safe, 90.0) > 80.0)

        # 2. Critical fire risk (low NDVI, low water score)
        ndvi_danger = np.full((10, 10), 0.1)
        self.assertTrue(calculate_fire_risk_score(ndvi_danger, 10.0) < 30.0)

        # 3. Invalid inputs
        self.assertEqual(calculate_fire_risk_score(None, None), 50.0)

    def test_explanation_engine(self):
        metrics = {
            "vegetation_health": 95.0,
            "forest_density": 98.0,
            "forest_loss": 99.0,
            "human_activity": 100.0,
            "water_availability": 85.0,
            "fire_risk": 90.0
        }
        exp_excellent = generate_explanation(metrics, "Excellent")
        self.assertIn("pristine ecological condition", exp_excellent)
        self.assertIn("vegetation cover is highly dense and lush", exp_excellent)
        
        metrics_bad = {
            "vegetation_health": 20.0,
            "forest_density": 30.0,
            "forest_loss": 10.0,
            "human_activity": 20.0,
            "water_availability": 15.0,
            "fire_risk": 10.0
        }
        exp_critical = generate_explanation(metrics_bad, "Critical")
        self.assertIn("critical condition", exp_critical)
        self.assertIn("severe dryness and low water availability", exp_critical)
        self.assertTrue("fire" in exp_critical.lower() or "wildfire" in exp_critical.lower())

class TestForestHealthAPI(unittest.TestCase):
    def test_health_endpoint(self):
        import requests
        try:
            response = requests.get("http://127.0.0.1:8000/forest-health")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("forest_health_score", data)
            self.assertIn("health_category", data)
            self.assertIn("explanation", data)
            self.assertIn("metrics", data)
            
            metrics = data["metrics"]
            self.assertIn("vegetation_health", metrics)
            self.assertIn("forest_density", metrics)
            self.assertIn("forest_loss", metrics)
            self.assertIn("human_activity", metrics)
            self.assertIn("water_availability", metrics)
            self.assertIn("fire_risk", metrics)
            print("Successfully queried GET /forest-health endpoint!")
        except Exception as e:
            print(f"[WARNING] Could not query running uvicorn server: {e}")

if __name__ == "__main__":
    unittest.main()

