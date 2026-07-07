# Project Enhancements Documentation

This document details the professional enhancements made to strengthen backend-frontend integration, improve error handling, and modernize the UI/UX.

## Backend Enhancements

### 1. Enhanced Exception Handling (`backend/app/core/exceptions.py`)

**New Features:**
- Structured exception classes with error codes and details
- Detailed error logging with request paths
- Formatted validation errors with field information
- Error tracking IDs for debugging
- Specific exception types: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`, `ValidationException`

**Usage Example:**
```python
from backend.app.core.exceptions import NotFoundException, ValidationException

# Raise specific exceptions
raise NotFoundException("Temple not found", details={"temple_id": temple_id})
raise ValidationException("Invalid email format", details={"field": "email"})
```

**Error Response Format:**
```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "error_id": "ERR_12345"
}
```

### 2. Security Middleware (`backend/app/core/middleware.py`)

**New Middleware:**
- **ValidationMiddleware**: Adds request IDs, logs requests/responses, adds security headers
- **ContentTypeMiddleware**: Ensures proper content-type for POST/PUT/PATCH requests
- **SecurityHeadersMiddleware**: Adds security headers (X-Frame-Options, X-XSS-Protection, etc.)
- **RateLimitMiddleware**: Basic rate limiting (placeholder for Redis-based implementation)

**Security Headers Added:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## Frontend Enhancements

### 1. Enhanced API Client (`packages/api-client/src/index.ts`)

**New Features:**
- **Automatic retry logic** with exponential backoff for network errors and 5xx responses
- **Request timeout** (default 30s, configurable)
- **Automatic token refresh** on 401/403 errors
- **Enhanced error classification** with helper methods
- **Typed HTTP methods** (get, post, patch, delete)
- **Detailed error extraction** from various response formats

**Usage Example:**
```typescript
import { createApiClient } from "@foundation/api-client";

const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  accessToken: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  onTokenRefresh: (newToken) => localStorage.setItem("token", newToken),
  onAuthError: () => window.location.href = "/login",
});

