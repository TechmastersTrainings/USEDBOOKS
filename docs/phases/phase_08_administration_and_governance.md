# Phase 8: Administration, Moderation & Governance — Implementation Plan

## 1. Objectives
* Provide role-based admin console for platform administrators and moderation operators.
* Manage book catalog curation: add missing editions, merge duplicates, verify metadata.
* Listing moderation queue: review flagged listings, inspect physical photos, verify condition descriptions, block counterfeit/pirated items.
* Dispute & return resolution: review buyer complaints (damage, missing pages, wrong edition), inspect photo evidence, authorize refunds or release seller funds.
* Configuration management: adjust commission percentages, shipping rate cards, GST rules, and service zones without code changes.
* Financial reconciliation & analytics: monitor gross volume, net margin, pending settlements, cancellation rates.

## 2. Admin Modules
* `/admin/moderation`: Pending listings queue with quick approve/reject/request changes buttons.
* `/admin/catalog`: Category hierarchy editor and bibliographic master database.
* `/admin/orders`: Global order inspector with courier tracking timeline and customer support override.
* `/admin/disputes`: Evidence viewer and resolution workflow.
* `/admin/settlements`: Batch approval and bank transfer file export.
* `/admin/settings`: Operational parameter editor (commissions, GST rates, Bidar serviceability pins).
