# User Module - Comprehensive Documentation

## Overview

The User module has been significantly enhanced to support a large-scale collaborative application. It now includes detailed user management, authentication, sessions, API keys, devices, and preferences.

## Database Models

### 1. **User** (Core User Account)
The main user model that stores comprehensive user information.

**Key Features:**
- **UUIDs**: Using PostgreSQL UUID type for primary keys
- **Basic Info**: Email, username, full name, avatar, bio
- **User Preferences**: Timezone, locale, theme (light/dark/system)
- **Subscription**: Plan type (free/pro/team/enterprise), plan expiration, storage tracking
- **Status**: Active status, email verification, onboarding status
- **Soft Deletes**: Deleted users are soft-deleted (not permanently removed)
- **Timestamps**: Created, updated, and deleted timestamps with timezone awareness

**Fields:**
```python
- id: UUID (Primary Key)
- email: String (unique, indexed)
- email_verified: Boolean (default: False)
- username: String (unique, optional)
- full_name: String (optional)
- avatar_url: String (optional)
- bio: Text (optional)
- timezone: String (default: "UTC")
- locale: String (default: "en")
- theme: Enum (light/dark/system)
- plan: Enum (free/pro/team/enterprise)
- plan_expires_at: DateTime (nullable)
- storage_used: BigInteger (bytes)
- storage_limit: BigInteger (default: 1GB)
- is_active: Boolean (default: True)
- last_seen_at: DateTime (nullable)
- onboarded_at: DateTime (nullable)
- created_at: DateTime (with timezone)
- updated_at: DateTime (with timezone)
- deleted_at: DateTime (for soft deletes)
```

**Relationships:**
- `auth_methods`: OneToMany → UserAuth
- `sessions`: OneToMany → Session
- `api_keys`: OneToMany → APIKey
- `preferences`: OneToMany → UserPreference
- `devices`: OneToMany → DeviceRegistry

---

### 2. **UserAuth** (Multi-Provider Authentication)
Supports multiple authentication methods per user (email, Google, GitHub, Apple, etc.)

**Key Features:**
- Multiple auth providers per user
- Provider-specific IDs and tokens
- Support for OAuth tokens and refresh tokens
- Password hashing for email-based auth

**Fields:**
```python
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- provider: String (email, google, github, apple)
- provider_id: String (external provider user ID)
- password_hash: String (for email auth only)
- access_token: Text (OAuth token)
- refresh_token: Text (OAuth refresh token)
- token_expires_at: DateTime (token expiration)
- created_at: DateTime
- updated_at: DateTime
```

**Use Cases:**
- User signs up with email/password
- User adds Google OAuth
- User adds GitHub OAuth
- Seamless login with any provider

---

### 3. **Session** (Active User Sessions)
Tracks active user sessions for security and device management.

**Key Features:**
- Token-based session tracking
- Device information (name, type, platform)
- IP tracking for security
- Automatic expiration
- Tauri desktop app support

**Fields:**
```python
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- token_hash: String (unique, indexed)
- device_name: String (e.g., "iPhone 12", "MacBook Pro")
- device_type: Enum (desktop/mobile/web)
- ip_address: INET (PostgreSQL IP type)
- user_agent: Text
- is_tauri: Boolean (for Tauri desktop sessions)
- last_active_at: DateTime (tracks activity)
- expires_at: DateTime (session expiration)
- created_at: DateTime
```

**Use Cases:**
- Track where user is logged in
- Show "Last active" for security
- Force logout from specific devices
- Revoke compromised sessions

---

### 4. **APIKey** (Programmatic Access)
Allows users to generate API keys for integrations and automated tools.

**Key Features:**
- Secure key storage (only hash stored)
- Key prefix display (first 8 chars)
- Granular permission scopes (read/write/admin)
- Key expiration support
- Usage tracking

**Fields:**
```python
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- name: String (descriptive name)
- key_hash: String (unique, never expose full key)
- key_prefix: String (first 8 chars for display)
- scopes: String (comma-separated: read,write,admin)
- last_used_at: DateTime
- expires_at: DateTime (nullable)
- created_at: DateTime
- revoked_at: DateTime (for deactivation)
```

**Security:**
- Full API key only shown once at creation
- Only hash stored in database
- Prefix shown for identification
- Scopes limit what the key can do

---

### 5. **UserPreference** (Custom Settings)
Extensible key-value store for user preferences and settings.

**Key Features:**
- Flexible key-value storage
- Can store any JSON data
- Per-workspace preferences possible
- Version tracking

**Fields:**
```python
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- key: String (preference key)
- value: Text (stored as JSON)
- created_at: DateTime
- updated_at: DateTime
```

**Use Cases:**
- Store custom theme preferences
- Save sidebar state
- Store default workspace
- Remember user choices

---

### 6. **DeviceRegistry** (Multi-Device Support)
Manages and tracks user devices for offline sync, CRDT, and multi-device support.

**Key Features:**
- Unique device identification
- Platform tracking (macOS, Windows, Linux, iOS, Android)
- Sync clock for CRDT conflict resolution
- Device activity tracking

