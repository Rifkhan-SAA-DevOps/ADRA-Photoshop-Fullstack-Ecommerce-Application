import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Home from "./pages/Home.jsx";
import Services from "./pages/Services.jsx";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Events from "./pages/Events.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import Gallery from "./pages/Gallery.jsx";
import Contact from "./pages/Contact.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import EventBookingsPage from "./pages/admin/EventBookingsPage.jsx";
import ProductOrdersPage from "./pages/admin/ProductOrdersPage.jsx";

import RequestsPage from "./pages/admin/RequestsPage.jsx";
import ReviewsPage from "./pages/admin/ReviewsPage.jsx";
import SettingsPage from "./pages/admin/SettingsPage.jsx";
import ManageHeroImageGrid from "./pages/admin/ManageHeroImageGrid.jsx";
import CustomersPage from "./pages/admin/CustomersPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import ProfilePage from "./pages/admin/ProfilePage.jsx";
import ManageServices from "./pages/admin/ManageServices.jsx";
import ServiceForm from "./pages/admin/ServiceForm.jsx";
import ServiceView from "./pages/admin/ServiceView.jsx";
import BookingRequestsPage from "./pages/admin/BookingRequestsPage.jsx";
import ContactRequestsPage from "./pages/admin/ContactRequestsPage.jsx";
import ManageProducts from "./pages/admin/ManageProducts.jsx";
import ProductForm from "./pages/admin/ProductForm.jsx";
import ProductView from "./pages/admin/ProductView.jsx";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage.jsx";
import ManageEvents from "./pages/admin/ManageEvents.jsx";
import EventForm from "./pages/admin/EventForm.jsx";
import EventView from "./pages/admin/EventView.jsx";
import AdminForgotPassword from "./pages/AdminForgotPassword.jsx";
import AdminUpdatePassword from "./pages/AdminUpdatePassword.jsx";
function Public({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Public>
            <Home />
          </Public>
        }
      />

      <Route
        path="/services"
        element={
          <Public>
            <Services />
          </Public>
        }
      />
      <Route
        path="/services/:slug"
        element={
          <Public>
            <ServiceDetail />
          </Public>
        }
      />

      <Route
        path="/products"
        element={
          <Public>
            <Products />
          </Public>
        }
      />
      <Route
        path="/products/:slug"
        element={
          <Public>
            <ProductDetail />
          </Public>
        }
      />

      <Route
        path="/events"
        element={
          <Public>
            <Events />
          </Public>
        }
      />
      <Route
        path="/events/:slug"
        element={
          <Public>
            <EventDetail />
          </Public>
        }
      />

      <Route
        path="/gallery"
        element={
          <Public>
            <Gallery />
          </Public>
        }
      />
      <Route
        path="/contact"
        element={
          <Public>
            <Contact />
          </Public>
        }
      />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/update-password" element={<AdminUpdatePassword />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Services admin */}
        <Route path="services" element={<ManageServices />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:id" element={<ServiceView />} />
        <Route path="services/:id/edit" element={<ServiceForm />} />

        {/* Products admin */}
        <Route path="products" element={<ManageProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductView />} />
        <Route path="products/:id/edit" element={<ProductForm />} />

        {/* Events admin */}
        <Route path="events" element={<ManageEvents />} />
        <Route path="events/new" element={<EventForm />} />
        <Route path="events/:id" element={<EventView />} />
        <Route path="events/:id/edit" element={<EventForm />} />
        <Route path="bookings" element={<EventBookingsPage />} />
        <Route path="orders" element={<ProductOrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="contacts" element={<ContactRequestsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="hero-image-grid" element={<ManageHeroImageGrid />} />

        {/* Review admin */}
        <Route path="reviews" element={<AdminReviewsPage />} />
      </Route>

      <Route
        path="*"
        element={
          <Public>
            <div className="section-padding py-24">
              <div className="container-max">
                <h1 className="text-5xl font-black">Page not found</h1>
              </div>
            </div>
          </Public>
        }
      />
    </Routes>
  );
}
