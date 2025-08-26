import yaml
import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ModelBundle:
    def __init__(self, name: str, path: str, max_length: int, device: str):
        self.name = name
        self.path = path
        self.max_length = max_length
        self.device = self._resolve_device(device)
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model: Optional[AutoModelForSequenceClassification] = None
        self.id2label: Optional[Dict[int, str]] = None
        self._loaded = False
    
    def _resolve_device(self, device: str) -> str:
        """Device seçimi: auto -> cuda varsa cuda:0, yoksa cpu"""
        if device == "auto":
            return "cuda:0" if torch.cuda.is_available() else "cpu"
        return device
    
    def load(self):
        """Lazy loading: İlk istek geldiğinde model ve tokenizer yüklenir"""
        if self._loaded:
            return
        
        try:
            logger.info(f"Loading model {self.name} from {self.path}")
            
            # Tokenizer yükle
            self.tokenizer = AutoTokenizer.from_pretrained(self.path)
            
            # Model yükle
            self.model = AutoModelForSequenceClassification.from_pretrained(self.path)
            self.model.to(self.device)
            self.model.eval()
            
            # id2label mapping'i al
            if hasattr(self.model.config, 'id2label'):
                self.id2label = self.model.config.id2label
            else:
                # Fallback: range(num_labels)
                num_labels = self.model.config.num_labels
                self.id2label = {i: f"LABEL_{i}" for i in range(num_labels)}
            
            self._loaded = True
            logger.info(f"Model {self.name} loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Error loading model {self.name}: {e}")
            raise

class ModelRegistry:
    def __init__(self):
        self.models: Dict[str, ModelBundle] = {}
    
    def load_registry(self, models_yaml_path: str):
        """YAML okur, her kayıt için lazy loader nesnesi oluşturur"""
        try:
            with open(models_yaml_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            for model_config in config['models']:
                name = model_config['name']
                path = model_config['path']
                max_length = model_config['max_length']
                device = model_config.get('device', 'auto')
                
                bundle = ModelBundle(name, path, max_length, device)
                self.models[name] = bundle
                
            logger.info(f"Loaded {len(self.models)} model configurations")
            
        except Exception as e:
            logger.error(f"Error loading model registry: {e}")
            raise
    
    def get_model(self, name: str) -> ModelBundle:
        """Model bundle'ını döndür, lazy load yapar"""
        if name not in self.models:
            raise ValueError(f"Model '{name}' not found in registry")
        
        bundle = self.models[name]
        if not bundle._loaded:
            bundle.load()
        
        return bundle
    
    def list_models(self) -> list:
        """Mevcut model isimlerini listele"""
        return list(self.models.keys())

# Global registry instance
registry = ModelRegistry()
