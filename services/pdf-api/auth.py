"""Verificación del JWT de Supabase (JWKS) y extracción de tenant_id/rol.

El tenant SIEMPRE sale del token verificado, nunca del body/query.
Roles con acceso a PDFs: superadmin/ceo/coo (mismo criterio que can_access_module
para billing/quotes/payroll/reports — módulos ceo/coo en NÚCLEO).
"""
import time

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt

from config import JWKS_URL

_bearer = HTTPBearer(auto_error=True)
_jwks_cache: dict = {"keys": None, "at": 0.0}
_JWKS_TTL = 600  # 10 min

PDF_ROLES = {"superadmin", "ceo", "coo"}


async def _jwks() -> dict:
    if _jwks_cache["keys"] is None or time.time() - _jwks_cache["at"] > _JWKS_TTL:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(JWKS_URL)
            resp.raise_for_status()
            _jwks_cache["keys"] = resp.json()
            _jwks_cache["at"] = time.time()
    return _jwks_cache["keys"]


class Actor:
    def __init__(self, sub: str, tenant_id: str, role: str):
        self.sub = sub
        self.tenant_id = tenant_id
        self.role = role


async def current_actor(cred: HTTPAuthorizationCredentials = Depends(_bearer)) -> Actor:
    token = cred.credentials
    try:
        keys = await _jwks()
        claims = jwt.decode(token, keys, algorithms=["ES256", "RS256"], options={"verify_aud": False})
    except Exception as exc:  # firma inválida, expirado, JWKS caído
        raise HTTPException(status_code=401, detail="Token inválido") from exc

    tenant_id = claims.get("tenant_id") or (claims.get("app_metadata") or {}).get("tenant_id")
    role = claims.get("user_role") or (claims.get("app_metadata") or {}).get("user_role") or ""
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Token sin tenant")
    if role not in PDF_ROLES:
        raise HTTPException(status_code=403, detail="No autorizado")
    return Actor(sub=claims.get("sub", ""), tenant_id=str(tenant_id), role=role)
