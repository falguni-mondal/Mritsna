import mongoose from 'mongoose';

// Sub-Schema: Images (Dual-URL system) ---
const imageSchema = new mongoose.Schema({
  imagekitFileId: { 
    type: String, 
    required: [true, 'ImageKit File ID is required for storage management'] 
  },
  baseUrl: { 
    type: String, 
    required: [true, 'High-resolution base URL is required'] 
  },
  altText: { 
    type: String,
    required: [true, 'Alt text is required for SEO and accessibility']
  },
  isPrimary: { 
    type: Boolean, 
    default: false 
  },
  displayOrder: {
    type: Number,
    default: 0 
  }
});

// Custom validator to enforce the 5-image maximum
function imageLimit(val) {
  return val.length <= 5;
}

// Sub-Schema: Color Variants ---
const variantSchema = new mongoose.Schema({
  colorName: { 
    type: String, 
    required: [true, 'Color name is required (e.g., Obsidian)'] 
  },
  colorHex: { 
    type: String, 
    required: [true, 'Hex code is required for UI color swatches (e.g., #1A1A1A)'] 
  },
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  images: {
    type: [imageSchema],
    validate: [imageLimit, 'A color variant cannot exceed 5 images.']
  }
});

// Main Product Schema ---
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxLength: [150, 'Title cannot exceed 150 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true 
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  category: {
    type: String,
    enum: ['Vases', 'Lighting', 'Dinnerware', 'Decor', 'Sculpture'], 
    required: true,
    index: true
  },
  
  // Base Pricing & Tax (Assuming all colors of the same product cost the same)
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    baseCurrency: {
      type: String,
      default: 'INR',
      required: true
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxClass: {
      type: String,
      default: 'standard', 
      required: true
    },
    hsnCode: {
      type: String,
      required: true, 
    }
  },

  // Logistics
  shipping: {
    weightGrams: {
      type: Number,
      required: true 
    },
    dimensions: {
      lengthCm: { type: Number, required: true },
      widthCm: { type: Number, required: true },
      heightCm: { type: Number, required: true }
    },
    isFragile: {
      type: Boolean,
      default: true 
    }
  },

  // Base Attributes
  attributes: {
    material: { type: String, required: true },
    finish: { type: String }
  },

  // --- THE VARIANTS ARRAY ---
  variants: {
    type: [variantSchema],
    required: [true, 'A product must have at least one variant.']
  },

  // SEO & State
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual calculation for frontend discounts
productSchema.virtual('finalPrice').get(function() {
  if (this.pricing.discountPercentage > 0) {
    return this.pricing.basePrice - (this.pricing.basePrice * (this.pricing.discountPercentage / 100));
  }
  return this.pricing.basePrice;
});

const Product = mongoose.model('Product', productSchema);

export default Product;