# Frontend Authentication Setup

## Overview

Complete authentication system with React Query, Zustand, and React Hook Form integrated into the Likho frontend.

## Architecture

### State Management (Zustand)
- **Store**: `src/store/authStore.ts`
- Persists authentication state to localStorage
- Manages user info, tokens, and auth status
- Lightweight and performant

### API Integration (React Query + Axios)
- **Base API**: `src/lib/api.ts` - Axios instance with interceptors
- **Hooks**: `src/hooks/useAuth.ts` - Comprehensive React Query hooks
- Automatic token injection in requests
- Auto-logout on 401 responses

### Form Handling (React Hook Form)
- Built-in validation
- Minimal re-renders
- Better UX with field-level errors

## File Structure

```
src/
├── store/
│   └── authStore.ts              # Zustand auth store
├── hooks/
│   └── useAuth.ts                # React Query hooks for auth
├── types/
│   └── auth.ts                   # TypeScript interfaces
├── pages/auth/
│   ├── sign-in.tsx              # Login page
│   └── sign-up.tsx              # Registration page
├── components/forms/
│   ├── FormInput.tsx            # Reusable input component
│   ├── Button.tsx               # Reusable button component
│   └── Alert.tsx                # Alert/notification component
├── providers/
│   └── QueryProvider.tsx        # React Query provider
└── lib/
    ├── api.ts                   # Axios instance with interceptors
    └── auth.ts                  # Auth utilities
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @tanstack/react-query zustand react-hook-form axios
```

### 2. Configure App.tsx

Wrap your app with QueryProvider:

```tsx
import { QueryProvider } from '@/providers/QueryProvider';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from '@/pages/auth/sign-in';
import SignUp from '@/pages/auth/sign-up';

function App() {
  return (
    <QueryProvider>
      <Router>
        <Routes>
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/sign-up" element={<SignUp />} />
          {/* Other routes */}
        </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;
```

### 3. API Configuration

Update `src/lib/api.ts` with your backend URL:

```typescript
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
```

Add to `.env`:

```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

## Usage Examples

### Sign In

```tsx
import { useSignIn } from '@/hooks/useAuth';

const MyComponent = () => {
  const { mutate: signIn, isPending, isError, error } = useSignIn();

  const handleLogin = (email: string, password: string) => {
    signIn(
      { email, password },
      {
        onSuccess: (data) => {
          console.log('Logged in as:', data.user.email);
        },
        onError: (error) => {
          console.error('Login failed:', error.message);
        },
      }
    );
  };

  return <button onClick={() => handleLogin('user@example.com', 'password')}>Login</button>;
};
```

### Get Current User

```tsx
import { useCurrentUser } from '@/hooks/useAuth';

const Dashboard = () => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;

  return <div>Welcome, {user?.full_name}!</div>;
};
```

### Access Auth State

```tsx
import { useAuthStore } from '@/store/authStore';

const MyComponent = () => {
  const { user, isAuthenticated, accessToken } = useAuthStore();

  return (
    <div>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {user?.email}</p>
    </div>
  );
};
```

### Logout

```tsx
import { useLogout } from '@/hooks/useAuth';

const LogoutButton = () => {
  const { mutate: logout } = useLogout();

  return <button onClick={() => logout()}>Logout</button>;
};
```

## API Endpoints Used

All endpoints are relative to `API_V1_STR` (/api/v1):

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/signin` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `POST /auth/change-password` - Change password
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/confirm-password-reset` - Reset password with token
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/request-email-verification` - Request email verification

## Form Validation

### Sign In Form
- Email: Required, valid email format
- Password: Required, minimum 8 characters

### Sign Up Form
- Full Name: Optional, minimum 2 characters
- Username: Optional, alphanumeric + hyphens/underscores
- Email: Required, valid email format
- Password: Required, 8+ chars with uppercase, lowercase, and number
- Confirm Password: Must match password field

## Error Handling

All hooks handle errors gracefully:

```tsx
const { mutate, isPending, isError, error } = useSignIn();

if (error) {
  const errorMessage = error.response?.data?.detail || error.message;
  console.error('Error:', errorMessage);
}
```

## State Persistence

Auth state is automatically persisted to localStorage:

```javascript
// User info, tokens, and auth status persist across page reloads
const { user, accessToken, isAuthenticated } = useAuthStore();
```

To logout and clear state:

```javascript
const { logout } = useAuthStore();
logout(); // Clears all auth data
```

## Security Features

- ✅ Tokens stored in localStorage (accessible to XSS)
- ✅ Auto-logout on 401 (Unauthorized) response
- ✅ Password validation (strength requirements)
- ✅ Email verification support
- ✅ CORS-protected API calls
- ✅ Bearer token in Authorization header

## Components

### FormInput
```tsx
<FormInput
  label="Email"
  type="email"
  placeholder="user@example.com"
  error="Invalid email"
  helpText="Enter your email address"
/>
```

### Button
```tsx
<Button
  variant="primary" | "secondary" | "outline" | "danger"
  size="sm" | "md" | "lg"
  isLoading={false}
  fullWidth
>
  Click me
</Button>
```

### Alert
```tsx
<Alert
  type="success" | "error" | "warning" | "info"
  message="This is a message"
  onClose={() => {}}
/>
```

## Dark Mode Support

All components support dark mode via Tailwind CSS:

```tsx
className="dark:text-white dark:bg-gray-800"
```

## OAuth Integration (TODO)

OAuth support for Google and GitHub is stubbed out:

```tsx
// src/pages/auth/sign-in.tsx
onClick={() => {
  // TODO: Implement Google OAuth
  console.log('Google OAuth not yet implemented');
}}
```

To implement:
1. Set up OAuth apps in Google Cloud Console and GitHub
2. Add OAuth2 endpoints to backend
3. Use libraries like `@react-oauth/google` or similar
4. Update hooks with OAuth mutation functions

## Testing

### Manual Testing Checklist
- [ ] Sign up with valid credentials
- [ ] Sign up fails with invalid email
- [ ] Sign up fails with weak password
- [ ] Password confirmation validates
- [ ] Sign in with correct credentials
- [ ] Sign in fails with wrong password
- [ ] User redirects to dashboard on success
- [ ] Error messages display properly
- [ ] Loading state shows during requests
- [ ] Token persists after page reload
- [ ] Logout clears auth state

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Sign up
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'

# Sign in
curl -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'

# Get current user
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues & Solutions

### Token Not Persisting
- Check localStorage is enabled
- Verify QueryProvider wraps app
- Check localStorage clear on logout

### 401 Errors After Login
- Verify token format in Authorization header
- Check backend token validation
- Ensure token includes "Bearer " prefix

### Form Validation Not Working
- Ensure react-hook-form version matches
- Check field names match interfaces
- Verify register() calls match form types

### API Calls Failing
- Check API_URL in environment
- Verify CORS configuration on backend
- Check network tab in DevTools
- Verify token is being sent in requests

## Future Enhancements

- [ ] OAuth2 implementation (Google, GitHub, Apple)
- [ ] Two-factor authentication (2FA)
- [ ] Social login
- [ ] Remember me functionality
- [ ] Biometric authentication
- [ ] Password strength meter
- [ ] Rate limiting display
- [ ] Multi-device session management
- [ ] Email verification flow UI
- [ ] Password reset flow UI
