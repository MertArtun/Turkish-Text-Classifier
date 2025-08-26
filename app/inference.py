import torch
import numpy as np
from typing import List, Dict, Any
from .registry import ModelBundle
import logging

logger = logging.getLogger(__name__)

def predict_one(model_bundle: ModelBundle, text: str) -> Dict[str, Any]:
    """
    Tek metin için tahmin yap
    """
    try:
        # Tokenize
        inputs = model_bundle.tokenizer(
            text,
            truncation=True,
            max_length=model_bundle.max_length,
            return_tensors="pt",
            padding=False
        )
        
        # GPU'ya taşı
        inputs = {k: v.to(model_bundle.device) for k, v in inputs.items()}
        
        # Inference
        with torch.no_grad():
            outputs = model_bundle.model(**inputs)
            logits = outputs.logits
            
            # Softmax ile olasılıkları hesapla
            probs = torch.softmax(logits, dim=-1)
            probs_np = probs.cpu().numpy().flatten()
            
            # En yüksek olasılıklı label'ı bul
            predicted_id = np.argmax(probs_np)
            label = model_bundle.id2label[predicted_id]
            score = float(probs_np[predicted_id])
            
            return {
                "label": label,
                "score": score,
                "probs": probs_np.tolist()
            }
            
    except Exception as e:
        logger.error(f"Error in predict_one: {e}")
        raise

def predict_batch(model_bundle: ModelBundle, texts: List[str]) -> List[Dict[str, Any]]:
    """
    Toplu metin için tahmin yap
    """
    try:
        # Batch tokenize
        inputs = model_bundle.tokenizer(
            texts,
            truncation=True,
            max_length=model_bundle.max_length,
            return_tensors="pt",
            padding=True  # Batch için padding gerekli
        )
        
        # GPU'ya taşı
        inputs = {k: v.to(model_bundle.device) for k, v in inputs.items()}
        
        # Inference
        with torch.no_grad():
            outputs = model_bundle.model(**inputs)
            logits = outputs.logits
            
            # Softmax ile olasılıkları hesapla
            probs = torch.softmax(logits, dim=-1)
            probs_np = probs.cpu().numpy()
            
            results = []
            for i in range(len(texts)):
                predicted_id = np.argmax(probs_np[i])
                label = model_bundle.id2label[predicted_id]
                score = float(probs_np[i][predicted_id])
                
                results.append({
                    "label": label,
                    "score": score,
                    "probs": probs_np[i].tolist()
                })
            
            return results
            
    except Exception as e:
        logger.error(f"Error in predict_batch: {e}")
        raise
