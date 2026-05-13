import mongoose from 'mongoose';

// Define the individual item structure inside the wishlist
const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: String, // String format based on how your frontend tracks variants
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  _id: false // Prevents Mongoose from generating redundant ObjectIds for sub-items
});

// Define the main wishlist document linked to the user
const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Strict 1:1 relationship: One user = One wishlist document
    index: true   // Speeds up queries when searching for a user's wishlist
  },
  items: [wishlistItemSchema]
}, {
  timestamps: true // Automatically tracks when the wishlist was created and last updated
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;