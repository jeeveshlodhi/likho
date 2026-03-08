from enum import Enum


class PlanType(str, Enum):
    """User subscription plan types"""
    FREE = "free"
    PRO = "pro"
    TEAM = "team"
    ENTERPRISE = "enterprise"


class ThemeType(str, Enum):
    """User theme preference"""
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class AuthProvider(str, Enum):
    """Authentication provider types"""
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"
    APPLE = "apple"


class DeviceType(str, Enum):
    """Device types for sessions and device registry"""
    DESKTOP = "desktop"
    MOBILE = "mobile"
    WEB = "web"
    TAURI_DESKTOP = "tauri_desktop"


class MemberRole(str, Enum):
    """User role in workspace"""
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"
