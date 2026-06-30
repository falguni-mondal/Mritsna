import mongoose from 'mongoose';
import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// ==========================================
// LIGHTWEIGHT INVENTORY PING
// ==========================================
export const checkStock = async (req, res, next) => {
  try {
    const { productId, variantId, requestedQuantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ success: false, message: 'Invalid Product or Variant ID format.' });
    }

    const product = await Product.findOne(
      { _id: productId, status: 'active', 'variants._id': variantId },
      { 'variants.$': 1 }
    ).lean();

    if (!product || !product.variants.length) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    const variant = product.variants[0];
    const availableStock = variant.inventory.quantity;
    const isAvailable = requestedQuantity <= availableStock || variant.inventory.allowBackorder;

    return res.status(200).json({
      success: true,
      data: {
        availableStock,
        isAvailable,
        message: isAvailable ? 'In stock' : `Only ${availableStock} left in stock`
      }
    });
  } catch (error) {
    console.error("Error in checkStock:", error);
    next(error);
  }
};

// ==========================================
// GET USER CART (DYNAMIC PRICING ENGINE)
// ==========================================
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'title slug category isPremium variants'
    });

    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    if (!cart || !cart.items.length) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          items: [], 
          subTotal: 0,
          currencySymbol: regionData.symbol,
          currencyCode: regionData.currencyCode
        } 
      });
    }

    let subTotal = 0;
    
    // We run every saved item through the pricing engine
    const formattedItems = cart.items.map(cartItem => {
      if (!cartItem.product) return null;

      const activeVariant = cartItem.product.variants.find(
        v => v._id.toString() === cartItem.variantId.toString()
      );

      if (!activeVariant) return null;

      // --- APPLY THE PRICING ENGINE ---
      const localizedPricing = calculateRegionalPricing(
        activeVariant.pricing.price, 
        activeVariant.pricing.discountPercentage || 0, 
        cartItem.product.isPremium || false, 
        regionData
      );

      const itemTotalConverted = cartItem.quantity * localizedPricing.sellingPrice;
      subTotal += itemTotalConverted;

      return {
        cartItemId: cartItem._id,
        productId: cartItem.product._id,
        variantId: cartItem.variantId,
        slug: cartItem.product.slug,
        title: cartItem.product.title,
        colorName: activeVariant.colorName,
        img: activeVariant.images.find(img => img.isPrimary)?.baseUrl || activeVariant.images[0]?.baseUrl,
        price: localizedPricing.sellingPrice, // Perfect dynamic price
        originalPrice: localizedPricing.originalPrice, 
        quantity: cartItem.quantity,
        itemTotal: itemTotalConverted, 
        maxLimit: Math.min(5, activeVariant.inventory.quantity)
      };
    }).filter(item => item !== null); 

    return res.status(200).json({
      success: true,
      data: { 
        items: formattedItems, 
        subTotal,
        currencySymbol: regionData.symbol,      
        currencyCode: regionData.currencyCode    
      }
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    next(error);
  }
};

// ==========================================
// HYDRATE GUEST CART (NEW: DYNAMIC PRICING FOR LOCALSTORAGE)
// ==========================================
export const hydrateGuestCart = async (req, res, next) => {
  try {
    const { localItems } = req.body; 
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    if (!localItems || !Array.isArray(localItems) || localItems.length === 0) {
      return res.status(200).json({
        success: true,
        data: { items: [], subTotal: 0, currencySymbol: regionData.symbol, currencyCode: regionData.currencyCode }
      });
    }

    let subTotal = 0;
    const formattedItems = [];

    // Fetch live product data for the IDs sent from localStorage
    for (const item of localItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId) || !mongoose.Types.ObjectId.isValid(item.variantId)) {
        continue;
      }

      const product = await Product.findOne({ _id: item.productId, status: 'active' })
        .select('title slug category isPremium variants')
        .lean();

      if (!product) continue;

      const activeVariant = product.variants.find(v => v._id.toString() === item.variantId.toString());
      if (!activeVariant) continue;

      // Enforce absolute maximum limits based on DB inventory
      const maxAllowed = Math.min(5, activeVariant.inventory.quantity);
      const safeQuantity = Math.min(item.quantity, maxAllowed);

      if (safeQuantity <= 0 && !activeVariant.inventory.allowBackorder) continue; // Out of stock

      // --- APPLY THE PRICING ENGINE ---
      const localizedPricing = calculateRegionalPricing(
        activeVariant.pricing.price, 
        activeVariant.pricing.discountPercentage || 0, 
        product.isPremium || false, 
        regionData
      );

      const itemTotalConverted = safeQuantity * localizedPricing.sellingPrice;
      subTotal += itemTotalConverted;

      formattedItems.push({
        cartItemId: `guest-${item.variantId}`, // Fake ID for React keys
        productId: product._id,
        variantId: item.variantId,
        slug: product.slug,
        title: product.title,
        colorName: activeVariant.colorName,
        img: activeVariant.images.find(img => img.isPrimary)?.baseUrl || activeVariant.images[0]?.baseUrl,
        price: localizedPricing.sellingPrice,
        originalPrice: localizedPricing.originalPrice,
        quantity: safeQuantity,
        itemTotal: itemTotalConverted,
        maxLimit: maxAllowed
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        subTotal,
        currencySymbol: regionData.symbol,
        currencyCode: regionData.currencyCode
      }
    });

  } catch (error) {
    console.error("Error hydrating guest cart:", error);
    next(error);
  }
};

