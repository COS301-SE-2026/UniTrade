FROM python:3.11-slim


RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1001 clipuser \
    && useradd --uid 1001 --gid clipuser --shell /bin/bash --create-home clipuser
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV HF_HOME=/home/clipuser/.cache/huggingface
RUN mkdir -p ${HF_HOME} && chown -R clipuser:clipuser ${HF_HOME}
USER clipuser

COPY --chown=clipuser:clipuser download_model.py .
RUN python download_model.py 

COPY  --chown=clipuser:clipuser main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
