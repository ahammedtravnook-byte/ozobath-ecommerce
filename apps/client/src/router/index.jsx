import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@components/layout/Layout';

// ─── Lazy loaded pages for code splitting ────────
const HomePage = lazy(() => import('@pages/HomePage'));
const ShopPage = lazy(() => import('@pages/ShopPage'));
const ProductPage = lazy(() => import('@pages/ProductPage'));
const CartPage = lazy(() => import('@pages/CartPage'));
const CheckoutPage = lazy(() => import('@pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('@pages/OrderConfirmationPage'));
const OrderTrackingPage = lazy(() => import('@pages/OrderTrackingPage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));
const RegisterPage = lazy(() => import('@pages/RegisterPage'));
const ProfilePage = lazy(() => import('@pages/ProfilePage'));
const OrdersPage = lazy(() => import('@pages/OrdersPage'));
const WishlistPage = lazy(() => import('@pages/WishlistPage'));
const AboutPage = lazy(() => import('@pages/AboutPage'));
const ContactPage = lazy(() => import('@pages/ContactPage'));
const BlogListPage = lazy(() => import('@pages/BlogListPage'));
const BlogPostPage = lazy(() => import('@pages/BlogPostPage'));
const FAQPage = lazy(() => import('@pages/FAQPage'));
const ExperienceCentrePage = lazy(() => import('@pages/ExperienceCentrePage'));
const B2BEnquiryPage = lazy(() => import('@pages/B2BEnquiryPage'));
const ServiceRequestPage = lazy(() => import('@pages/ServiceRequestPage'));
const ShopLivePage = lazy(() => import('@pages/ShopLivePage'));
const SiteVisitPage = lazy(() => import('@pages/SiteVisitPage'));
const TermsPage = lazy(() => import('@pages/TermsPage'));
const PrivacyPage = lazy(() => import('@pages/PrivacyPage'));
const ShippingPolicyPage = lazy(() => import('@pages/ShippingPolicyPage'));
const WarrantyPage = lazy(() => import('@pages/WarrantyPage'));
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

// ─── Page Loading Fallback ───────────────────────
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-dark-400 font-medium animate-pulse">Loading...</p>
        </div>
    </div>
);

const AppRouter = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route element={<Layout />}>
                    {/* Public Pages */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/shop/:category" element={<ShopPage />} />
                    <Route path="/product/:slug" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                    <Route path="/track-order" element={<OrderTrackingPage />} />

                    {/* Auth Pages */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* User Pages */}
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />

                    {/* Info Pages */}
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/blog" element={<BlogListPage />} />
                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/experience-centre" element={<ExperienceCentrePage />} />

                    {/* Service Pages */}
                    <Route path="/b2b-enquiry" element={<B2BEnquiryPage />} />
                    <Route path="/service-request" element={<ServiceRequestPage />} />
                    <Route path="/shop-live" element={<ShopLivePage />} />
                    <Route path="/book-site-visit" element={<SiteVisitPage />} />

                    {/* Legal Pages */}
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                    <Route path="/warranty" element={<WarrantyPage />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRouter;