// ==========================================
// ADD TO CART (DUMB DATABASE UPDATE)
// ==========================================
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const { productId, variantId, quantity, availableStock } = req.verifiedItem; 

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.variantId.toString() === variantId.toString()
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      cart.items[existingItemIndex].quantity = Math.min(newQuantity, 5, availableStock);
      // REMOVED: Price is no longer saved
    } else {
      cart.items.push({
        product: productId,
        variantId: variantId,
        quantity: quantity,
        // REMOVED: Price is no longer saved
      });
    }

    await cart.save();
    return res.status(200).json({ success: true, message: 'Added to cart successfully.' });

  } catch (error) {
    console.error("Error adding to cart:", error);
    next(error);
  }
};

// ==========================================
// UPDATE QUANTITY
// ==========================================
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user;
    const { variantId, quantity } = req.verifiedItem; 

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.variantId.toString() === variantId.toString());
    
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      return res.status(200).json({ success: true, message: 'Cart updated.' });
    } else {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    next(error);
  }
};

// ==========================================
// REMOVE FROM CART
// ==========================================
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const { variantId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.variantId.toString() !== variantId.toString());
    
    await cart.save();
    return res.status(200).json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    console.error("Error removing from cart:", error);
    next(error);
  }
};

// ==========================================
// CLEAR CART
// ==========================================
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const cart = await Cart.findOne({ user: userId });
    
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    
    return res.status(200).json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    console.error("Error clearing cart:", error);
    next(error);
  }
};

// ==========================================
// GUEST TO USER MERGE (DUMB DATABASE UPDATE)
// ==========================================
export const syncCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const { localItems } = req.body; 

    if (!localItems || !localItems.length) {
      return res.status(200).json({ success: true, message: 'No local items to sync.' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    for (const localItem of localItems) {
      if (!mongoose.Types.ObjectId.isValid(localItem.productId) || !mongoose.Types.ObjectId.isValid(localItem.variantId)) {
        continue;
      }

      const product = await Product.findOne(
        { _id: localItem.productId, status: 'active', 'variants._id': localItem.variantId },
        { 'variants.$': 1 }
      ).lean();

      if (product && product.variants.length > 0) {
        const variant = product.variants[0];
        const dbStock = variant.inventory.quantity;

        if (dbStock > 0 || variant.inventory.allowBackorder) {
          const existingItemIndex = cart.items.findIndex(
            i => i.variantId.toString() === localItem.variantId.toString()
          );

          if (existingItemIndex > -1) {
            const combinedQty = cart.items[existingItemIndex].quantity + localItem.quantity;
            cart.items[existingItemIndex].quantity = Math.min(combinedQty, 5, dbStock);
            // REMOVED: Price is no longer saved
          } else {
            cart.items.push({
              product: localItem.productId,
              variantId: localItem.variantId,
              quantity: Math.min(localItem.quantity, 5, dbStock),
              // REMOVED: Price is no longer saved
            });
          }
        }
      }
    }

    await cart.save();
    return res.status(200).json({ success: true, message: 'Cart synchronized successfully.' });

  } catch (error) {
    console.error("Error syncing cart:", error);
    next(error);
  }
};