// Error handling
try {
  const data = await api.get("/api/v1/temples");
} catch (error) {
  if (error instanceof ApiClientError) {
    if (error.isNetworkError()) {
      // Handle network error
    } else if (error.isAuthError()) {
      // Handle auth error
    } else if (error.isValidationError()) {
      // Handle validation error - error.field contains the field name
    }
  }
}
```

### 2. Error Boundary Component (`packages/ui/src/error-boundary.tsx`)

**Features:**
- Catches React component errors gracefully
- Shows user-friendly error UI
- Displays error details in development mode
- Provides recovery options (retry, go home)
- Can be customized with fallback UI

**Usage Example:**
```tsx
import { ErrorBoundary } from "@foundation/ui";

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    console.error("Error caught:", error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### 3. Toast Notification System (`packages/ui/src/toast.tsx`)

**Features:**
- Multiple toast types: success, error, warning, info, loading
- Auto-dismissal with configurable duration
- Action buttons support
- Animated entrance/exit
- Stacked notifications
- Programmatic control

**Usage Example:**
```tsx
import { useToast } from "@foundation/ui";

function MyComponent() {
  const { toast, success, error, warning, info, loading } = useToast();

  const handleAction = async () => {
    const toastId = loading("Processing...", "Please wait");
    try {
      await someAsyncOperation();
      dismiss(toastId);
      success("Success!", "Operation completed");
    } catch (err) {
      dismiss(toastId);
      error("Error", "Something went wrong");
    }
  };

  return <button onClick={handleAction}>Click me</button>;
}
```

### 4. Skeleton Loading Components (`packages/ui/src/skeleton.tsx`)

**Available Skeletons:**
- `Skeleton` - Basic skeleton with variants (default, text, circular, rounded)
- `CardSkeleton` - Card placeholder
- `ProductCardSkeleton` - Product card placeholder
- `TempleCardSkeleton` - Temple card placeholder
- `TableSkeleton` - Table with configurable rows/columns
- `ListSkeleton` - List items placeholder
- `FormSkeleton` - Form fields placeholder
- `DashboardSkeleton` - Complete dashboard placeholder

**Usage Example:**
```tsx
import { CardSkeleton, TempleCardSkeleton, DashboardSkeleton } from "@foundation/ui";

function TempleList({ temples, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TempleCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return <div>{/* actual content */}</div>;
}
```

### 5. Form Validation System (`packages/ui/src/form.tsx`)

**Features:**
- Form state management with validation
- Field-level error handling
- Touch state tracking
- Async validation support
- Reusable form components
- TypeScript support

**Usage Example:**
```tsx
import { useForm, FormProvider, FormField, FormInput, FormActions } from "@foundation/ui";

function MyForm() {
  const form = useForm(
    { email: "", password: "" },
    async (values) => {
      const errors: FormErrors = {};
      if (!values.email) errors.email = { message: "Email is required" };
      if (!values.password) errors.password = { message: "Password is required" };
      return errors;
    }
  );

  const handleSubmit = async (values) => {
    await api.post("/auth/login", values);
  };

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          name="email"
          label="Email"
          required
          helperText="We'll never share your email"
        >
          <FormInput type="email" placeholder="you@example.com" />
        </FormField>
        
        <FormField
          name="password"
          label="Password"
          required
        >
          <FormInput type="password" placeholder="••••••••" />
        </FormField>
        
        <FormActions
          submitText="Sign In"
          isSubmitting={form.isSubmitting}
          isValid={form.isValid}
        />
      </form>
    </FormProvider>
  );
}
```

## Provider Updates

Both Namo Setu and MODIT providers have been updated to include:

```tsx
<ErrorBoundary>
  <ToastProvider>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </ToastProvider>
</ErrorBoundary>
```

**Enhanced Query Client Configuration:**
- Smart retry logic (no retries on 4xx errors except 408)
- 30-second stale time
- Disabled refetch on window focus

## Integration Best Practices

### 1. API Error Handling Pattern

```tsx
import { useToast } from "@foundation/ui";
import { ApiClientError } from "@foundation/api-client";

function useApiCall() {
  const { error: showError, success: showSuccess } = useToast();

  const callApi = async (apiFunction: () => Promise<any>) => {
    try {
      const result = await apiFunction();
      showSuccess("Success", "Operation completed");
      return result;
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.isNetworkError()) {
          showError("Network Error", "Please check your connection");
        } else if (err.isAuthError()) {
          showError("Session Expired", "Please login again");
        } else if (err.isValidationError()) {
          showError("Validation Error", err.message);
        } else {
          showError("Error", err.message);
        }
      } else {
        showError("Error", "Something went wrong");
      }
      throw err;
    }
  };

  return { callApi };
}
```

### 2. Loading State Pattern

```tsx
import { useQuery } from "@tanstack/react-query";
import { CardSkeleton } from "@foundation/ui";

function DataLoader() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["temples"],
    queryFn: () => api.get("/api/v1/namo/temples"),
  });

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return <DataView data={data} />;
}
```

### 3. Form Submission Pattern

```tsx
function MyComponent() {
  const { toast, loading, success, error } = useToast();
  const form = useForm(initialValues, validationSchema);

  const handleSubmit = async (values) => {
    const toastId = loading("Submitting...", "Please wait");
    try {
      await api.post("/endpoint", values);
      toast.dismiss(toastId);
      success("Success!", "Data saved successfully");
      form.resetForm();
    } catch (err) {
      toast.dismiss(toastId);
      error("Error", "Failed to save data");
    }
  };

  return <Form onSubmit={form.handleSubmit(handleSubmit)}>{/* ... */}</Form>;
}
```

## Deployment Considerations

### Backend
- Ensure CORS origins are properly configured for production domains
- Set up proper logging levels (INFO for production, DEBUG for development)
- Consider implementing Redis-based rate limiting for production
- Enable HSTS headers when using HTTPS

### Frontend
- Configure API base URL for production environment
- Set appropriate timeout values based on your API performance
- Implement proper error tracking (Sentry, LogRocket, etc.)
- Test error boundaries in production-like environment

## Testing Recommendations

1. **Test error scenarios**: Network failures, timeouts, 4xx/5xx errors
2. **Test form validation**: Invalid inputs, required fields, async validation
3. **Test loading states**: Slow networks, API delays
4. **Test error recovery**: Retry mechanisms, token refresh
5. **Test toast notifications**: Multiple toasts, auto-dismissal, actions

## Future Enhancements

Consider adding:
- Request/response interceptors for logging
- Offline support with service workers
- Optimistic UI updates
- Request deduplication
- Response caching strategies
- WebSocket integration for real-time updates
- Advanced form validation with Zod or Yup integration
