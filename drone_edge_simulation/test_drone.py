import os
import requests

def test_simulation_service():
    print("Testing Drone/Edge AI Simulation microservice...")
    url = "http://127.0.0.1:8001/api/v1/edge/simulate-drone"
    
    # We can create a dummy 2x2 image file for test purposes
    dummy_img_path = "test_dummy.png"
    import cv2
    import numpy as np
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    cv2.imwrite(dummy_img_path, img)
    
    try:
        with open(dummy_img_path, 'rb') as f:
            response = requests.post(url, files={'file': f})
        
        print("Status code:", response.status_code)
        print("Response JSON:", response.json())
        
        if response.status_code == 200:
            print("[SUCCESS] Microservice responded successfully!")
        else:
            print("[FAILURE] Failed to query microservice.")
    except Exception as e:
        print("[WARNING] Could not query microservice (make sure the uvicorn server is running on port 8001):", e)
    finally:
        if os.path.exists(dummy_img_path):
            os.remove(dummy_img_path)

if __name__ == "__main__":
    test_simulation_service()
