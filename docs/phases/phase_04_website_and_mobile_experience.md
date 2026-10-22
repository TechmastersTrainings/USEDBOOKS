# Phase 4: Web & Mobile Experience — Implementation Plan

## 1. Objectives
* Assemble polished, premium consumer-facing marketplace applications across web and mobile.
* Adhere to strict design principles: warm off-white tones, refined editorial typography, restrained book-inspired accents (no dark navy blue dominance), smooth micro-interactions.
* Avoid generic emoji substitutions; utilize professional SVG icons.
* Support desktop, tablet, and mobile browsers with zero horizontal overflow.
* Deliver native-feeling Flutter mobile experience for Android and iOS sharing backend APIs.

## 2. Web Application Pages
* **Public & Discovery**:
  * Homepage with curated shelves: "Trending in Bidar", "Engineering & GATE Prep", "UPSC & KPSC Essentials", "Bargain Finds under ₹199".
  * Explore / Browse Catalog by Taxonomy.
  * Search Results with faceted filters (Condition, Subject, Price, Language, Seller Rating).
  * Book Detail Page showing multiple seller copies of the same ISBN/Title.
  * Public Seller Profile.
  * Informational & Legal Pages: About, Delivery Policy, Returns & Refunds, Terms, Privacy Policy, Grievance Officer details.
* **Buyer Hub**:
  * Cart, Checkout, Order Tracking with real-time status steps, Wishlist.
* **Seller Studio**:
  * Listing Wizard (scan/search ISBN $\rightarrow$ upload photos $\rightarrow$ disclose defects $\rightarrow$ set price $\rightarrow$ choose pickup address).
  * Inventory Manager, Active Orders to pack, Settlement Ledger.

## 3. Flutter Mobile Application
* Multi-tab navigation: Home, Search, Sell (+ listing camera upload), My Orders, Account.
* Secure token persistence via `flutter_secure_storage`.
* Offline caching and skeleton loaders for smooth browsing on mobile networks.
