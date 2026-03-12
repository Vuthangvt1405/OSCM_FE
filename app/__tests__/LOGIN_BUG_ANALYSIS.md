# Login Bug Analysis & Test Cases

## Issue Description

**Problem**: When logging in with a non-existent user, the application redirects instead of throwing an error.

**Location**: `odysseus_FE/app/components/LoginForm.tsx:40`

```typescript
await loginIdentity(values);
```

## Root Cause Analysis

### Backend Flow (Verified ✅)

1. **LoginUserServiceImpl.java** (line 46-47):

   ```java
   Identity identity = identityOpt.orElseThrow(
       () -> new InvalidCredentialsException("Invalid email or password"));
   ```

   - ✅ Correctly throws `InvalidCredentialsException` when user not found

2. **GlobalExceptionHandler.java** (line 63-75):
   ```java
   @ExceptionHandler(InvalidCredentialsException.class)
   public ResponseEntity<ErrorResponse> handleInvalidCredentialsException(...) {
       ErrorResponse error = new ErrorResponse(HttpStatus.UNAUTHORIZED.value(), ex.getMessage(), traceId);
       return new ResponseEntity(error, HttpStatus.UNAUTHORIZED);  // Returns 401
   }
   ```

   - ✅ Correctly returns HTTP 401 with error message

### Frontend Flow (Verified ✅)

3. **http.ts** (postJson function):

   ```typescript
   if (!res.ok) {
     const fallback = `Request failed (${res.status} ${res.statusText})`;
     throw new Error(extractMessage(payload as ErrorShape, fallback));
   }
   ```

   - ✅ Correctly throws Error when response is not OK

4. **LoginForm.tsx**:
   ```typescript
   const onSubmit = async (values: LoginValues) => {
     try {
       await loginIdentity(values);
       router.refresh();
       router.push("/");
     } catch (err) {
       const message = err instanceof Error ? err.message : "Login failed";
       toast.error(message || "Login failed");
     }
   };
   ```

   - ✅ Correctly catches error and shows toast

## Most Likely Cause: HTTP Redirect

The only scenario where redirect would happen instead of throwing error is:

1. **Backend returns HTTP 3xx Redirect** instead of 401
   - If Spring Security or any filter does redirect to a login page
   - `fetch()` automatically follows redirects

2. **Check Security Config**:
   - If `/api/auth/login` is not properly excluded from authentication
   - The security filter might redirect unauthenticated requests

## Test Cases

### Level 1: Basic Functionality

- `should call loginIdentity with correct credentials`
- `should redirect to home on successful login`

### Level 2: Boundary & Edge Cases

- `should handle invalid credentials error - USER NOT FOUND`
- `should handle network error gracefully`
- `should handle empty credentials`

### Level 3: Error Handling

- `should handle 401 Unauthorized response correctly`
- `should handle 500 Internal Server Error`
- `should handle unexpected error format - string`
- `should handle null/undefined error`

### Level 4: Integration Behavior

- `should NOT redirect on failed login attempt`
- `should properly handle redirect from backend (if it occurs)`

## Recommended Fix

### Option 1: Verify No Redirect in Backend (Recommended)

Check if Spring Security is redirecting instead of returning 401. Add explicit handling:

```java
// In SecurityConfig.java for /api/auth/**
// Ensure no redirect happens - return 401 instead
http.exceptionHandling(ex -> ex
    .authenticationEntryPoint((request, response, authException) -> {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Unauthorized\"}");
    })
);
```

### Option 2: Add Frontend Redirect Detection

```typescript
// In http.ts postJson function
export async function postJson<TResponse, TBody>(
  url: string,
  body: TBody,
  init?: Omit<RequestInit, "method" | "body">,
): Promise<TResponse> {
  const res = await fetch(url, {
    ...init,
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
    redirect: "error", // CRITICAL: Don't follow redirects automatically
  });
  // ... rest of the code
}
```

### Option 3: Add Validation Before API Call

In LoginForm.tsx, add a check before calling the API:

```typescript
const onSubmit = async (values: LoginValues) => {
  try {
    const result = await loginIdentity(values);

    // Guard: If result is unexpectedly undefined or not proper, don't redirect
    if (!result) {
      throw new Error("Login failed: No response from server");
    }

    router.refresh();
    router.push("/");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    toast.error(message || "Login failed");
  }
};
```

## Conclusion

Based on code analysis:

- ✅ Backend correctly throws and returns 401
- ✅ Frontend http.ts correctly throws on non-OK responses
- ✅ Frontend LoginForm.tsx correctly catches errors

**The most likely cause is that the backend is returning an HTTP redirect (3xx) instead of 401**, which causes `fetch()` to follow the redirect silently without throwing an error.

**Recommended action**: Check Spring Security configuration to ensure it returns 401 instead of redirecting for `/api/auth/login` endpoint.
