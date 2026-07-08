"""pdf-api — orquestador de PDFs white-label para NÚCLEO by raisen.

Flujo: JWT verificado (JWKS) → fetch datos (filtro tenant explícito) → Jinja2 →
Gotenberg (HTML→PDF) → upload tenant-pdfs → signed URL.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import evaluation, invoice, payroll, quote, report

app = FastAPI(title="NÚCLEO pdf-api", docs_url=None, redoc_url=None)

# CORS: parsear ALLOWED_ORIGINS (CSV) aquí mismo. Normalizamos slash final — el header
# Origin del navegador nunca lo lleva, y "https://x.app/" != "https://x.app" bloqueaba todo.
# Sin la variable → ["*"] (debug temporal; restringir cuando funcione).
origins = os.environ.get("ALLOWED_ORIGINS", "").split(",")
origins = [o.strip().rstrip("/") for o in origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoice.router)
app.include_router(quote.router)
app.include_router(payroll.router)
app.include_router(report.router)
app.include_router(evaluation.router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
