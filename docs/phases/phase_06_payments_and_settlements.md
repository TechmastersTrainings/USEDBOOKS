# Phase 6: Payments, Ledger & Seller Settlements — Implementation Plan

## 1. Objectives
* Integrate payment gateway adapter (Razorpay / Cashfree sandbox for India) supporting UPI, Cards, NetBanking.
* Implement server-side verification: payment orders created server-side, HMAC signed webhooks with idempotency.
* Build double-entry accounting ledger tracking gross order value, platform commission revenue, courier expense, gateway processing fees, GST, and seller net payable.
* Provide automated seller settlement calculation following delivery confirmation and inspection period ($T+3$ days).

## 2. Ledger Architecture
Every monetary transaction generates matching debit and credit entries across platform accounts:
* `ACCOUNT_ESCROW_HOLDING`
* `ACCOUNT_BUYER_PAYABLE`
* `ACCOUNT_SELLER_PAYABLE`
* `ACCOUNT_PLATFORM_COMMISSION_REVENUE`
* `ACCOUNT_LOGISTICS_REVENUE` / `EXPENSE`
* `ACCOUNT_PAYMENT_GATEWAY_EXPENSE`
* `ACCOUNT_GST_OUTPUT_TAX`

## 3. Webhook Idempotency & Security
* Webhook signature verified using HMAC SHA256 before body parsing.
* Processed webhook event IDs recorded in `processed_webhook_events` table with unique constraint to prevent duplicate processing.
* Zero trust on browser redirects; status changes occur exclusively through validated server notifications.
