from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..crypto import encrypt, hint
from ..db import get_session
from ..models import Credential, CredentialKind, SyncRun
from ..schemas import CredentialIn, CredentialOut

router = APIRouter(prefix="/api/credentials", tags=["credentials"])

WARN_DAYS = 14


def to_out(cred: Credential) -> CredentialOut:
    days_left = (cred.expires_at - date.today()).days if cred.expires_at else None
    return CredentialOut(
        id=cred.id,
        kind=cred.kind,
        label=cred.label,
        hint=cred.hint,
        expires_at=cred.expires_at,
        days_left=days_left,
        last_check_at=cred.last_check_at,
        last_check_ok=cred.last_check_ok,
        last_check_message=cred.last_check_message,
    )


@router.get("", response_model=list[CredentialOut])
def list_credentials(account_id: int | None = None, session: Session = Depends(get_session)):
    query = select(Credential)
    if account_id:
        query = query.where(Credential.account_id == account_id)
    return [to_out(c) for c in session.exec(query).all()]


@router.post("", response_model=CredentialOut, status_code=201)
def create_credential(payload: CredentialIn, session: Session = Depends(get_session)):
    if not payload.secret.strip():
        raise HTTPException(400, "Пустой ключ")
    cred = Credential(
        account_id=payload.account_id,
        kind=payload.kind,
        label=payload.label or payload.kind.value.upper(),
        secret_encrypted=encrypt(payload.secret),
        hint=hint(payload.secret),
        expires_at=payload.expires_at,
    )
    session.add(cred)
    session.commit()
    session.refresh(cred)
    return to_out(cred)


@router.delete("/{credential_id}", status_code=204)
def delete_credential(credential_id: int, session: Session = Depends(get_session)):
    cred = session.get(Credential, credential_id)
    if cred is None:
        raise HTTPException(404, "Ключ не найден")
    session.delete(cred)
    session.commit()


@router.post("/{credential_id}/check", response_model=CredentialOut)
def check_credential(credential_id: int, session: Session = Depends(get_session)):
    cred = session.get(Credential, credential_id)
    if cred is None:
        raise HTTPException(404, "Ключ не найден")

    ok, message = _offline_check(cred)
    cred.last_check_at = datetime.utcnow()
    cred.last_check_ok = ok
    cred.last_check_message = message
    session.add(cred)
    session.add(SyncRun(account_id=cred.account_id, kind="credential_check", status="ok" if ok else "error", message=message))
    session.commit()
    session.refresh(cred)
    return to_out(cred)


def _offline_check(cred: Credential) -> tuple[bool, str]:
    if cred.expires_at and cred.expires_at < date.today():
        return False, "Срок действия ключа истёк — интеграция вернёт 401"
    if cred.expires_at and (cred.expires_at - date.today()).days <= WARN_DAYS:
        return True, f"Ключ действителен, но истекает через {(cred.expires_at - date.today()).days} дн."
    endpoints = {
        CredentialKind.wb: "GET /ping на хостах WB",
        CredentialKind.ozon: "POST /v1/roles",
        CredentialKind.gismt: "GET /api/v3/true-api/auth/key",
    }
    return True, f"Демо-режим: реальная проверка — {endpoints[cred.kind]}"
