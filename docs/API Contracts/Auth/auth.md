# Auth API

Base path: `/api/auth`

---

## POST /register

Registers a new user and sends an OTP to their email.

**Rate limited** — `register` policy applies.

**Request body**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phoneNumber": "string | null",
  "yearOfStudy": "number"
}
```

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `{ "message": "OTP sent to your email." }` | Registration successful |
| 409 | `{ "error": "email_taken" }` | Email already registered and verified |
| 422 | `{ "error": "invalid_email" }` | Bad email format |
| 422 | `{ "error": "invalid_year_of_study" }` | Year not between 1–10 |
| 422 | `{ "error": "invalid_domain" }` | Email domain not linked to a university |
| 422 | `{ "error": "weak_password" }` | Password doesn't meet requirements |
| 429 | `{ "error": "otp_already_sent" }` | User is pending verification and OTP was already sent |
| 500 | `{ "error": "server_error" }` | Unexpected error |

---

## POST /verify-otp

Verifies the OTP sent to the user's email after registration.

**Request body**
```json
{
  "email": "string",
  "otp": "string"
}
```

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `{ "message": "Verified successfully." }` | OTP is valid |
| 401 | `{ "error": "invalid_otp" }` | OTP is wrong, or email not found |
| 401 | `{ "error": "otp_expired" }` | OTP has expired |
| 429 | `{ "error": "max_attempts_exceeded" }` | Too many failed attempts |
| 500 | `{ "error": "server_error" }` | Unexpected error |

---

## POST /resend-otp

Resends the OTP for a pending user. Always returns 200 to prevent email enumeration — even if the email isn't found.

**Request body**
```json
{
  "email": "string"
}
```

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `{ "message": "If this email is registered and pending verification, a new OTP has been sent." }` | Always returned if no error |
| 409 | `{ "error": "already_verified" }` | User is already verified |
| 400 | `{ "error": "invalid_request" }` | Bad request |
| 429 | `{ "error": "resend_limit_exceeded", "retry_after_seconds": 60 }` | Resend quota hit |
| 429 | `{ "error": "cooldown_active", "retry_after_seconds": 60 }` | Too soon since last resend |
| 500 | `{ "error": "server_error" }` | Unexpected error |

---

## POST /login

Authenticates a user and sets an `authToken` cookie.

**Rate limited** — `login` policy applies.

**Request body**
```json
{
  "email": "string",
  "password": "string"
}
```

**On success**, sets an `HttpOnly` cookie:

| Field | Value |
|-------|-------|
| Name | `authToken` |
| HttpOnly | true |
| Secure | false *(dev only)* |
| SameSite | Lax |
| Expires | 24 hours from now |

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `{ "message": "Login successful" }` | Credentials valid |
| 401 | `{ "error": "invalid_credentials" }` | Wrong email or password |
| 500 | `{ "error": "server_error" }` | Unexpected error |

---

## POST /logout

Clears the `authToken` cookie.

No request body required.

**Responses**

| Status | Body |
|--------|------|
| 200 | `{ "message": "Logged out successfully" }` |

---

## GET /me

Returns the currently authenticated user's profile.

**Requires auth** — JWT in `authToken` cookie.

No request body required.

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | See below | User found |
| 401 | `{ "error": "unauthenticated" }` | No/invalid token |
| 500 | `{ "error": "server_error" }` | Unexpected error |

**200 body — student**
```json
{
  "user": {
    "userId": "guid",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "userRole": "student"
  },
  "std": {
    "verificationStatus": "pending | verified"
  }
}
```

**200 body — other roles**
```json
{
  "userId": "guid",
  "firstName": "string",
  "lastName": "string",
  "email": "string"
}
```
