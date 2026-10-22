# Phase 3: Authentication, Profiles & Addresses — Implementation Plan

## 1. Objectives
* Implement secure identity and role-based access control (Buyer, Seller, Admin, Courier Partner).
* Provide dual login flows: Password-based authentication + Mobile Phone OTP login (essential for Indian market).
* Enforce rate limiting on OTP dispatch and failed verification attempts.
* Build address management with Indian PIN code validation, city/state resolution (Bidar, Karnataka first).
* Manage seller verification and KYC compliance (UPI ID / Bank Account details stored encrypted).

## 2. API Endpoints
* `POST /api/v1/auth/register`: Create user account.
* `POST /api/v1/auth/login`: Standard credential login.
* `POST /api/v1/auth/otp/send`: Request SMS/Email OTP (with rate limits).
* `POST /api/v1/auth/otp/verify`: Exchange OTP for JWT access + refresh tokens.
* `POST /api/v1/auth/refresh`: Refresh expired session token.
* `GET /api/v1/users/me`: Current user profile.
* `PUT /api/v1/users/me`: Update profile details.
* `GET /api/v1/users/me/addresses`: List saved buyer/seller addresses.
* `POST /api/v1/users/me/addresses`: Add new pickup/delivery address.
* `DELETE /api/v1/users/me/addresses/{id}`: Soft delete address.
* `POST /api/v1/seller/kyc`: Submit seller payout details (Bank account/UPI) for verification.

## 3. Privacy & Security
* Seller physical addresses are never exposed to public viewers.
* Pickup address is revealed only to authorized delivery courier partners upon scheduled pickup.
