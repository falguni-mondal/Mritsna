import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// ==========================================
// HELPER: CALCULATE CART VALUE (DUAL ENGINE)
// Calculates strict base INR for accounting, and localized foreign pricing if region is provided.
// ==========================================
const calculateLiveCartMetrics = (cart, regionData = null) => {
  let cartTotalBaseINR = 0; 
  let cartTotalLocalized = 0; 
  let totalItems = 0;
  const detailedItems = [];

  if (cart.items && cart.items.length > 0) {
    cart.items.forEach(cartItem => {
      if (!cartItem.product) return; // Skip if product was deleted from DB

      const variant = cartItem.product.variants.find(
        v => v._id.toString() === cartItem.variantId.toString()
      );

      if (variant) {
        // 1. Strict Base INR Calculation (No export markups)
        const basePrice = variant.pricing?.price || 0;
        const discount = variant.pricing?.discountPercentage || 0;
        const baseSellingPriceINR = discount > 0 
          ? Math.round(basePrice - (basePrice * (discount / 100))) 
          : basePrice;

        cartTotalBaseINR += baseSellingPriceINR * cartItem.quantity;
        totalItems += cartItem.quantity;

        // 2. Foreign/Localized Calculation (If region is provided)
        let localizedData = null;
        if (regionData) {
          const regionalPricing = calculateRegionalPricing(
            basePrice,
            discount,
            cartItem.product.isPremium || false,
            regionData
          );
          
          localizedData = {
            unitPrice: regionalPricing.sellingPrice,
            itemTotal: regionalPricing.sellingPrice * cartItem.quantity,
            currencyCode: regionalPricing.currencyCode,
            symbol: regionalPricing.symbol
          };
          cartTotalLocalized += localizedData.itemTotal;
        }

        detailedItems.push({
          cartItemId: cartItem._id,
          productId: cartItem.product._id,
          title: cartItem.product.title,
          slug: cartItem.product.slug,
          isPremium: cartItem.product.isPremium,
          variantId: variant._id,
          color: variant.colorName,
          sku: variant.sku,
          baseUnitPriceINR: baseSellingPriceINR,
          baseItemTotalINR: baseSellingPriceINR * cartItem.quantity,
          localizedData, // Null if regionData is not passed
          quantityInCart: cartItem.quantity,
          stockAvailable: variant.inventory?.quantity || 0,
          isStockBottleneck: cartItem.quantity > (variant.inventory?.quantity || 0),
          image: variant.images.find(img => img.isPrimary)?.baseUrl || variant.images[0]?.baseUrl
        });
      }
    });
  }

  return { cartTotalBaseINR, cartTotalLocalized, totalItems, detailedItems };
};

// ==========================================
// 1. GET DASHBOARD METRICS (OVERVIEW)
// ==========================================
export const getCartDashboardStats = async (req, res, next) => {
  try {
    const activeCarts = await Cart.find({ 'items.0': { $exists: true } })
      .populate({
        path: 'items.product',
        select: 'variants'
      })
      .lean();

    let totalPipelineValue = 0;
    let abandonedCartsCount = 0;
    let totalActiveCarts = activeCarts.length;
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const productPopularity = {}; 

    activeCarts.forEach(cart => {
      // Intentionally NOT passing region data here. We strictly want Base INR for dashboard accounting.
      const metrics = calculateLiveCartMetrics(cart);
      totalPipelineValue += metrics.cartTotalBaseINR;

      if (new Date(cart.updatedAt) < yesterday) {
        abandonedCartsCount++;
      }

      metrics.detailedItems.forEach(item => {
        if (!productPopularity[item.productId]) {
          productPopularity[item.productId] = { title: item.title, count: 0 };
        }
        productPopularity[item.productId].count += item.quantityInCart;
      });
    });

    const topCartedProducts = Object.values(productPopularity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalActiveCarts,
        abandonedCartsCount,
        totalPipelineValue,
        averageCartValue: totalActiveCarts > 0 ? Math.round(totalPipelineValue / totalActiveCarts) : 0,
        topCartedProducts
      }
    });

  } catch (error) {
    console.error("[Admin Cart Stats Error]", error);
    next(error);
  }
};

