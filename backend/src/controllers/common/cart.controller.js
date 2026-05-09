import mongoose from 'mongoose';
import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';

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
// GET USER CART
// ==========================================
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'title slug category isPremium variants'
    });

    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], subTotal: 0 } });
    }

    let subTotal = 0;
    const formattedItems = cart.items.map(cartItem => {
      
      if (!cartItem.product) return null;

      const activeVariant = cartItem.product.variants.find(
        v => v._id.toString() === cartItem.variantId.toString()
      );

      if (!activeVariant) return null;

      const itemTotal = cartItem.quantity * cartItem.price;
      subTotal += itemTotal;

      return {
        cartItemId: cartItem._id,
        productId: cartItem.product._id,
        variantId: cartItem.variantId,
        slug: cartItem.product.slug,
        title: cartItem.product.title,
        colorName: activeVariant.colorName,
        img: activeVariant.images.find(img => img.isPrimary)?.baseUrl || activeVariant.images[0]?.baseUrl,
        price: cartItem.price,
        quantity: cartItem.quantity,
        itemTotal: itemTotal,
        maxLimit: Math.min(5, activeVariant.inventory.quantity)
      };
    }).filter(item => item !== null); 

    return res.status(200).json({
      success: true,
      data: { items: formattedItems, subTotal }
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    next(error);
  }
};

// ==========================================
// ADD TO CART
// ==========================================
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user;
    // req.verifiedItem includes `availableStock` passed down from inventoryCheck middleware
    const { productId, variantId, quantity, price, availableStock } = req.verifiedItem; 

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.variantId.toString() === variantId.toString()
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // FIX 1: Enforce both the 5-item limit AND the actual warehouse stock limit
      cart.items[existingItemIndex].quantity = Math.min(newQuantity, 5, availableStock);
      cart.items[existingItemIndex].price = price; 
    } else {
      cart.items.push({
        product: productId,
        variantId: variantId,
        quantity: quantity, // Middleware already verified this is <= stock
        price: price
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
    const { variantId, quantity, price } = req.verifiedItem; 

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.variantId.toString() === variantId.toString());
    
    if (itemIndex > -1) {
      // This is an absolute overwrite from the UI, so middleware check is sufficient
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = price; 
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
// GUEST TO USER MERGE
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
        const currentPrice = variant.pricing.discountPercentage > 0 
          ? variant.pricing.price - (variant.pricing.price * (variant.pricing.discountPercentage / 100))
          : variant.pricing.price;

        if (dbStock > 0 || variant.inventory.allowBackorder) {
          const existingItemIndex = cart.items.findIndex(
            i => i.variantId.toString() === localItem.variantId.toString()
          );

          if (existingItemIndex > -1) {
            const combinedQty = cart.items[existingItemIndex].quantity + localItem.quantity;
            cart.items[existingItemIndex].quantity = Math.min(combinedQty, 5, dbStock);
            cart.items[existingItemIndex].price = currentPrice;
          } else {
            cart.items.push({
              product: localItem.productId,
              variantId: localItem.variantId,
              quantity: Math.min(localItem.quantity, 5, dbStock),
              price: currentPrice
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