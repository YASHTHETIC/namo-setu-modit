from enum import Enum


class RoleName(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SUPPORT = "support"
    MANAGER = "manager"
    USER = "user"


class PermissionName(str, Enum):
    SYSTEM_HEALTH_READ = "system.health.read"
    USER_READ_SELF = "user.read.self"
    USER_UPDATE_SELF = "user.update.self"
    USER_MANAGE = "user.manage"
    USER_ADDRESS_MANAGE = "user.address.manage"
    USER_PROFILE_MANAGE = "user.profile.manage"
    FILE_UPLOAD = "file.upload"
    NOTIFICATION_READ = "notification.read"
    NOTIFICATION_MANAGE = "notification.manage"
    ORGANIZATION_READ = "organization.read"
    ORGANIZATION_MANAGE = "organization.manage"
    ORGANIZATION_MEMBER_MANAGE = "organization.member.manage"
    ORGANIZATION_TEAM_MANAGE = "organization.team.manage"
    ORGANIZATION_INVITE_MANAGE = "organization.invite.manage"
    ROLE_MANAGE = "role.manage"
    AUDIT_READ = "audit.read"
    AUDIT_WRITE = "audit.write"
    CONFIG_READ = "config.read"


ROLE_PERMISSIONS: dict[RoleName, set[PermissionName]] = {
    RoleName.SUPER_ADMIN: set(PermissionName),
    RoleName.ADMIN: {
        PermissionName.SYSTEM_HEALTH_READ,
        PermissionName.USER_READ_SELF,
        PermissionName.USER_UPDATE_SELF,
        PermissionName.USER_MANAGE,
        PermissionName.USER_ADDRESS_MANAGE,
        PermissionName.USER_PROFILE_MANAGE,
        PermissionName.FILE_UPLOAD,
        PermissionName.NOTIFICATION_READ,
        PermissionName.NOTIFICATION_MANAGE,
        PermissionName.ORGANIZATION_READ,
        PermissionName.ORGANIZATION_MANAGE,
        PermissionName.ORGANIZATION_MEMBER_MANAGE,
        PermissionName.ORGANIZATION_TEAM_MANAGE,
        PermissionName.ORGANIZATION_INVITE_MANAGE,
        PermissionName.ROLE_MANAGE,
        PermissionName.AUDIT_READ,
        PermissionName.AUDIT_WRITE,
        PermissionName.CONFIG_READ,
    },
    RoleName.SUPPORT: {
        PermissionName.SYSTEM_HEALTH_READ,
        PermissionName.USER_READ_SELF,
        PermissionName.NOTIFICATION_READ,
        PermissionName.AUDIT_READ,
    },
    RoleName.MANAGER: {
        PermissionName.SYSTEM_HEALTH_READ,
        PermissionName.USER_READ_SELF,
        PermissionName.ORGANIZATION_READ,
        PermissionName.NOTIFICATION_READ,
    },
    RoleName.USER: {
        PermissionName.USER_READ_SELF,
        PermissionName.USER_UPDATE_SELF,
        PermissionName.USER_ADDRESS_MANAGE,
        PermissionName.NOTIFICATION_READ,
    },
}


def has_permission(role_names: list[str], permission: PermissionName) -> bool:
    for role_name in role_names:
        try:
            role = RoleName(role_name)
        except ValueError:
            continue
        if permission in ROLE_PERMISSIONS.get(role, set()):
            return True
    return False
