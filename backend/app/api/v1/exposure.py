import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.exposure import ExposureCheck, IdentifierType
from app.schemas.all_schemas import (
    ExposureCheckCreate, ExposureVerifyRequest, ExposureCheckRead
)
from app.api.auth import require_permission
from app.connectors.hibp import hibp_connector

router = APIRouter(prefix="/exposure", tags=["exposure"])

@router.post("/checks", response_model=ExposureCheckRead)
async def create_exposure_check(
    data: ExposureCheckCreate,
    user: User = Depends(require_permission("exposure.check_own")),
    db: AsyncSession = Depends(get_db)
):
    val = data.identifier_value.strip().lower()
    
    # Check if the user is checking their own SSO email (auto-verified)
    is_auto_verified = (val == user.email.lower())
    token = None if is_auto_verified else secrets.token_hex(16)

    check = ExposureCheck(
        user_id=user.id,
        identifier_type=data.identifier_type,
        identifier_value=val,
        is_verified=is_auto_verified,
        verification_token=token,
        verification_method="SSO_OWNED" if is_auto_verified else "CHALLENGE_TOKEN"
    )

    if is_auto_verified:
        breaches = await hibp_connector.check_email_exposure(val)
        check.breach_count = len(breaches)
        check.breach_details = breaches
        check.recommendations = [
            "Activer l'authentification multifacteur (MFA/2FA) sur tous les comptes associés.",
            "Utiliser des mots de passe uniques générés par un gestionnaire de mots de passe.",
            "Surveiller les activités de session suspectes sur votre fournisseur d'identité."
        ]

    db.add(check)
    await db.commit()
    await db.refresh(check)
    return check

@router.post("/checks/{id}/verify", response_model=ExposureCheckRead)
async def verify_and_run_check(
    id: str,
    data: ExposureVerifyRequest,
    user: User = Depends(require_permission("exposure.check_own")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ExposureCheck).where(ExposureCheck.id == id, ExposureCheck.user_id == user.id)
    res = await db.execute(stmt)
    check = res.scalar_one_or_none()
    if not check:
        raise HTTPException(status_code=404, detail="Vérification introuvable.")

    if check.verification_token != data.verification_token:
        raise HTTPException(status_code=400, detail="Jeton de preuve invalide. Vérification échouée.")

    check.is_verified = True
    if check.identifier_type == IdentifierType.EMAIL.value:
        breaches = await hibp_connector.check_email_exposure(check.identifier_value)
    else:
        breaches = await hibp_connector.check_domain_exposure(check.identifier_value)

    check.breach_count = len(breaches)
    check.breach_details = breaches
    check.recommendations = [
        "Vérifier les politiques SPF, DKIM et DMARC du domaine.",
        "Sensibiliser les collaborateurs aux attaques de type phishing et credential stuffing.",
        "Révoquer les sessions actives suspectes."
    ]
    await db.commit()
    await db.refresh(check)
    return check

@router.get("/checks", response_model=List[ExposureCheckRead])
async def list_checks(
    user: User = Depends(require_permission("exposure.check_own")),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ExposureCheck).where(ExposureCheck.user_id == user.id).order_by(ExposureCheck.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()
