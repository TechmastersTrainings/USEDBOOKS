import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { BookDetails } from './pages/BookDetails';
import { Sell } from './pages/Sell';
import { About } from './pages/About';
import { DeliveryPolicy } from './pages/DeliveryPolicy';
import { ReturnsRefunds } from './pages/ReturnsRefunds';
import { SellerPolicy } from './pages/SellerPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Grievance } from './pages/Grievance';
import { HelpCenter } from './pages/HelpCenter';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderDetails } from './pages/OrderDetails';
import './styling/tokens.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/book/:id" element={<BookDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:id" element={<OrderDetails />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/delivery-policy" element={<DeliveryPolicy />} />
              <Route path="/returns" element={<ReturnsRefunds />} />
              <Route path="/seller-policy" element={<SellerPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/grievance" element={<Grievance />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <CookieBanner />
        </div>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
