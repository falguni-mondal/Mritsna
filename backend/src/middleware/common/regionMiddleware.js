import geoip from 'geoip-lite';
import { getCurrencyForCountry, updateLiveExchangeRates } from '../../config/currencyMap.js';

export const regionMiddleware = async (req, res, next) => {
  try {
    // Fire the lazy update checker in the background
    // It will silently update the DB if the 12-hour window has passed.
    updateLiveExchangeRates().catch(err => console.error("Lazy update failed:", err));

    let countryCode = "IN"; // Default fallback

    // PRIORITY A: Frontend Explicit Header (Driven by React localStorage)
    if (req.headers['x-user-region']) {
      countryCode = req.headers['x-user-region'].toUpperCase();
    }
    // PRIORITY B: Manual user override in cookies
    else if (req.cookies && req.cookies.region) {
      countryCode = req.cookies.region.toUpperCase();
    } 
    // PRIORITY C: Guess via Geo-IP
    else {
      // req.ip usually works, but x-forwarded-for is needed if you are behind a proxy/load balancer
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || req.ip;
      
      // FOR LOCAL TESTING: Uncomment the Google IP below to simulate a US visitor
      // const ip = "8.8.8.8"; 
      
      if (ip) {
        const geo = geoip.lookup(ip);
        if (geo && geo.country) {
          countryCode = geo.country;
        }
      }
    }

    // Look up the math from our master dictionary
    const regionData = await getCurrencyForCountry(countryCode);

    // Attach it to the request object so all controllers can use it
    req.region = regionData;

    next();
  } catch (error) {
    console.error("[Region Middleware Error]:", error);
    // If anything catastrophically fails, default to INR so the app doesn't crash
    req.region = {
      countryCode: "IN",
      currencyCode: "INR",
      symbol: "₹",
      rate: 1,
    };
    next();
  }
};