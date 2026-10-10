import hashlib
import hmac
import os
import secrets
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, Response, status

SESSION_COOKIE = "session"

# OWASP minimum for scrypt; needs ~128 MB, above hashlib's default maxmem.
SCRYPT_N, SCRYPT_R, SCRYPT_P = 2**17, 8, 1
SCRYPT_MAXMEM = 2**28


def _scrypt(password: str, salt: bytes, n: int, r: int, p: int) -> bytes:
    return hashlib.scrypt(
        password.encode(), salt=salt, n=n, r=r, p=p, dklen=64, maxmem=SCRYPT_MAXMEM
    )


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = _scrypt(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P)
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    _, n, r, p, salt, digest = stored.split("$")
    candidate = _scrypt(password, bytes.fromhex(salt), int(n), int(r), int(p))
    return hmac.compare_digest(candidate, bytes.fromhex(digest))


# Sessions live in memory (token -> user id); a restart signs everyone out.
def get_sessions(request: Request) -> dict[str, int]:
    return request.app.state.sessions


Sessions = Annotated[dict[str, int], Depends(get_sessions)]
SessionToken = Annotated[str | None, Cookie(alias=SESSION_COOKIE)]


def start_session(response: Response, sessions: dict[str, int], user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    sessions[token] = user_id
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax")


def end_session(response: Response, sessions: dict[str, int], token: str | None) -> None:
    sessions.pop(token, None)
    response.delete_cookie(SESSION_COOKIE)


def current_user_id(sessions: Sessions, token: SessionToken = None) -> int:
    if token not in sessions:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not signed in")
    return sessions[token]


CurrentUserId = Annotated[int, Depends(current_user_id)]
