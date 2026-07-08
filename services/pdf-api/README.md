# pdf-api — Servicio de PDFs (NÚCLEO by raisen)

FastAPI que convierte datos de Supabase en PDFs white-label vía **Gotenberg** (Chromium).
Cada tenant recibe su marca: logo (bucket `brand`), colores (`settings`), nombre (`tenants.legal_name`).

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/pdf/invoice/{id}` | Factura → PDF (caché por `updated_at`) |
| POST | `/pdf/quote/{id}` | Cotización → PDF (caché por `updated_at`) |
| POST | `/pdf/payroll/{id}` | Recibo de pago → PDF |
| POST | `/pdf/report` | Reporte ad-hoc (body: title/kpis/tables/charts SVG) |
| GET | `/health` | Liveness |

Todos (salvo /health) requieren `Authorization: Bearer <jwt de Supabase>`.
El tenant sale del token verificado (JWKS) — nunca del body. Roles: superadmin/ceo/coo.

## Env vars
| Var | Descripción |
|---|---|
| `GOTENBERG_URL` | URL interna de Gotenberg (default `http://localhost:3000`) |
| `SUPABASE_URL` | URL del proyecto (requerida) |
| `SUPABASE_SECRET_KEY` | Service role key (requerida, NUNCA en el front) |
| `JWKS_URL` | Default `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `PDF_BUCKET` | Default `tenant-pdfs` |
| `BRAND_BUCKET` | Default `brand` (logo en `{tenant}/logo.png`) |
| `SIGNED_URL_TTL` | Segundos del signed URL (default 3600) |
| `ALLOWED_ORIGINS` | CSV de orígenes CORS |

## Desarrollo local
```bash
docker run --rm -p 3000:3000 gotenberg/gotenberg:8   # terminal 1
pip install -r requirements.txt                       # terminal 2
SUPABASE_URL=... SUPABASE_SECRET_KEY=... uvicorn main:app --reload --port 8000
curl localhost:8000/health
```

## Deploy (Railway — pendiente)
Proyecto con 2 servicios en red privada:
1. `gotenberg` — imagen `gotenberg/gotenberg:8` (sin exponer públicamente).
2. `pdf-api` — este directorio (Dockerfile), `GOTENBERG_URL=http://gotenberg.railway.internal:3000`.

## Estructura
```
main.py        app FastAPI + CORS + health
config.py      env vars
auth.py        verificación JWT (JWKS) → Actor{tenant_id, role}
gotenberg.py   Jinja2 render + POST /forms/chromium/convert/html (footer paginado)
storage.py     fetch filas/branding + upload tenant-pdfs + caché pdf_url
routes/        invoice, quote, payroll, report
templates/     base + invoice + quote + payslip + report
```
