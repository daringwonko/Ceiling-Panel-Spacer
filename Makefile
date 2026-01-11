# Ceiling Panel Calculator - Makefile
# Common commands for development and deployment

.PHONY: help install dev test lint build docker-build docker-up docker-down clean

# Default target
help:
	@echo "Ceiling Panel Calculator - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install Python dependencies"
	@echo "  make dev        - Run development server"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-up      - Start Docker containers"
	@echo "  make docker-down    - Stop Docker containers"
	@echo "  make docker-logs    - View container logs"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-install  - Install frontend dependencies"
	@echo "  make frontend-dev      - Run frontend dev server"
	@echo "  make frontend-build    - Build frontend for production"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean      - Remove build artifacts"

# Development
install:
	pip install -r requirements.txt
	pip install -e .

dev:
	python -m api.app

test:
	pytest tests/ -v --cov=. --cov-report=term-missing

lint:
	flake8 . --max-line-length=100
	mypy . --ignore-missing-imports

format:
	black .
	isort .

# Docker
docker-build:
	docker build -t ceiling-calculator:latest .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-shell:
	docker-compose exec api /bin/sh

# Frontend
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

# Cleanup
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf build/ dist/ .coverage htmlcov/ 2>/dev/null || true

# Database migrations (if using alembic)
migrate:
	alembic upgrade head

migrate-create:
	alembic revision --autogenerate -m "$(message)"

# Production
prod-deploy:
	@echo "Deploying to production..."
	kubectl apply -f k8s/

# Kubernetes helpers
k8s-apply:
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/

k8s-status:
	kubectl get pods -n ceiling-calculator
	kubectl get services -n ceiling-calculator

k8s-logs:
	kubectl logs -f deployment/ceiling-api -n ceiling-calculator
