import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// ==========================================
// HELPER: CALCULATE CART VALUE (TRUE REVENUE ENGINE)
// Applies export markups to the Base INR if the user is foreign, 
// ensuring the dashboard reflects accurate Gross Merchandise Value.
// ==========================================
const calculateLiveCartMetrics = (cart, regionData = null) => {
  let cartTotalBaseINR = 0; 
  let cartTotalLocalized = 0; 
  let totalItems = 0;
  const detailedItems = [];

  // Determine if user is foreign based on passed region data
  const isForeign = regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA';

  if (cart.items && cart.items.length > 0) {
    cart.items.forEach(cartItem => {
      if (!cartItem.product) return; 

      const variant = cartItem.product.variants.find(
        v => v._id.toString() === cartItem.variantId.toString()
      );

      if (variant) {
        const basePrice = variant.pricing?.price || 0;
        const discount = variant.pricing?.discountPercentage || 0;
        
        // 1. Calculate raw product price in INR
        let baseSellingPriceINR = discount > 0 
          ? Math.round(basePrice - (basePrice * (discount / 100))) 
          : basePrice;

        // --- OPTION A: TRUE REVENUE INJECTION ---
        // If the user is foreign, we inject the export markup into the base INR value.
        // This ensures the admin sees the true INR equivalent of what the user is paying.
        if (isForeign) {
          const exportMarkupINR = cartItem.product.isPremium ? 10000 : 5000;
          baseSellingPriceINR += exportMarkupINR;
        }

        cartTotalBaseINR += baseSellingPriceINR * cartItem.quantity;
        totalItems += cartItem.quantity;

        // 2. Foreign/Localized Calculation for UI display
        let localizedData = null;
        if (isForeign) {
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
          localizedData, 
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
      .populate({ path: 'user', select: 'lastKnownRegion' })
      .populate({ path: 'items.product', select: 'variants isPremium' })
      .lean();

    let totalPipelineValue = 0;
    let abandonedCartsCount = 0;
    let totalActiveCarts = activeCarts.length;
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const productPopularity = {}; 

    activeCarts.forEach(cart => {
      const userRegion = cart.user?.lastKnownRegion;
      const metrics = calculateLiveCartMetrics(cart, userRegion);
      
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
//  GET PAGINATED LIST (THE SPLIT-VIEW TABLE WITH REGION FILTER)
// ==========================================
export const getAllActiveCarts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const filterType = req.query.filter || 'all'; 
    const regionFilter = req.query.region || 'global'; // 'global', 'domestic', 'international', or 'US', 'GB', etc.

    let dateFilter = {};
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (filterType === 'abandoned') {
      dateFilter = { updatedAt: { $lt: yesterday } };
    } else if (filterType === 'recent') {
      dateFilter = { updatedAt: { $gte: yesterday } };
    }

    const query = { 'items.0': { $exists: true }, ...dateFilter };

    // --- REGION FILTERING STRATEGY (TWO-STEP QUERY) ---
    if (regionFilter !== 'global') {
      let userQuery = {};

      if (regionFilter === 'domestic') {
        // Find users with IN/INDIA, or legacy users with no region set
        userQuery = { 
          $or: [
            { 'lastKnownRegion.countryCode': { $in: ['IN', 'INDIA'] } },
            { lastKnownRegion: { $exists: false } }
          ]
        };
      } else if (regionFilter === 'international') {
        // Find all users who actively have a non-India region
        userQuery = { 
          'lastKnownRegion.countryCode': { $nin: ['IN', 'INDIA', null, ''] },
          lastKnownRegion: { $exists: true }
        };
      } else {
        // Exact match for specific countries like 'US', 'GB'
        userQuery = { 'lastKnownRegion.countryCode': regionFilter.toUpperCase() };
      }

      // Step 1: Get matching User IDs
      const matchingUsers = await User.find(userQuery).select('_id').lean();
      const matchingUserIds = matchingUsers.map(user => user._id);

      // Early Return: If no users match the region, stop the query and return empty to save DB load
      if (matchingUserIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { totalItems: 0, totalPages: 0, currentPage: page, limit }
        });
      }

      // Bind User IDs to the main cart query
      query.user = { $in: matchingUserIds };
    }
    // ---------------------------------------------------

    const skip = (page - 1) * limit;

    const [carts, totalCount] = await Promise.all([
      Cart.find(query)
        .populate({ path: 'user', select: 'firstName lastName email lastKnownRegion' })
        .populate({ path: 'items.product', select: 'title slug isPremium variants' }) 
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Cart.countDocuments(query)
    ]);

    const formattedCarts = carts.map(cart => {
      const userRegion = cart.user?.lastKnownRegion;
      const metrics = calculateLiveCartMetrics(cart, userRegion);
      const isAbandoned = new Date(cart.updatedAt) < yesterday;
      const isForeign = userRegion && userRegion.countryCode !== 'IN' && userRegion.countryCode !== 'INDIA';

      return {
        cartId: cart._id,
        user: cart.user ? {
          id: cart.user._id,
          name: `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() || 'Unknown User',
          email: cart.user.email,
          countryCode: userRegion?.countryCode || 'IN'
        } : { name: 'Deleted User', email: 'N/A', countryCode: 'IN' },
        itemCount: metrics.totalItems,
        cartValueBaseINR: metrics.cartTotalBaseINR,
        cartValueLocalized: metrics.cartTotalLocalized,
        currencyCode: userRegion?.currencyCode || 'INR',
        symbol: userRegion?.symbol || '₹',
        isForeign,
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
      .populate({ path: 'user', select: 'firstName lastName email phoneCode phoneNumber createdAt lastKnownRegion' })
      .populate({ path: 'items.product', select: 'title slug isPremium variants' })
      .lean();

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

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