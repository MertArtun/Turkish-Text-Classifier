# Cursor Rules — TR News Classifier (FastAPI + UI)

## Amaç
- Var olan **iki modeli** (BERT-512, ModernBERT-2048) hemen servis et.
- Yarın eğiteceğin yeni modelleri **dosya düzeni bozulmadan** kolayca ekleyebil.
- Basit bir **web arayüzü** ile metin gir → model seç → sonucu gör.
- Loglama, metrikler, test, Docker, kısa demo akışı.

## Yığın
- **Backend:** FastAPI (Python 3.10+), Uvicorn, Pydantic v2
- **ML:** transformers, torch (CUDA varsa kullan)
- **Ön yüz (hızlı):** Vite + React (alternatif: tek sayfa HTMX)
- **Paketleme:** Docker
- **İzleme:** basic logging + /metrics (JSON)

## Dizin Yapısı

```
.
├─ app/
│  ├─ main.py               # FastAPI entry
│  ├─ config.py             # env & paths
│  ├─ registry.py           # model registry loader
│  ├─ inference.py          # tokenize/predict utils
│  ├─ schemas.py            # Pydantic models
│  ├─ metrics.py            # simple counters/timers
│  └─ static/               # mini UI (built assets)
├─ models/
│  ├─ bert512_model/        # mevcut model (senin kaydettiğin)
│  └─ modernbert2048_model/ # mevcut model
├─ config/
│  └─ models.yaml           # model kayıtları (ad, path, max_len, device)
├─ tests/
│  ├─ test_health.py
│  ├─ test_predict.py
│  └─ sample_texts.txt
├─ frontend/                # (Vite + React) kaynak kod
├─ Dockerfile
├─ requirements.txt
├─ Makefile
└─ README.md

```

## models.yaml (örnek)
```yaml
models:
  - name: bert512
    path: ./models/bert512_model
    max_length: 512
    device: auto      # "cuda", "cpu" veya "auto"
  - name: modernbert2048
    path: ./models/modernbert2048_model
    max_length: 2048
    device: auto
```

> Yarın yeni modelleri böyle ekle: `name`, `path`, `max_length`. `save_pretrained()` ile kaydettiğin klasörü buraya yazman yeterli. `id2label`/`label2id` zaten `config.json` içinde.

## app/config.py

* ENV: `MODEL_CONFIG=./config/models.yaml`, `PORT=8000`, `CORS_ORIGINS=*`
* Varsayılanları belirle; `.env` destekle (opsiyonel).

## app/registry.py

* `load_registry(models_yaml)`: YAML okur, her kayıt için **lazy loader** nesnesi oluşturur.
* **Lazy load**: İlk istek geldiğinde `AutoTokenizer` + `AutoModelForSequenceClassification` yüklenir.
* **Device seçimi**: `auto` → `cuda` varsa `cuda:0`, yoksa `cpu`.
* **Cache**: (name → {tokenizer, model, max_len, id2label}) sözlük.

## app/inference.py

* `predict_one(model_bundle, text)`:

  * `tokenizer(text, truncation=True, max_length, return_tensors="pt")`
  * `with torch.no_grad()` → logits → softmax
  * `label = id2label[np.argmax(proba)]`, `score = max(proba)`
* `predict_batch(model_bundle, texts: List[str])` aynı mantıkla toplu.
* **Not:** `id2label` yoksa `range(num_labels)` fallback.

## app/schemas.py

```py
class PredictIn(BaseModel):
  text: str
  model: str = "bert512"

class PredictBatchIn(BaseModel):
  texts: List[str]
  model: str = "bert512"

class PredictOut(BaseModel):
  label: str
  score: float
  probs: Optional[List[float]] = None
```

## app/metrics.py

* Basit sayaçlar: toplam istek, model bazlı istek, ortalama süre.
* `/metrics` endpoint’inde JSON döndür.

## app/main.py (endpointler)

* `GET /health`: `{status:"ok"}`
* `GET /labels?model=bert512`: modelin `id2label` listesini döndür.
* `POST /predict`: `PredictIn` alır → tek örnek döndürür.
* `POST /predict/batch`: `PredictBatchIn` → liste döndürür.
* `GET /metrics`: basit metrikler.
* CORS açık (gerekirse domain kısıtla).
* Statik dosyadan **mini UI** servis et: `GET /` → `index.html`.

## Mini UI (frontend/)

* **React + Vite**:

  * Dropdown: model seç (`/labels` ile doldur).
  * Textarea: metin gir.
  * “Tahmin Et” → `/predict` çağır.
  * Sonuç kartı: `label`, `score`, top-3 bar gösterimi (opsiyonel).
* Build sonrası `frontend/dist` → `app/static/` altına kopyala.

## requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
pydantic==2.7.0
pyyaml==6.0.1
transformers>=4.48.0
torch>=2.1.0
numpy
```

## Dockerfile (basit)

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY config ./config
COPY models ./models
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host","0.0.0.0", "--port","8000"]
```

## Makefile

```
run:
\tuvicorn app.main:app --reload --port 8000

docker-build:
\tdocker build -t tr-news-api:latest .

docker-run:
\tdocker run --rm -p 8000:8000 tr-news-api:latest
```

## Testler (pytest)

* `test_health.py`: `/health == 200`
* `test_predict.py`: kısa bir metinle `/predict` 200 ve `label` alanı dolu.
* `sample_texts.txt`: smoke test input’ları.

## Kabul Kriterleri

* [ ] `GET /health`, `GET /labels`, `POST /predict`, `POST /predict/batch`, `GET /metrics` **çalışır**.
* [ ] UI üzerinden metin gir → model seç → sonuç gelir.
* [ ] **Yeni model eklemek** için sadece `models.yaml` güncellemek yeterli.
* [ ] `id2label` modelden okunuyor (config.json); yoksa fallback uygulanıyor.
* [ ] GPU varsa otomatik kullanılıyor; yoksa CPU ile çalışıyor.

## Yol Haritası / To-Do

1. [ ] `config/models.yaml` oluştur, mevcut iki modeli ekle (bert512_model, modernbert2048_model).
2. [ ] `app/` dosyalarını oluştur (main.py, registry.py, inference.py, schemas.py, metrics.py).
3. [ ] `frontend/` hızlı UI yaz, build et (`npm create vite@latest`, React + fetch).
4. [ ] `requirements.txt`, `Dockerfile`, `Makefile` ekle.
5. [ ] Lokal çalıştır (`make run`), cURL ile doğrula.
6. [ ] Basit e2e test (pytest) ekle.
7. [ ] Yarın yeni eğittiğin modelleri `models.yaml`’a ekle; **kod değişikliği olmadan** servis et.
8. [ ] (Opsiyonel) `/predict`’e `return_probs=true` query paramı ekle → UI’de top-K göster.
9. [ ] (Opsiyonel) Hız benchmark’ı endpoint’i ekle (N örnek infer süresi).

## Hızlı cURL

```bash
curl -X POST http://localhost:8000/predict \
 -H "Content-Type: application/json" \
 -d '{"text":"Merkez Bankası faiz kararı...", "model":"bert512"}'
```

## Notlar / İpuçları

* ModernBERT için `max_length=2048` → `padding=False` + `truncation=True`.
* `save_pretrained` ile kaydettiğin modellerde `id2label/label2id` **gömülü**; direkt kullan.
* İlk inference gecikmesi normal (lazy load). Sonraki istekler hızlı.
* Colab’da deneyimliyorsan, `ngrok` veya `cloudflared` ile dışa açabilirsin (demo için).


