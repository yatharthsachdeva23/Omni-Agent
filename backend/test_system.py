import asyncio
from starlette.testclient import TestClient
from app.main import app

def test_system():
    client = TestClient(app)
    
    print("Testing /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"Health Response: {res.json()}")

    print("\nTesting /api/catalog...")
    res = client.get("/api/catalog")
    assert res.status_code == 200
    catalog = res.json()
    print(f"Onboarded AI Models Count: {catalog['total_tools']}")

    print("\nTesting Track 1 (/api/advisor/suggest)...")
    res = client.post("/api/advisor/suggest", json={"prompt": "Build a financial algorithmic bot with python and math formulas"})
    assert res.status_code == 200
    advice = res.json()
    print(f"Decomposition Steps: {len(advice['task_decomposition'])}")
    print(f"Recommended Models: {[t['tool_name'] for t in advice['recommendations']]}")

    print("\nTesting Frontend HTML Delivery at / ...")
    res = client.get("/")
    assert res.status_code == 200
    assert "OmniTask AI" in res.text
    print("Frontend HTML rendered successfully!")

    print("\nALL SYSTEM TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_system()
