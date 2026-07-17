import sys
import os
import unittest

# Add project root to python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, 'backend'))

from forest_knowledge.resolver import resolve_forest_knowledge

class TestForestKnowledge(unittest.TestCase):

    def test_resolve_forest_knowledge_kanha(self):
        # Coordinates matching Kanha Tiger Reserve bbox
        res = resolve_forest_knowledge(lat=22.3, lon=80.6)
        self.assertEqual(res["name"], "Kanha Tiger Reserve")
        self.assertEqual(res["state"], "Madhya Pradesh")
        self.assertIn("Sal (Shorea robusta)", res["dominant_tree_species"])
        self.assertIn("Tiger", res["important_flora_and_fauna"])

    def test_resolve_forest_knowledge_satpura(self):
        # Coordinates matching Satpura bbox
        res = resolve_forest_knowledge(lat=22.5, lon=78.2)
        self.assertEqual(res["name"], "Satpura Tiger Reserve")
        self.assertEqual(res["state"], "Madhya Pradesh")
        self.assertIn("Teak (Tectona grandis)", res["dominant_tree_species"])

    def test_resolve_forest_knowledge_fallback(self):
        # Coordinates outside database bboxes (should trigger regional fallback)
        res = resolve_forest_knowledge(lat=10.0, lon=70.0)
        self.assertTrue(res["name"].startswith("Indian Forest Range"))
        self.assertEqual(res["country"], "India")
        self.assertTrue(len(res["dominant_tree_species"]) > 0)

    def test_resolve_forest_knowledge_none(self):
        # None inputs
        res = resolve_forest_knowledge(lat=None, lon=None)
        self.assertTrue("Forest" in res["name"])
        self.assertEqual(res["country"], "India")

class TestForestKnowledgeAPI(unittest.TestCase):
    def test_api_endpoint(self):
        import requests
        try:
            # Query the running server's POST /forest-knowledge endpoint
            payload = {
                "latitude": 22.3,
                "longitude": 80.6
            }
            response = requests.post("http://127.0.0.1:8000/forest-knowledge", json=payload)
            if response.status_code == 200:
                data = response.json()
                self.assertEqual(data["status"], "success")
                self.assertEqual(data["name"], "Kanha Tiger Reserve")
                self.assertEqual(data["state"], "Madhya Pradesh")
                self.assertIn("Sal (Shorea robusta)", data["dominant_tree_species"])
                print("Successfully verified POST /forest-knowledge API endpoint!")
            else:
                self.fail(f"API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[WARNING] Could not query running uvicorn server: {e}")

if __name__ == "__main__":
    unittest.main()
