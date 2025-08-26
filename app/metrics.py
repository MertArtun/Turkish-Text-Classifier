import time
from typing import Dict, Any
from collections import defaultdict
import threading

class MetricsCollector:
    def __init__(self):
        self.total_requests = 0
        self.model_requests = defaultdict(int)
        self.response_times = []
        self._lock = threading.Lock()
    
    def record_request(self, model_name: str, response_time: float):
        """İstek ve süre kaydı"""
        with self._lock:
            self.total_requests += 1
            self.model_requests[model_name] += 1
            self.response_times.append(response_time)
            
            # Memory'yi korumak için son 1000 süreyi tut
            if len(self.response_times) > 1000:
                self.response_times = self.response_times[-1000:]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Metrikleri döndür"""
        with self._lock:
            avg_response_time = (
                sum(self.response_times) / len(self.response_times) 
                if self.response_times else 0.0
            )
            
            return {
                "total_requests": self.total_requests,
                "model_requests": dict(self.model_requests),
                "average_response_time": round(avg_response_time, 4)
            }
    
    def reset(self):
        """Metrikleri sıfırla"""
        with self._lock:
            self.total_requests = 0
            self.model_requests.clear()
            self.response_times.clear()

# Global metrics instance
metrics = MetricsCollector()

class TimerContext:
    """Response time ölçmek için context manager"""
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            response_time = time.time() - self.start_time
            metrics.record_request(self.model_name, response_time)
