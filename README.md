# 🇹🇷 Turkish Text Classifier

A modern, full-stack web application for Turkish text classification using state-of-the-art transformer models like BERT and ModernBERT.

![Turkish Text Classifier](https://img.shields.io/badge/Language-Turkish-red)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-green)
![React](https://img.shields.io/badge/React-18.0-blue)
![Python](https://img.shields.io/badge/Python-3.10+-blue)

## ✨ Features

### 🎯 **Core Functionality**
- **Multi-Model Support**: Easily add any Hugging Face transformer model
- **Single & Batch Prediction**: Classify one text or multiple texts at once
- **Model Comparison**: Compare results from different models side-by-side
- **Real-time Inference**: Fast predictions with lazy model loading

### 🎨 **Modern UI**
- **Dark/Light Mode**: Beautiful themes with smooth transitions
- **Responsive Design**: Works perfectly on desktop and mobile
- **Interactive Results**: Top-K predictions with confidence scores
- **Sample Texts**: Quick testing with pre-built examples
- **Batch Analysis**: Table view with category distribution charts

### 🔧 **Technical Features**
- **FastAPI Backend**: High-performance async API
- **React Frontend**: Modern, component-based UI
- **Docker Support**: Easy deployment and scaling
- **Model Registry**: YAML-based configuration system
- **Metrics & Monitoring**: Built-in performance tracking

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- Your trained models (BERT, ModernBERT, etc.)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/Turkish-Text-Classifier.git
cd Turkish-Text-Classifier
```

### 2. Setup Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Add your models to the models/ directory
# models/
# ├── your_model_name/
# │   ├── config.json
# │   ├── pytorch_model.bin (or model.safetensors)
# │   ├── tokenizer.json
# │   └── ...
```

### 3. Configure Models
Edit `config/models.yaml`:
```yaml
models:
  - name: bert512
    path: ./models/bert512_model
    max_length: 512
    device: auto
  - name: modernbert2048
    path: ./models/modernbert2048_model
    max_length: 2048
    device: auto
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run build
cd ..
cp -r frontend/dist/* app/static/
```

### 5. Run Application
```bash
# Using Makefile
make run

# Or directly
uvicorn app.main:app --reload --port 8000
```

Visit: http://localhost:8000

## 🐳 Docker Deployment

```bash
# Build image
make docker-build

# Run container
make docker-run

# Or manually
docker build -t turkish-text-classifier .
docker run -p 8000:8000 turkish-text-classifier
```

## 📊 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /models` - List available models
- `GET /labels?model=bert512` - Get model labels
- `POST /predict` - Single text prediction
- `POST /predict/batch` - Batch text prediction
- `GET /metrics` - Performance metrics

### Example Usage
```bash
# Single prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Merkez Bankası faiz kararını açıkladı.", "model": "bert512"}'

# Batch prediction
curl -X POST http://localhost:8000/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Text 1", "Text 2"], "model": "bert512"}'
```

## 🏗️ Architecture

```
├── app/                    # FastAPI backend
│   ├── main.py            # API endpoints
│   ├── config.py          # Configuration
│   ├── registry.py        # Model management
│   ├── inference.py       # Prediction logic
│   ├── schemas.py         # Pydantic models
│   ├── metrics.py         # Performance tracking
│   └── static/            # Built frontend files
├── config/
│   └── models.yaml        # Model configurations
├── models/                # Your trained models
├── frontend/              # React frontend source
├── tests/                 # Test files
├── Dockerfile            # Container configuration
├── requirements.txt      # Python dependencies
└── Makefile             # Development commands
```

## 🎯 Adding New Models

1. **Save your model** using `save_pretrained()`:
```python
model.save_pretrained("./models/my_new_model")
tokenizer.save_pretrained("./models/my_new_model")
```

2. **Add to configuration**:
```yaml
models:
  - name: my_new_model
    path: ./models/my_new_model
    max_length: 512
    device: auto
```

3. **Restart the application** - that's it! 🎉

## 🧪 Testing

```bash
# Run tests
make test

# Or with pytest
pytest tests/ -v
```

## 📈 Performance

- **Lazy Loading**: Models loaded only when first used
- **GPU Support**: Automatic CUDA detection and usage
- **Batch Processing**: Efficient multi-text inference
- **Caching**: Smart model and result caching
- **Async API**: Non-blocking request handling

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev  # Development server with hot reload
```

### Backend Development
```bash
uvicorn app.main:app --reload  # Auto-reload on changes
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Hugging Face Transformers](https://huggingface.co/transformers/) for the amazing model library
- [FastAPI](https://fastapi.tiangolo.com/) for the high-performance web framework
- [React](https://reactjs.org/) for the frontend framework

## 📧 Contact

For questions and support, please open an issue on GitHub.

---

**Made with ❤️ for the Turkish NLP community**
