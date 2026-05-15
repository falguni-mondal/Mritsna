import mongoose from "mongoose";

const exchangeRateSchema = new mongoose.Schema(
  {
    // The currency all rates are compared against (e.g., "INR")
    baseCurrency: {
      type: String,
      required: true,
      default: "INR",
      unique: true, // We only ever need one document for INR
    },
    
    // A flexible map to store all the currency codes and their multipliers
    // Example: { "USD": 0.012, "EUR": 0.011, "AED": 0.044 }
    rates: {
      type: Map,
      of: Number,
      required: true,
    },
    
    // Tracks exactly when the API was last called
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema);

export default ExchangeRate;