// ==========================================
// 2. GET PAGINATED LIST (THE SPLIT-VIEW TABLE)
// ==========================================
export const getAllActiveCarts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const filterType = req.query.filter || 'all'; 

    let dateFilter = {};
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (filterType === 'abandoned') {
      dateFilter = { updatedAt: { $lt: yesterday } };
    } else if (filterType === 'recent') {
      dateFilter = { updatedAt: { $gte: yesterday } };
    }

    const query = { 'items.0': { $exists: true }, ...dateFilter };
    const skip = (page - 1) * limit;

    const [carts, totalCount] = await Promise.all([
      Cart.find(query)
        .populate({ path: 'user', select: 'firstName lastName email' })
        .populate({ path: 'items.product', select: 'variants' })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Cart.countDocuments(query)
    ]);

    const formattedCarts = carts.map(cart => {
      // Again, strict Base INR for the table view
      const metrics = calculateLiveCartMetrics(cart);
      const isAbandoned = new Date(cart.updatedAt) < yesterday;

      return {
        cartId: cart._id,
        user: cart.user ? {
          id: cart.user._id,
          name: `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() || 'Unknown User',
          email: cart.user.email
        } : { name: 'Deleted User', email: 'N/A' },
        itemCount: metrics.totalItems,
        cartValueINR: metrics.cartTotalBaseINR,
        isAbandoned,
        lastActive: cart.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedCarts,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("[Admin Get All Carts Error]", error);
    next(error);
  }
};

// ==========================================
// 3. GET DEEP-DIVE DETAILS FOR A SPECIFIC CART
// ==========================================
export const getCartDetails = async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findById(cartId)
      // Added lastKnownRegion to the select array so the dual-engine has the data it needs
      .populate({ path: 'user', select: 'firstName lastName email phoneCode phoneNumber createdAt lastKnownRegion' })
      .populate({ path: 'items.product', select: 'title slug isPremium variants' })
      .lean();

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Pass the user's region data to trigger the dual-calculation engine
    const userRegion = cart.user?.lastKnownRegion;
    const metrics = calculateLiveCartMetrics(cart, userRegion);

    let formattedUser = null;
    if (cart.user) {
      formattedUser = {
        id: cart.user._id,
        name: `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() || 'Unknown User',
        email: cart.user.email,
        phone: cart.user.phoneNumber ? `${cart.user.phoneCode || ''} ${cart.user.phoneNumber}`.trim() : 'Not Provided',
        registeredAt: cart.user.createdAt,
        countryCode: userRegion?.countryCode || 'IN'
      };
    }

    // Determine if the user is operating in a foreign currency
    const isForeign = userRegion && userRegion.countryCode !== 'IN' && userRegion.countryCode !== 'INDIA';

    return res.status(200).json({
      success: true,
      data: {
        cartId: cart._id,
        user: formattedUser,
        summary: {
          totalItems: metrics.totalItems,
          cartValueBaseINR: metrics.cartTotalBaseINR,
          cartValueLocalized: metrics.cartTotalLocalized,
          currencyCode: userRegion?.currencyCode || 'INR',
          symbol: userRegion?.symbol || '₹',
          isForeign,
          lastActive: cart.updatedAt,
        },
        items: metrics.detailedItems
      }
    });

  } catch (error) {
    console.error("[Admin Get Cart Details Error]", error);
    next(error);
  }
};

// ==========================================
// 4. ADMIN OVERRIDE: CLEAR A CART
// ==========================================
export const adminClearUserCart = async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Cart cleared successfully. Inventory hold released.' 
    });

  } catch (error) {
    console.error("[Admin Clear Cart Error]", error);
    next(error);
  }
};

// ==========================================
// 5. ABANDONED CART ACTION: SEND REMINDER (MOCK)
// ==========================================
export const triggerAbandonedCartEmail = async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.findById(cartId).populate('user');
    if (!cart || !cart.user) {
      return res.status(404).json({ success: false, message: 'Valid cart and user required' });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Abandoned cart reminder queued for ${cart.user.email}` 
    });

  } catch (error) {
    console.error("[Admin Abandoned Cart Email Error]", error);
    next(error);
  }
};