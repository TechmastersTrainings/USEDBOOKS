# Phase 5: Orders, Cart & Checkout Engine — Implementation Plan

## 1. Objectives
* Implement robust cart management supporting items from distinct individual sellers.
* Prevent race conditions and overselling using database-level pessimistic locking (`SELECT FOR UPDATE`) during checkout.
* Build strict backend state machine for orders.
* Transparent checkout breakdown: Book price, delivery charges, applicable taxes, discounts, and total payable.
* Comprehensive cancellation rules based on order lifecycle stage.

## 2. Order State Machine Transitions
* `PENDING_PAYMENT` $\rightarrow$ Created, inventory reserved for 15 minutes.
* `PAYMENT_CONFIRMED` $\rightarrow$ Webhook received, funds in escrow, seller notified.
* `AWAITING_SELLER_CONFIRMATION` $\rightarrow$ Seller verifies book availability and prepares packaging.
* `PICKUP_SCHEDULED` $\rightarrow$ Courier pickup assigned, shipping label generated.
* `PICKED_UP` $\rightarrow$ Courier scanned parcel from seller address.
* `IN_TRANSIT` $\rightarrow$ Handled through hub / logistics network.
* `DELIVERED` $\rightarrow$ Courier webhook confirms delivery to buyer; inspection window starts.
* `COMPLETED` $\rightarrow$ Inspection window elapsed without dispute; seller funds released to settlement queue.
* `CANCELLED` $\rightarrow$ Buyer/seller cancels prior to pickup; inventory restored, refund issued.
* `RETURN_REQUESTED` $\rightarrow$ Buyer files defect/condition dispute with photographic evidence.
* `RETURN_IN_TRANSIT` $\rightarrow$ Courier assigned for return to seller.
* `REFUNDED` $\rightarrow$ Funds returned to buyer.
* `DISPUTED` $\rightarrow$ Escalated to admin dispute moderation team.

## 3. Concurrency & Inventory Protection
* Each physical listing has `quantity = 1` (peer-to-peer single copy model).
* On order initiation, status flips to `RESERVED` with expiry timestamp.
* If payment fails or expires, background worker unlocks the listing back to `ACTIVE`.
