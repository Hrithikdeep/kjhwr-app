FROM python:3.13-slim

# Show log lines straight away, and do not write .pyc files into the image
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /code

# Install dependencies first so Docker can cache this layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Run as a normal user instead of root
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# 0.0.0.0 makes the server reachable from outside the container.
# There is no --reload here: that flag is for development only.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