**Fields:**
```python
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- device_id: String (unique device identifier)
- device_name: String (user-friendly name)
- device_type: Enum (tauri_desktop/web/mobile)
- platform: String (macos/windows/linux/ios/android)
- last_sync_at: DateTime
- last_seen_at: DateTime
- vector_clock: String (CRDT vector clock)
- created_at: DateTime
```

**Use Cases:**
- Offline-first sync across devices
- Conflict resolution using vector clocks
- Show user which devices have synced
- Device-specific features (Tauri desktop only features)

---

## Enums

### PlanType
- `FREE`: Free tier
- `PRO`: Professional tier
- `TEAM`: Team tier
- `ENTERPRISE`: Enterprise tier

### ThemeType
- `LIGHT`: Light theme
- `DARK`: Dark theme
- `SYSTEM`: Follow system preference

### AuthProvider
- `EMAIL`: Email/password authentication
- `GOOGLE`: Google OAuth
- `GITHUB`: GitHub OAuth
- `APPLE`: Apple Sign In

### DeviceType
- `DESKTOP`: Desktop web browser
- `MOBILE`: Mobile browser
- `WEB`: Web application
- `TAURI_DESKTOP`: Tauri desktop application

### MemberRole
- `OWNER`: Workspace owner (full permissions)
- `ADMIN`: Admin user (most permissions)
- `EDITOR`: Can edit content
- `COMMENTER`: Can only comment
- `VIEWER`: Read-only access

---

## Pydantic Schemas

Comprehensive Pydantic schemas are provided for request/response validation:

### User Schemas
- `UserBase`: Base user fields
- `UserCreate`: For user signup
- `UserUpdate`: For profile updates
- `UserResponse`: Public user info (no sensitive data)
- `UserDetailedResponse`: Detailed user with storage info
- `UserInDB`: Full user record with all fields

### Authentication Schemas
- `SignUpRequest`: User registration
- `SignUpResponse`: Registration response with user data
- `SignInRequest`: Login credentials
- `SignInResponse`: Login response with token
- `TokenRefreshRequest`: Token refresh
- `TokenRefreshResponse`: New access token
- `PasswordChangeRequest`: Change password
- `PasswordResetRequest`: Request password reset
- `PasswordResetConfirm`: Confirm password reset
- `EmailVerificationRequest`: Request email verification
- `EmailVerificationConfirm`: Confirm email verification

### Related Schemas
- `UserAuthResponse`: Public auth method info
- `SessionResponse`: Session details
- `APIKeyCreate`: Create API key
- `APIKeyResponse`: API key details
- `APIKeyCreateResponse`: API key with full key (shown once)
- `UserPreferenceResponse`: User preference details
- `DeviceRegistryResponse`: Device details

---

## Database Indexes

Proper indexes are created for performance:

```sql
-- User indexes
idx_users_email
idx_users_deleted_at (partial, only active users)

-- Auth indexes
idx_user_auth_user_id
idx_user_auth_provider

-- Session indexes
idx_sessions_user_id
idx_sessions_expires_at

-- API Key indexes
idx_api_keys_user_id

-- Preference indexes
idx_user_preferences_user_id
idx_user_preferences_key

-- Device indexes
idx_device_registry_user_id
```

---

## Usage Examples

### Creating a User
```python
user = User(
    email="user@example.com",
    email_verified=False,
    username="johndoe",
    full_name="John Doe",
    timezone="America/New_York",
    locale="en",
    theme=ThemeType.DARK,
    plan=PlanType.FREE
)
```

### Creating a Session
```python
session = Session(
    user_id=user.id,
    token_hash=hash_token(access_token),
    device_name="iPhone 12",
    device_type=DeviceType.MOBILE,
    ip_address="192.168.1.1",
    is_tauri=False,
    expires_at=datetime.utcnow() + timedelta(days=30)
)
```

### Creating an API Key
```python
api_key = APIKey(
    user_id=user.id,
    name="Integration API Key",
    key_hash=hash_key(generated_key),
    key_prefix=generated_key[:8],
    scopes="read,write"
)
```

---

## Security Considerations

1. **Password Hashing**: Passwords should be hashed using bcrypt or similar
2. **Token Security**: Tokens should be hashed before storage
3. **API Keys**: Never store full API keys, only hashes
4. **Soft Deletes**: Deleted users remain in DB for audit trails
5. **Session Expiration**: Sessions automatically expire
6. **Email Verification**: Email must be verified before certain operations
7. **Rate Limiting**: Should be implemented on auth endpoints
8. **2FA**: Support for two-factor authentication (future)

---

## Migration Notes

The User model has been significantly updated. When deploying:

1. Create new tables (UserAuth, Session, APIKey, UserPreference, DeviceRegistry)
2. Migrate existing user data to new User schema
3. Update authentication logic to use new auth methods
4. Create migration for soft delete support
5. Update session handling to use new Session model

---

## Future Enhancements

- Two-factor authentication (2FA)
- Social login (Facebook, Twitter, etc.)
- Passwordless authentication (magic links)
- User roles and permissions (workspace-based)
- User activity audit logs
- Geo-blocking and security policies
- User deactivation workflows
