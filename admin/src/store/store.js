import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import adminCartReducer from "./slices/cartSlice";
import adminWishlistReducer from "./slices/wishlistSlice";
import adminCouponReducer from "./slices/couponSlice";
import adminOrderReducer from './slices/orderSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminProduct: productReducer,
    adminCart: adminCartReducer,
    adminWishlist: adminWishlistReducer,
    adminCoupon: adminCouponReducer,
    adminOrders: adminOrderReducer,
  },
});