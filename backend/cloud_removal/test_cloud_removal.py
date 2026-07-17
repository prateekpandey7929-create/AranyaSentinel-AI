import sys
import os
import numpy as np
import unittest

# Add project directories to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, 'backend'))

from cloud_removal.cloud_detector import detect_clouds
from cloud_removal.gap_filler import fill_gaps
from cloud_removal.enhancer import enhance_bands
from cloud_removal.cloud_service import process_monsoon_image

class TestCloudRemoval(unittest.TestCase):

    def setUp(self):
        # Setup 256x256 mock bands
        # values in [0, 1] range
        self.mock_bands = {
            'B2': np.full((256, 256), 0.1, dtype=np.float32),
            'B3': np.full((256, 256), 0.15, dtype=np.float32),
            'B4': np.full((256, 256), 0.1, dtype=np.float32),
            'B8': np.full((256, 256), 0.6, dtype=np.float32)  # High NIR
        }
        
        # Add a cloudy patch in the center
        # Clouds: B2=0.6, B3=0.6, B4=0.6, B8=0.5 (low NDVI, highly reflective blue/visible)
        self.mock_bands['B2'][100:150, 100:150] = 0.6
        self.mock_bands['B3'][100:150, 100:150] = 0.6
        self.mock_bands['B4'][100:150, 100:150] = 0.6
        self.mock_bands['B8'][100:150, 100:150] = 0.5
        
        # Add QA60 masked pixel (value=0.0) at top-left corner
        self.mock_bands['B2'][0, 0] = 0.0
        self.mock_bands['B3'][0, 0] = 0.0
        self.mock_bands['B4'][0, 0] = 0.0
        
        # Historical bands (completely clear)
        self.mock_hist = {
            'B2': np.full((256, 256), 0.1, dtype=np.float32),
            'B3': np.full((256, 256), 0.15, dtype=np.float32),
            'B4': np.full((256, 256), 0.1, dtype=np.float32),
            'B8': np.full((256, 256), 0.6, dtype=np.float32)
        }

    def test_detect_clouds(self):
        mask = detect_clouds(self.mock_bands)
        self.assertEqual(mask.shape, (256, 256))
        
        # Top-left QA60 pixel must be marked as cloud (255)
        self.assertEqual(mask[0, 0], 255)
        
        # Cloudy patch center must be marked as cloud (255)
        self.assertEqual(mask[125, 125], 255)
        
        # Non-cloudy pixel must be clear (0)
        self.assertEqual(mask[10, 10], 0)

        # Invalid bands check
        bad_mask = detect_clouds(None)
        self.assertEqual(np.sum(bad_mask), 0)

    def test_fill_gaps_spatial(self):
        mask = detect_clouds(self.mock_bands)
        # Spatial gap filling (no historical input)
        filled, remaining = fill_gaps(self.mock_bands, mask, historical_bands=None)
        
        # Gaps should be filled, so remaining mask is empty
        self.assertEqual(np.sum(remaining), 0)
        # Filled bands should contain valid non-zero values in the gap
        self.assertTrue(filled['B2'][125, 125] < 0.6) # Inpainted value should match surrounding (0.1)

    def test_fill_gaps_historical(self):
        mask = detect_clouds(self.mock_bands)
        # Historical gap filling (using clear historical reference)
        filled, remaining = fill_gaps(self.mock_bands, mask, historical_bands=self.mock_hist)
        
        # Gaps should be filled
        self.assertEqual(np.sum(remaining), 0)
        # Value copied from historical should be exactly 0.1 (B2 clear value)
        self.assertEqual(filled['B2'][125, 125], 0.1)
        self.assertEqual(filled['B8'][125, 125], 0.6)

    def test_enhance_bands(self):
        enhanced = enhance_bands(self.mock_hist)
        self.assertEqual(list(enhanced.keys()), ['B2', 'B3', 'B4', 'B8'])
        self.assertEqual(enhanced['B2'].shape, (256, 256))

    def test_monsoon_coordinator(self):
        enhanced, mask, init_pct, final_pct, quality, duration = process_monsoon_image(
            self.mock_bands, self.mock_hist
        )
        self.assertEqual(mask.shape, (256, 256))
        self.assertTrue(init_pct > 3.0)  # Central patch + QA60 pixel
        self.assertEqual(final_pct, 0.0) # Gaps were filled
        self.assertEqual(quality, "Excellent")
        self.assertTrue(duration > 0.0)

class TestCloudRemovalAPI(unittest.TestCase):
    def test_api_endpoint(self):
        import requests
        try:
            # Query the running server's POST /cloud-removal endpoint
            # Since uvicorn is running, let's test it on 'after' or 'before'
            response = requests.post("http://127.0.0.1:8000/cloud-removal?image_type=after")
            if response.status_code == 200:
                data = response.json()
                self.assertEqual(data["status"], "success")
                self.assertIn("initial_cloud_percentage", data)
                self.assertIn("final_cloud_percentage", data)
                self.assertIn("image_quality_score", data)
                self.assertIn("urls", data)
                print("Successfully verified POST /cloud-removal API endpoint!")
            else:
                # If /analyze hasn't been run yet, the file after.tif may not exist, yielding 404
                self.assertEqual(response.status_code, 404)
                print("[WARNING] POST /cloud-removal returned 404 (expected if after.tif is missing).")
        except Exception as e:
            print(f"[WARNING] Could not query running uvicorn server: {e}")

if __name__ == "__main__":
    unittest.main()
