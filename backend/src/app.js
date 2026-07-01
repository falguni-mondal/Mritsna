import express from "express";
import parser from "cookie-parser";
import cors from "cors";

// Custom Middlewares & Utils
// import noCache from "./middlewares/global/no-cache.js";
// import LeakyLimiter from "./utils/leaky-limiter.js";
// import UserLimiter from "./utils/user-limiter.js";

// Routes
import adminAuthRoutes from "./routes/admin/admin.auth.routes.js";
import adminProductRoutes from './routes/admin/admin.product.routes.js';
import adminCartRoutes from './routes/admin/admin.cart.routes.js';
import adminWishlistRoutes from './routes/admin/admin.wishlist.routes.js';
import adminCouponRoutes from './routes/admin/admin.coupon.routes.js';

import authRouter from "./routes/common/auth.routes.js";
import productRoutes from './routes/common/product.routes.js';
import cartRoutes from './routes/common/cart.routes.js';
import wishlistRoutes from './routes/common/wishlist.routes.js';
import checkoutRoutes from './routes/common/checkout.routes.js';
import regionRoutes from './routes/common/region.routes.js';

const app = express();

// 1. Trust Proxy (Crucial for Rate Limiters behind Load Balancers/Render)
app.set("trust proxy", true);

// 2. Security & Limiters (Uncomment when you bring your utils over)
// const globalLimiter = new LeakyLimiter(50);
// const userLimiter = new UserLimiter(40, 10000); 
// setInterval(() => userLimiter.cleanup(), 60000);

// app.use((req, res, next) => {
//   if (!userLimiter.check(req.ip)) {
//     return res.status(429).json({ success: false, message: "Too many requests!" });
//   }
//   next();
// });
// app.use(async (req, res, next) => { await globalLimiter.wait(); next(); });


// Webhook Specific Parser (Stripe/Payment Gateways need raw buffers)
// We isolate this so we don't waste memory buffering every standard JSON request
app.use("/api/webhooks", express.raw({ type: "application/json" }));


// Standard Body Parsers & Cookies
app.use(express.json({ limit: "10mb" })); // Added a limit to prevent payload DOS attacks
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(parser());


// Dynamic CORS (Controlled via .env)
// e.g., in .env: ALLOWED_ORIGINS=http://localhost:5173,https://mritsna.com
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [process.env.FRONTEND_URL, "http://localhost:5174"];

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

app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);
app.use('/api/v1/admin/carts', adminCartRoutes);
app.use('/api/v1/admin/wishlists', adminWishlistRoutes);
app.use('/api/v1/admin/coupons', adminCouponRoutes);

//  public routes
app.use("/api/v1/auth", authRouter);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/region', regionRoutes);


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