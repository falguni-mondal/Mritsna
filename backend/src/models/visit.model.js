import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    // --- CORE IDENTIFICATION ---
    sessionId: {
      type: String,
      required: true,
      index: true,
      description: "Unique identifier stored in the user's 24-hour cookie"
    },

    // --- HIGH-LEVEL ATTRIBUTION (Granular Social Data) ---
    channel: {
      type: String,
      required: true,
      enum: [
        "Organic Search", 
        "Instagram",
        "Facebook",
        "YouTube",
        "Twitter",
        "LinkedIn",
        "TikTok",
        "Direct Traffic", 
        "Referral & PR",
        "Other"
      ],
      default: "Direct Traffic"
    },

    // --- GRANULAR TRAFFIC DATA (Future-proofing) ---
    sourceUrl: {
      type: String,
      default: null,
      description: "The exact referring URL (e.g., https://www.google.com/)"
    },
    
    // --- UTM MARKETING CAMPAIGNS (Future-proofing for Ads) ---
    utmSource: { type: String, default: null },   // e.g., 'facebook', 'newsletter'
    utmMedium: { type: String, default: null },   // e.g., 'cpc', 'email'
    utmCampaign: { type: String, default: null }, // e.g., 'summer_sale_2026'

    // --- TECHNICAL & DEVICE METRICS (Future-proofing for UI/UX optimization) ---
    deviceType: {
      type: String,
      enum: ["Mobile", "Tablet", "Desktop", "Unknown"],
      default: "Unknown"
    },
    browser: { type: String, default: null },
    os: { type: String, default: null },

    // --- GEOLOCATION (Future-proofing for regional marketing) ---
    country: { type: String, default: null },
    region: { type: String, default: null },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// --- PERFORMANCE INDEXING ---
visitSchema.index({ createdAt: -1, channel: 1 });

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;