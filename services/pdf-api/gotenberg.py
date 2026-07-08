"""Render Jinja2 + conversión HTML→PDF vía Gotenberg (/forms/chromium/convert/html)."""
from pathlib import Path

import httpx
from fastapi import HTTPException
from jinja2 import Environment, FileSystemLoader, select_autoescape

from config import GOTENBERG_URL

_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "templates"),
    autoescape=select_autoescape(["html"]),
)

# Footer nativo de Gotenberg: pageNumber/totalPages los inyecta Chromium al imprimir.
_FOOTER = """<html><head><style>
  p { font-family: Helvetica, Arial, sans-serif; font-size: 8px; color: #888;
      width: 100%; text-align: center; margin: 0; }
</style></head><body>
  <p><span class="pageNumber"></span> / <span class="totalPages"></span></p>
</body></html>"""


def render(template: str, context: dict) -> str:
    return _env.get_template(template).render(**context)


async def html_to_pdf(html: str) -> bytes:
    files = {
        "index.html": ("index.html", html.encode("utf-8"), "text/html"),
        "footer.html": ("footer.html", _FOOTER.encode("utf-8"), "text/html"),
    }
    data = {
        "paperWidth": "8.27",  # A4 en pulgadas
        "paperHeight": "11.7",
        "marginTop": "0.4",
        "marginBottom": "0.6",
        "marginLeft": "0.4",
        "marginRight": "0.4",
        "printBackground": "true",
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(f"{GOTENBERG_URL}/forms/chromium/convert/html", files=files, data=data)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Gotenberg falló ({resp.status_code})")
    return resp.content


async def render_pdf(template: str, context: dict) -> bytes:
    return await html_to_pdf(render(template, context))
