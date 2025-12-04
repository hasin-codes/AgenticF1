#!/usr/bin/env python3
"""
Test script to verify system prompt functionality
"""

import requests
import json

def test_system_prompt():
    """Test that the system prompt is correctly added to chat requests"""
    
    # Test API endpoint
    url = "http://localhost:8000/api/chat"
    
    # Test payload without system message
    payload = {
        "messages": [
            {"role": "user", "content": "Hello, who are you?"}
        ],
        "model": "glm-4.6",
        "stream": False
    }
    
    try:
        print("Testing system prompt functionality...")
        print(f"Sending request to: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print("\nResponse received:")
            print(json.dumps(result, indent=2))
            
            # Check if response contains the expected behavior
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0].get("message", {}).get("content", "")
                
                # Check if the AI identifies as alonso99ai
                if "alonso99ai" in content.lower():
                    print("\n[SUCCESS] System prompt working: AI identifies as alonso99ai")
                else:
                    print("\n[FAIL] System prompt may not be working: AI doesn't identify as alonso99ai")
                    
                    # Check if the AI ends with Khaliabali
                    if "khaliabali" in content.lower():
                        print("[SUCCESS] System prompt working: AI ends with Khaliabali")
                    else:
                        print("[FAIL] System prompt may not be working: AI doesn't end with Khaliabali")
            else:
                print("\n❌ Unexpected response format")
        else:
            print(f"\n[FAIL] Request failed with status code: {response.status_code}")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n[FAIL] Connection error: Make sure the backend server is running on localhost:8000")
    except Exception as e:
        print(f"\n[FAIL] Error: {str(e)}")

if __name__ == "__main__":
    test_system_prompt()