# Authentication Documentation

## Overview

The Placement Assistant backend uses JWT-based authentication to securely authenticate users.

The authentication system provides:

- User registration
- User login
- Password hashing using bcrypt
- JWT token generation
- JWT-based authentication middleware
- Input validation
- Centralized error handling
- Duplicate account protection
- Safe API responses

---

## Authentication Flow

### Registration

```text
Client
  ↓
POST /api/auth/register
  ↓
Validate input
  ↓
Normalize email
  ↓
Check existing user
  ↓
Hash password using bcrypt
  ↓
Create user in MongoDB
  ↓
Generate JWT
  ↓
Return token + safe user data
```
