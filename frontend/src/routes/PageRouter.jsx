import React from "react";
import { Route, Routes } from "react-router-dom";
import Homepage from "../pages/Homepage";
import About from "../pages/About";
import Shop from "../pages/Shop";
import Product from "../pages/Product";
import SignIn from "../pages/Signin";
import SignUp from "../pages/SignUp";
import Verification from "../pages/Verification";
import Dashboard from "../pages/Dashboard";
import GuestRoute from "../components/auth/GuestRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const PageRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/about" element={<About />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<Product />} />

      {/* GUEST ROUTES (Only accessible if NOT logged in) */}
      <Route element={<GuestRoute />}>
        <Route path="/account/signin" element={<SignIn />} />
        <Route path="/account/signup" element={<SignUp />} />
        <Route path="/account/verify" element={<Verification />} />
      </Route>

      {/* PROTECTED ROUTES (Only accessible IF logged in) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<Dashboard />} />
        {/* Future nested routes: /account/orders, /account/addresses */}
      </Route>
    </Routes>
  );
};

export default PageRouter;
