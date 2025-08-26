run:
	uvicorn app.main:app --reload --port 8000

docker-build:
	docker build -t tr-news-api:latest .

docker-run:
	docker run --rm -p 8000:8000 tr-news-api:latest

install:
	pip install -r requirements.txt

test:
	pytest tests/ -v

clean:
	find . -type d -name __pycache__ -delete
	find . -type f -name "*.pyc" -delete
