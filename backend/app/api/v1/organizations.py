from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_current_user, require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.enums import OrganizationType
from backend.app.models.modit import Organization, OrganizationInvitation, OrganizationTeam, OrganizationTeamMember, OrganizationUser
from backend.app.models.user import User
from backend.app.schemas.platform import (
    OrganizationCreate,
    OrganizationInvitationCreate,
    OrganizationInvitationRead,
    OrganizationMemberCreate,
    OrganizationMemberRead,
    OrganizationRead,
    OrganizationTeamCreate,
    OrganizationTeamRead,
    StandardResponse,
    OrganizationUpdate,
)
from backend.app.services.audit_service import create_audit_log

router = APIRouter()


async def _get_organization(session: AsyncSession, organization_id: str) -> Organization | None:
    result = await session.execute(
        select(Organization)
        .options(
            selectinload(Organization.users),
            selectinload(Organization.teams),
            selectinload(Organization.invitations),
        )
        .where(Organization.id == organization_id)
    )
    return result.scalar_one_or_none()


async def _require_member(session: AsyncSession, organization_id: str, user_id: str) -> OrganizationUser:
    result = await session.execute(
        select(OrganizationUser).where(
            OrganizationUser.organization_id == organization_id,
            OrganizationUser.user_id == user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an organization member")
    return membership


@router.get("/organizations", response_model=list[OrganizationRead], dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_READ))])
async def list_organizations(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[OrganizationRead]:
    result = await db.execute(
        select(Organization)
        .join(OrganizationUser, OrganizationUser.organization_id == Organization.id)
        .where(OrganizationUser.user_id == user.id)
        .order_by(Organization.created_at.desc())
    )
    return [OrganizationRead.model_validate(item) for item in result.scalars().all()]


@router.post("/organizations", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_MANAGE))])
async def create_organization(payload: OrganizationCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> OrganizationRead:
    organization = Organization(
        owner_user_id=user.id,
        name=payload.name,
        legal_name=payload.legal_name,
        organization_type=payload.organization_type,
        billing_email=payload.billing_email,
        settings_json=payload.settings_json,
        is_active=True,
    )
    db.add(organization)
    await db.flush()
    db.add(
        OrganizationUser(
            organization_id=organization.id,
            user_id=user.id,
            role_name="owner",
            is_primary=True,
        )
    )
    await create_audit_log(
        db,
        product_code="modit",
        actor_user_id=user.id,
        action="organization.create",
        entity_type="organization",
        entity_id=organization.id,
        after={"name": organization.name},
    )
    await db.commit()
    await db.refresh(organization)
    return OrganizationRead.model_validate(organization)


@router.get("/organizations/{organization_id}", response_model=OrganizationRead, dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_READ))])
async def read_organization(organization_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> OrganizationRead:
    await _require_member(db, organization_id, user.id)
    organization = await _get_organization(db, organization_id)
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return OrganizationRead.model_validate(organization)


@router.patch("/organizations/{organization_id}", response_model=OrganizationRead, dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_MANAGE))])
async def update_organization(organization_id: str, payload: OrganizationUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> OrganizationRead:
    organization = await db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    await _require_member(db, organization_id, user.id)
    if payload.name is not None:
        organization.name = payload.name
    if payload.legal_name is not None:
        organization.legal_name = payload.legal_name
    if payload.billing_email is not None:
        organization.billing_email = payload.billing_email
    if payload.settings_json is not None:
        organization.settings_json = payload.settings_json
    if payload.is_active is not None:
        organization.is_active = payload.is_active
    await db.commit()
    await db.refresh(organization)
    return OrganizationRead.model_validate(organization)


@router.delete("/organizations/{organization_id}", response_model=StandardResponse[str], dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_MANAGE))])
async def delete_organization(organization_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    organization = await db.get(Organization, organization_id)
    if organization is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    await _require_member(db, organization_id, user.id)
    await db.delete(organization)
    await db.commit()
    return StandardResponse(message="Organization deleted", data=organization_id)


@router.get("/organizations/{organization_id}/members", response_model=list[OrganizationMemberRead])
async def list_members(organization_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[OrganizationMemberRead]:
    await _require_member(db, organization_id, user.id)
    result = await db.execute(select(OrganizationUser).where(OrganizationUser.organization_id == organization_id))
    return [OrganizationMemberRead.model_validate(item) for item in result.scalars().all()]


@router.post("/organizations/{organization_id}/members", response_model=OrganizationMemberRead, dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_MEMBER_MANAGE))])
async def add_member(organization_id: str, payload: OrganizationMemberCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> OrganizationMemberRead:
    await _require_member(db, organization_id, user.id)
    membership = OrganizationUser(
        organization_id=organization_id,
        user_id=payload.user_id,
        role_name=payload.role_name,
        designation=payload.designation,
        is_primary=payload.is_primary,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return OrganizationMemberRead.model_validate(membership)


@router.delete("/organizations/{organization_id}/members/{membership_id}", response_model=StandardResponse[str], dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_MEMBER_MANAGE))])
async def remove_member(organization_id: str, membership_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    await _require_member(db, organization_id, user.id)
    membership = await db.get(OrganizationUser, membership_id)
    if membership is None or membership.organization_id != organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
    await db.delete(membership)
    await db.commit()
    return StandardResponse(message="Member removed", data=membership_id)


@router.get("/organizations/{organization_id}/teams", response_model=list[OrganizationTeamRead])
async def list_teams(organization_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[OrganizationTeamRead]:
    await _require_member(db, organization_id, user.id)
    result = await db.execute(select(OrganizationTeam).where(OrganizationTeam.organization_id == organization_id))
    return [OrganizationTeamRead.model_validate(item) for item in result.scalars().all()]


@router.post("/organizations/{organization_id}/teams", response_model=OrganizationTeamRead, dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_TEAM_MANAGE))])
async def create_team(organization_id: str, payload: OrganizationTeamCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> OrganizationTeamRead:
    await _require_member(db, organization_id, user.id)
    team = OrganizationTeam(
        organization_id=organization_id,
        created_by_user_id=user.id,
        name=payload.name,
        code=payload.code,
        description=payload.description,
        is_default=payload.is_default,
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return OrganizationTeamRead.model_validate(team)


@router.post("/organizations/{organization_id}/invitations", response_model=OrganizationInvitationRead, dependencies=[Depends(require_permission(PermissionName.ORGANIZATION_INVITE_MANAGE))])
async def create_invitation(organization_id: str, payload: OrganizationInvitationCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> OrganizationInvitationRead:
    await _require_member(db, organization_id, user.id)
    token = payload.expires_at or (datetime.now(timezone.utc) + timedelta(days=7))
    invitation = OrganizationInvitation(
        organization_id=organization_id,
        team_id=payload.team_id,
        invited_by_user_id=user.id,
        email=payload.email.lower(),
        role_name=payload.role_name,
        token_hash=sha256(token_urlsafe(32).encode("utf-8")).hexdigest(),
        status="pending",
        expires_at=token,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    return OrganizationInvitationRead.model_validate(invitation)


@router.post("/organizations/invitations/{token}/accept", response_model=StandardResponse[str])
async def accept_invitation(token: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    token_hash = sha256(token.encode("utf-8")).hexdigest()
    result = await db.execute(select(OrganizationInvitation).where(OrganizationInvitation.token_hash == token_hash))
    invitation = result.scalar_one_or_none()
    if invitation is None or invitation.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation invalid or expired")
    membership = OrganizationUser(
        organization_id=invitation.organization_id,
        user_id=user.id,
        role_name=invitation.role_name,
        is_primary=False,
    )
    db.add(membership)
    invitation.status = "accepted"
    invitation.accepted_at = datetime.now(timezone.utc)
    await db.commit()
    return StandardResponse(message="Invitation accepted", data=invitation.organization_id)
