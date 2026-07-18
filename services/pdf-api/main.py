"""pdf-api — orquestador de PDFs white-label para NÚCLEO by raisen.

Flujo: JWT verificado (JWKS) → fetch datos (filtro tenant explícito) → Jinja2 →
Gotenberg (HTML→PDF) → upload tenant-pdfs → signed URL.
"""
from fastapi import FastAPI, Request
from starlette.concurrency import run_in_threadpool
from starlette.responses import Response

from cors import is_allowed_origin
from routes import asset, evaluation, expense, extraordinary, income, invoice, lead, payroll, quote, reconciliation, report, route, training

app = FastAPI(title="NÚCLEO pdf-api", docs_url=None, redoc_url=None)

_CORS = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "600",
}


# CORS white-label 100% dinámico: los orígenes permitidos salen de la tabla `tenants` en Supabase
# (ver cors.py). Un tenant nuevo = INSERT en tenants → CORS funciona solo, sin tocar Railway. El JWT
# (auth.py) es el gate real; esto es capa extra. Preflight sin match → 400 (el navegador lo bloquea).
@app.middleware("http")
async def dynamic_cors(request: Request, call_next):
    origin = request.headers.get("origin", "")
    allowed = await run_in_threadpool(is_allowed_origin, origin)
    preflight = request.method == "OPTIONS" and "access-control-request-method" in request.headers
    resp = Response(status_code=200 if allowed else 400) if preflight else await call_next(request)
    if allowed:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
        for k, v in _CORS.items():
            resp.headers[k] = v
    return resp

app.include_router(invoice.router)
app.include_router(quote.router)
app.include_router(payroll.router)
app.include_router(report.router)
app.include_router(evaluation.router)
for r in (income, expense, extraordinary, lead, route, training, reconciliation, asset):
    app.include_router(r.router)


@app.get("/health")
def health() -> dict:
    return {"ok": True}
