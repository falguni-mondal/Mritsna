import mongoose from 'mongoose';

// ==========================================
// Sub-Schema: Cart Item (Identity Only)
// ==========================================
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Variant ID is required to identify the specific color/option']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity cannot be less than 1'],
    max: [5, 'Maximum 5 items allowed per variant per order'],
    default: 1
  }
  // Notice: The 'price' field has been completely removed. 
  // The database is no longer responsible for storing static financial data.
}, { 
  // We keep _id true so Mongoose generates a unique ID for each item in the array.
  // This makes it much easier to target and delete specific items later.
  _id: true 
});

// ==========================================
// Main Schema: User Cart
// ==========================================
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cart must belong to a user'],
    unique: true, // Crucial: Ensures one user cannot accidentally spawn multiple cart documents
    index: true   // Speeds up query time when fetching the cart on page load
  },
  items: {
    type: [cartItemSchema],
    default: []
  }
}, {
  timestamps: true, // Automatically tracks createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// Instance Methods (Optional Enterprise Additions)
// ==========================================

// Quickly clear the entire cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;