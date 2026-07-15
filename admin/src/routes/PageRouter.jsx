import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { GuestGuard, VerifyGuard, AdminGuard } from "./Guards";

// Layout Shell
import AdminLayout from "../components/Layout/AdminLayout";

// Auth Pages
import SignIn from "../pages/auth/SignIn";
import Verification from "../pages/auth/Verification";

// Panel Pages
import Dashboard from "../pages/panel/Dashboard";
import Products from "../pages/panel/Products";
import AddProduct from "../pages/services/product/AddProduct";
import EditProduct from "../pages/services/product/EditProduct";
import Inventory from "../pages/panel/Inventory";
import Carts from "../pages/panel/Carts";
import Wishlists from "../pages/panel/Wishlists";
import Coupons from "../pages/panel/Coupons";
import Orders from "../pages/panel/Orders";
import OrderDetails from "../pages/services/orders/OrderDetails";
import Reviews from "../pages/panel/Reviews";
import ReviewDetails from "../pages/services/reviews/ReviewDetails";
import Collections from "../pages/panel/Collections";
import CollectionForm from "../pages/services/collection/CollectionForm";
// import Orders from "../pages/panel/Orders";
// import Carts from "../pages/panel/Carts";
// import Wishlists from "../pages/panel/Wishlists";
// import Reviews from "../pages/panel/Reviews";
// import Coupons from "../pages/panel/Coupons";

const PageRouter = () => {
  return (
    <Routes>
      {/* Base Redirect: Instantly route root traffic to the secure dashboard */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Public / Auth Routes */}
      <Route 
        path="/signin" 
        element={
          <GuestGuard>
            <SignIn />
          </GuestGuard>
        } 
      />
      
      <Route 
        path="/verify" 
        element={
          <VerifyGuard>
            <Verification />
          </VerifyGuard>
        } 
      />

      {/* Protected Admin Routes (Nested Architecture) */}
      <Route 
        path="/admin" 
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        {/* Child routes injected seamlessly into the AdminLayout Outlet */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Product Routes */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="carts" element={<Carts />} />
        <Route path="wishlists" element={<Wishlists />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderId" element={<OrderDetails />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="reviews/:productId" element={<ReviewDetails />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/new" element={<CollectionForm />} />
        <Route path="collections/edit/:id" element={<CollectionForm />} />


        {/* <Route path="orders" element={<Orders />} /> */}
        {/* <Route path="carts" element={<Carts />} /> */}
        {/* <Route path="wishlists" element={<Wishlists />} /> */}
        {/* <Route path="reviews" element={<Reviews />} /> */}
        {/* <Route path="coupons" element={<Coupons />} /> */}

        {/* Fallback for anyone hitting /admin directly without a sub-path */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Catch-All: Redirect lost users back to safety */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default PageRouter;