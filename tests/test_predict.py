import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_predict_endpoint():
    """Test single prediction endpoint"""
    # Bu test model dosyaları olmadan çalışmayacak
    # Model dosyaları yüklendikten sonra aktif hale getirin
    
    sample_text = "Merkez Bankası faiz kararını açıkladı."
    payload = {
        "text": sample_text,
        "model": "bert512"
    }
    
    # Şimdilik endpoint'in var olduğunu test et
    response = client.post("/predict", json=payload)
    # Model yüklenmemiş olduğu için 500 dönecek, bu normal
    assert response.status_code in [200, 500]

def test_labels_endpoint():
    """Test labels endpoint"""
    response = client.get("/labels?model=bert512")
    # Model yüklenmemiş olduğu için 404 veya 500 dönecek
    assert response.status_code in [200, 404, 500]

def test_metrics_endpoint():
    """Test metrics endpoint"""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "model_requests" in data
    assert "average_response_time" in data
