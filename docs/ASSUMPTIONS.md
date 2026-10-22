# BookLoop — Commercial, Legal, and Operational Assumptions Register

This register documents every unverified commercial, regulatory, legal, and operational assumption within BookLoop. As mandated by development rules, unverified values are flagged with `REQUIRES_VERIFICATION` or `CONFIGURABLE`.

---

## 1. Taxation & GST Regulations (India)

| Area | Current Working Rule | Status | Action Required Prior to Production |
|---|---|---|---|
| **Used Physical Books** | Physical printed books generally fall under HSN 4901 and are historically exempt / nil-rated under GST. | `REQUIRES_VERIFICATION` | Obtain formal tax advisory on whether C2C used-book sales trigger GST liability for the platform or seller. |
| **Platform Commission** | Marketplace fee charged to sellers is subject to standard 18% GST (SAC 9983 / 9985). | `CONFIGURABLE` | Configurable in database system settings (`COMMISSION_GST_RATE_PERCENT = 18.0`). |
| **Delivery & Logistics Fee** | Courier transportation charged to customers is taxed at 18% GST or passed through depending on whether BookLoop acts as principal or pure agent. | `CONFIGURABLE` | Supported via dynamic tax calculation engine in `TaxService`. |
| **TCS (Tax Collected at Source)** | Section 52 of CGST Act mandates e-commerce operators to collect TCS (typically 0.5% - 1%) on net taxable supplies. | `REQUIRES_VERIFICATION` | Verify whether pure second-hand book transactions between unregistered individuals trigger TCS obligations. |

---

## 2. Payments & Marketplace Escrow Settlements

| Area | Current Working Rule | Status | Action Required Prior to Production |
|---|---|---|---|
| **Fund Routing** | Customer funds cannot sit in BookLoop's current account directly without nodal / escrow compliance (RBI PGs/PA guidelines). | `CONFIGURABLE` | Integrate an RBI-authorized Payment Aggregator (e.g., Razorpay Route or Cashfree Marketplace) for split settlement. |
| **Seller Payout Settlement Window** | Payout is triggered $T + 3$ days after verified courier delivery, allowing buyer return/dispute inspection. | `CONFIGURABLE` | Expose as `SETTLEMENT_HOLD_PERIOD_DAYS = 3` in admin system settings. |
| **Platform Commission Rate** | Tiered percentage (default 10% - 15%) or flat fee per listing tier. | `CONFIGURABLE` | Managed via dynamic rule table `fee_configurations`. Default test rate: 10%. |
| **Payment Gateway Charges** | ~2% + GST deduction; can be absorbed by platform or deducted from seller disbursement. | `CONFIGURABLE` | Flagged as `ABSORB_GATEWAY_FEES = True/False`. |

---

## 3. Logistics, Courier & Packaging

| Area | Current Working Rule | Status | Action Required Prior to Production |
|---|---|---|---|
| **Launch City (Bidar, KA)** | Initial serviceable PIN codes: `585401`, `585403`. | `CONFIGURABLE` | Serviceability is verified via `CourierProvider.check_serviceability(pincode)`. |
| **Chargeable Parcel Weight** | Greater of dead weight vs. volumetric weight ($L \times W \times H / 5000$). | `CONFIGURABLE` | Standard formula implemented in `ShippingCalculator`. Average single book package modeled as 350g dead weight, $25 \times 18 \times 4\text{ cm}$. |
| **RTO (Return to Origin)** | In case of failed buyer delivery after 3 attempts, parcel returns to seller pickup address at contracted RTO rate. | `CONFIGURABLE` | Defined in `ShipmentState.RETURN_TO_ORIGIN`. |
| **Delivery Proof** | Order completion strictly relies on courier webhook delivery timestamp with OTP/signature proof. | `ENFORCED` | Client-side self-attestation is forbidden. |

---

## 4. Product Quality, Condition & Seller Liability

| Area | Current Working Rule | Status | Action Required Prior to Production |
|---|---|---|---|
| **Condition Grading** | 5 standard grades: *Like New*, *Very Good*, *Good*, *Acceptable*, *Heavily Used*. | `ENFORCED` | Mandatory defect photo upload for any grade below *Like New*. |
| **Missing Pages / Defect Disclosure** | Sellers must explicitly attest to book completeness. Undisclosed damage entitles buyer to full refund. | `ENFORCED` | Dispute engine auto-flags complaints with photo evidence against seller payout. |
| **Copyright & Piracy** | Photocopied books, pirated scanned PDFs, and commercial reprints are strictly prohibited. | `ENFORCED` | Admin moderation queue checks listings before publication. |
