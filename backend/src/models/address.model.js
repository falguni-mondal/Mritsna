import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true 
  },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { 
    type: String, 
    required: true,
    index: true // Indexed for rapid Tax (CGST vs IGST) queries
  },
  pinCode: { 
    type: String, 
    required: true,
    index: true
  },
  country: { type: String, default: 'India' },
  type: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home'
  },
  // Soft Delete
  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Address', addressSchema);