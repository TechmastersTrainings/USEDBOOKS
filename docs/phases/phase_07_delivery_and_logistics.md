# Phase 7: Delivery, Logistics & Courier Adapters — Implementation Plan

## 1. Objectives
* Design and implement provider-independent courier interface (`CourierProvider` base class).
* Support pluggable adapters:
  * `DelhiveryCourierAdapter` (pan-India surface logistics)
  * `LocalRiderCourierAdapter` (hyperlocal same-day intracity for Bidar)
  * `MockCourierAdapter` (for deterministic automated testing and sandbox environments)
* Live shipping rate quotes taking into account dead weight vs. volumetric weight ($L \times W \times H / 5000$).
* Automated airway bill (AWB) generation, shipping label PDF generation, and pickup dispatching.
* Inbound tracking webhook processor updating order status directly from courier milestones.

## 2. Bidar City-First Logistics Model
* Primary test pincodes: `585401`, `585403`.
* Bidar intracity deliveries: eligible for local rider dispatch at low flat rate (e.g. ₹35 - ₹50) with same-day or next-day turnaround.
* Intercity deliveries: routed via regional surface logistics (Delhivery/Bluedart) with automated pickup from seller address.

## 3. Shipping States & RTO Flow
* Tracking timeline: Manifested $\rightarrow$ Dispatched for Pickup $\rightarrow$ Picked Up $\rightarrow$ In Hub $\rightarrow$ Out for Delivery $\rightarrow$ Delivered.
* Failed delivery policy: 3 consecutive attempts prior to triggering Return To Origin (RTO).
