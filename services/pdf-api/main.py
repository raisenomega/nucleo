"""pdf-api — orquestador de PDFs white-label para NÚCLEO by raisen.

Flujo: JWT verificado (JWKS) → fetch datos (filtro tenant explícito) → Jinja2 →
Gotenberg (HTML→PDF) → upload tenant-pdfs → signed URL.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS
from routes import invoice, payroll, quote, report

app = FastAPI(title="NÚCLEO pdf-api", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(invoice.router)
app.include_router(quote.router)
app.include_router(payroll.router)
app.include_router(report.router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
