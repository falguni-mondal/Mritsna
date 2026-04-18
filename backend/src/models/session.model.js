import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    device_id: { 
      type: String, 
      required: true
    },
    ip_address: { 
      type: String, 
      required: true
    },
    user_agent: { 
      type: String
    },
    role: { 
      type: String, 
      default: "user" 
    },
    expiry_at: { 
      type: Date, 
      required: true
    }
  },
  { 
    timestamps: true 
  }
);

export default mongoose.model("Session", sessionSchema);