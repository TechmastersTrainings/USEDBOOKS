class ApiConstants {
  // Production Cloud Render Backend
  static const String baseUrl = 'https://usedbooks.onrender.com/api/v1';

  // Local Development Fallback
  static const String localBaseUrl = 'http://10.0.2.2:8000/api/v1'; // Android emulator to host

  // Auth Endpoints
  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';
  static const String refresh = '$baseUrl/auth/refresh';

  // User & Address Endpoints
  static const String userProfile = '$baseUrl/users/me';
  static const String addresses = '$baseUrl/users/me/addresses';

  // Book Catalog & Listings
  static const String categories = '$baseUrl/categories';
  static const String catalog = '$baseUrl/catalog';
  static const String listings = '$baseUrl/listings';
  static const String myListings = '$baseUrl/listings/me';

  // Orders & Checkout
  static const String orders = '$baseUrl/orders';
  static const String sellerOrders = '$baseUrl/orders/seller/list';
  static const String sellerEarnings = '$baseUrl/orders/seller/earnings';

  // Logistics & Shipments
  static const String shippingQuote = '$baseUrl/shipments/quote';
  static const String manifestShipment = '$baseUrl/shipments/manifest';

  // Health
  static const String health = '$baseUrl/health';
}
