import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';

// ==========================================
// 1. LIGHTWEIGHT INVENTORY PING (GUESTS & USERS)
// ==========================================
export const checkStock = async (req, res, next) => {
  try {
    const { productId, variantId, requestedQuantity } = req.body;

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
// 2. GET USER CART
// ==========================================
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch cart and populate the parent product details
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'title slug category isPremium variants'
    });

    if (!cart) {
      // Return a structural empty cart if they don't have one yet
      return res.status(200).json({ success: true, data: { items: [], subTotal: 0 } });
    }

    // Filter and format the cart to send clean data to the UI
    let subTotal = 0;
    const formattedItems = cart.items.map(cartItem => {
      // Find the specific variant details from the populated product
      const activeVariant = cartItem.product.variants.find(
        v => v._id.toString() === cartItem.variantId.toString()
      );

      // If the variant was deleted from the DB, we handle it gracefully
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
        // Max limit is the lesser of 5 or actual stock
        maxLimit: Math.min(5, activeVariant.inventory.quantity)
      };
    }).filter(item => item !== null); // Remove any nulls from deleted variants

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        subTotal
      }
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    next(error);
  }
};

// ==========================================
// 3. ADD TO CART (PROTECTED BY INVENTORY MIDDLEWARE)
// ==========================================
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // req.verifiedItem comes entirely from our inventoryCheck middleware!
    const { productId, variantId, quantity, price } = req.verifiedItem; 

    let cart = await Cart.findOne({ user: userId });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if variant is already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.variantId.toString() === variantId.toString()
    );

    if (existingItemIndex > -1) {
      // Increment quantity, but enforce the 5-item max limit
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      cart.items[existingItemIndex].quantity = Math.min(newQuantity, 5);
      
      // Update price in case it changed since they last added it
      cart.items[existingItemIndex].price = price; 
    } else {
      // Push new item
      cart.items.push({
        product: productId,
        variantId: variantId,
        quantity: quantity,
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
// 4. UPDATE QUANTITY (PROTECTED BY INVENTORY MIDDLEWARE)
// ==========================================
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // The exact updated quantity verified by middleware
    const { variantId, quantity, price } = req.verifiedItem; 

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.variantId.toString() === variantId.toString());
    
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = price; // Keep price synced
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
// 5. REMOVE FROM CART
// ==========================================
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
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
// 6. CLEAR CART (Used after checkout)
// ==========================================
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
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
// 7. GUEST TO USER MERGE (Runs on Login/Signup)
// ==========================================
export const syncCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { localItems } = req.body; // Array of items from frontend LocalStorage

    if (!localItems || !localItems.length) {
      return res.status(200).json({ success: true, message: 'No local items to sync.' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    // Loop through LocalStorage items and intelligently merge
    for (const localItem of localItems) {
      // 1. Verify the product and stock still exist in DB
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
            // Merge quantities, cap at min(5, dbStock)
            const combinedQty = cart.items[existingItemIndex].quantity + localItem.quantity;
            cart.items[existingItemIndex].quantity = Math.min(combinedQty, 5, dbStock);
            cart.items[existingItemIndex].price = currentPrice;
          } else {
            // Add as new item
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