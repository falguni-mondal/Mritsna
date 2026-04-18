// This ensures our cookies are completely locked down in production
const isProduction = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true, // Prevents XSS attacks (JavaScript cannot read the cookie)
  secure: isProduction, // HTTPS only in production
  sameSite: isProduction ? "none" : "lax", // 'none' required for cross-domain cookies
  domain: isProduction ? process.env.COOKIE_DOMAIN : "localhost", // e.g., ".mritsna.com"
};

export const clearCookieOptions = {
  ...cookieOptions,
  maxAge: 0,
};