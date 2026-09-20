FROM python:3.11-slim


RUN groupadd --gid 1001 clipuser \
    && useradd --uid 1001 --gid clipuser --shell /bin/bash --create-home clipuser
WORKDIR /app

COPY --chown=root:root --chmod=0444 requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --only-binary :all: -r requirements.txt

ENV HF_HOME=/home/clipuser/.cache/huggingface
RUN mkdir -p ${HF_HOME} && chown -R clipuser:clipuser ${HF_HOME}
USER clipuser

COPY --chown=root:root --chmod=0444 download_model.py .
RUN python download_model.py 

COPY  --chown=root:root --chmod=0444 main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
