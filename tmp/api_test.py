import requests
import json

# Test the execute-code endpoint
response = requests.post(
    "http://localhost:8000/execute-code",
    headers={"Content-Type": "application/json"},
    json={"code": "print('Hello world')"}
)

print(f"Status code: {response.status_code}")
print(f"Response: {response.text}")

# If we get a 422 error, print detailed error
if response.status_code == 422:
    try:
        print("\nDetailed error:")
        error_detail = json.loads(response.text)
        print(json.dumps(error_detail, indent=2))
    except:
        print("Could not parse error response as JSON") 