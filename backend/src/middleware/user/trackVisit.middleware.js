import crypto from "crypto";
import Visit from "../../models/visit.model.js"; 

export const trackVisit = async (req, res, next) => {
  try {
    // Check for existing session (24-hour cooldown)
    if (req.cookies && req.cookies.store_session) {
      return next();
    }

    // Extract Data from the Request
    const referer = req.get("Referrer") || req.get("Referer") || "";
    const userAgent = req.get("User-Agent") || "";
    const { utm_source, utm_medium, utm_campaign } = req.query;

    // The Categorization Engine (Now highly granular)
    let channel = "Direct Traffic";
    const refererLower = referer.toLowerCase();
    const sourceLower = (utm_source || "").toLowerCase();

    // Check for Organic Search
    if (
      refererLower.includes("google.") || 
      refererLower.includes("bing.com") || 
      refererLower.includes("yahoo.com") || 
      refererLower.includes("duckduckgo.com")
    ) {
      channel = "Organic Search";
    } 
    // Check for Granular Social Media Networks
    else if (refererLower.includes("instagram.com") || sourceLower.includes("instagram")) {
      channel = "Instagram";
    } 
    else if (refererLower.includes("facebook.com") || sourceLower.includes("facebook")) {
      channel = "Facebook";
    } 
    else if (refererLower.includes("youtube.com") || sourceLower.includes("youtube")) {
      channel = "YouTube";
    } 
    else if (refererLower.includes("twitter.com") || refererLower.includes("x.com") || sourceLower.includes("twitter")) {
      channel = "Twitter";
    } 
    else if (refererLower.includes("linkedin.com") || sourceLower.includes("linkedin")) {
      channel = "LinkedIn";
    } 
    else if (refererLower.includes("tiktok.com") || sourceLower.includes("tiktok")) {
      channel = "TikTok";
    } 
    // Check for standard Referrals (Not search, not social, but came from a link)
    else if (referer !== "") {
      const host = req.get("host") || "";
      if (!refererLower.includes(host.toLowerCase())) {
        channel = "Referral & PR";
      }
    }

    // Lightweight Device Detection
    let deviceType = "Desktop";
    const uaLower = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(uaLower)) {
      deviceType = "Tablet";
    } else if (
      /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(uaLower)
    ) {
      deviceType = "Mobile";
    }

    // Generate a unique ID for this session
    const sessionId = crypto.randomUUID();

    // Save the record to the database silently
    await Visit.create({
      sessionId,
      channel,
      sourceUrl: referer || null,
      utmSource: utm_source || null,
      utmMedium: utm_medium || null,
      utmCampaign: utm_campaign || null,
      deviceType,
      browser: userAgent.substring(0, 100), 
    });

    // Drop the 24-hour cookie into the user's browser
    res.cookie("store_session", sessionId, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
    });

    // Continue to the actual requested route
    next();

  } catch (error) {
    console.error("[Analytics Error]: Failed to track visit -", error.message);
    next();
  }
};