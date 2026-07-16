"""pdf-api — orquestador de PDFs white-label para NÚCLEO by raisen.

Flujo: JWT verificado (JWKS) → fetch datos (filtro tenant explícito) → Jinja2 →
Gotenberg (HTML→PDF) → upload tenant-pdfs → signed URL.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGIN_REGEX
from routes import evaluation, expense, extraordinary, income, invoice, lead, payroll, quote, reconciliation, report, route, training

app = FastAPI(title="NÚCLEO pdf-api", docs_url=None, redoc_url=None)

# CORS white-label por PATRÓN (ver config._cors_origin_regex): cualquier subdominio de la plataforma
# o dominio custom de tenant (EXTRA_ALLOWED_ORIGINS) + previews Vercel + localhost. Así un tenant nuevo
# NO obliga a tocar Railway. El JWT (auth.py) es el gate real; CORS es capa extra.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(invoice.router)
app.include_router(quote.router)
app.include_router(payroll.router)
app.include_router(report.router)
app.include_router(evaluation.router)
for r in (income, expense, extraordinary, lead, route, training, reconciliation):
    app.include_router(r.router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
