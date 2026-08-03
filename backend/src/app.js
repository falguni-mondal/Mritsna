import express from "express";
import parser from "cookie-parser";
import cors from "cors";

// Custom Middlewares & Utils
import { globalLimiter } from "./middleware/common/rateLimiter.js";
// import noCache from "./middlewares/global/no-cache.js";
// import LeakyLimiter from "./utils/leaky-limiter.js";
// import UserLimiter from "./utils/user-limiter.js";

// Routes
import adminAuthRoutes from "./routes/admin/admin.auth.routes.js";
import adminProductRoutes from './routes/admin/admin.product.routes.js';
import adminCartRoutes from './routes/admin/admin.cart.routes.js';
import adminWishlistRoutes from './routes/admin/admin.wishlist.routes.js';
import adminCouponRoutes from './routes/admin/admin.coupon.routes.js';
import adminOrderRoutes from './routes/admin/admin.order.routes.js';
import adminReviewRoutes from './routes/admin/admin.review.routes.js';
import adminCollectionRoutes from './routes/admin/admin.collection.routes.js';

import authRouter from "./routes/common/auth.routes.js";
import productRoutes from './routes/common/product.routes.js';
import cartRoutes from './routes/common/cart.routes.js';
import wishlistRoutes from './routes/common/wishlist.routes.js';
import checkoutRoutes from './routes/common/checkout.routes.js';
import regionRoutes from './routes/common/region.routes.js';
import orderRoutes from './routes/common/order.routes.js';
import addressRoutes from './routes/common/address.routes.js';
import webhookRoutes from './routes/common/webhook.routes.js';
import reviewRoutes from './routes/common/review.routes.js';
import collectionRoutes from './routes/common/collection.routes.js';

const app = express();

// Trust Proxy (Crucial for Rate Limiters behind Load Balancers/Render)
// This ensures the rate limiter blocks the attacker's IP, not Render's internal IP.
app.set("trust proxy", true);


// Webhook Specific Parser (Stripe/Payment Gateways need raw buffers)
// We isolate this so we don't waste memory buffering every standard JSON request
app.use("/api/v1/webhooks", express.raw({ type: "application/json" }));
app.use('/api/v1/webhooks', webhookRoutes);


// Standard Body Parsers & Cookies
// RAM SHIELD: Lowered from 10mb to 2mb. 10mb JSON payloads can easily crash a 512MB RAM server via a DoS attack.
app.use(express.json({ limit: "2mb" })); 
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(parser());


// GLOBAL RATE LIMITER
// Applied here so it protects all standard API routes below, but allows Webhooks above to bypass it.
app.use(globalLimiter);


// Dynamic CORS -----------------------------------------------------------------------------------------------------------------------------
const allowedOrigins = [process.env.FRONTEND_URL, process.env.ADMIN_FRONTEND_URL, process.env.SUB_FRONTEND_URL];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// ROUTES -------------------------------------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy." });
});

// Admin Routes
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/carts', adminCartRoutes);
app.use('/api/v1/admin/wishlists', adminWishlistRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/v1/admin/collections', adminCollectionRoutes);

// Public Routes
app.use("/api/v1/auth", authRouter);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/region', regionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/collections', collectionRoutes);


// Global Catch-All Error Handler (MANDATORY for preventing server crashes)
app.use((err, req, res, next) => {
  console.error("[Global Error]:", err.message || err);
  
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "CORS Error: Unauthorized Origin" });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;