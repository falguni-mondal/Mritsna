import Wishlist from '../../models/wishlist.model.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';
import { calculateRegionalPricing } from '../../utils/pricingEngine.js';

// ==========================================
// CALCULATE WISHLIST METRICS (TRUE REVENUE ENGINE)
// Applies export markups to the Base INR if the user is foreign, 
// strictly calculating at the item level (no total cart value).
// ==========================================
const calculateLiveWishlistMetrics = (wishlist, regionData = null) => {
  let totalItems = 0;
  const detailedItems = [];

  const isForeign = regionData && regionData.countryCode !== 'IN' && regionData.countryCode !== 'INDIA';

  if (wishlist.items && wishlist.items.length > 0) {
    wishlist.items.forEach(wishlistItem => {
      // The schema uses productId as the ref
      if (!wishlistItem.productId) return; 

      const product = wishlistItem.productId;
      const variant = product.variants?.find(
        v => v._id.toString() === wishlistItem.variantId.toString()
      );

      if (variant) {
        const basePrice = variant.pricing?.price || 0;
        const discount = variant.pricing?.discountPercentage || 0;
        
        // 1. Calculate raw product price in INR
        let baseSellingPriceINR = discount > 0 
          ? Math.round(basePrice - (basePrice * (discount / 100))) 
          : basePrice;

        // Inject the export markup into the base INR value if foreign
        if (isForeign) {
          const exportMarkupINR = product.isPremium ? 10000 : 5000;
          baseSellingPriceINR += exportMarkupINR;
        }

        totalItems += 1; // Wishlist items don't have quantities, so it's always 1

        // 2. Foreign/Localized Calculation for UI display
        let localizedData = null;
        if (isForeign) {
          const regionalPricing = calculateRegionalPricing(
            basePrice, 
            discount,
            product.isPremium || false,
            regionData
          );
          
          localizedData = {
            unitPrice: regionalPricing.sellingPrice,
            currencyCode: regionalPricing.currencyCode,
            symbol: regionalPricing.symbol
          };
        }

        detailedItems.push({
          // wishlistItem._id is explicitly disabled in the schema, so we use variantId as the key
          wishlistItemKey: wishlistItem.variantId, 
          productId: product._id,
          title: product.title,
          slug: product.slug,
          isPremium: product.isPremium,
          variantId: variant._id,
          color: variant.colorName,
          sku: variant.sku,
          baseUnitPriceINR: baseSellingPriceINR, 
          localizedData, 
          stockAvailable: variant.inventory?.quantity || 0,
          isStockBottleneck: 1 > (variant.inventory?.quantity || 0), // Flag if out of stock
          image: variant.images.find(img => img.isPrimary)?.baseUrl || variant.images[0]?.baseUrl,
          addedAt: wishlistItem.addedAt
        });
      }
    });
  }

  return { totalItems, detailedItems };
};

// ==========================================
// GET DASHBOARD METRICS (DEMAND FORECASTING)
// ==========================================
export const getWishlistDashboardStats = async (req, res, next) => {
  try {
    const activeWishlists = await Wishlist.find({ 'items.0': { $exists: true } })
      .populate({ path: 'items.productId', select: 'title variants isPremium' })
      .lean();

    let totalActiveWishlists = activeWishlists.length;
    let totalItemsAccrossPlatform = 0;
    
    const productPopularity = {}; 

    activeWishlists.forEach(wishlist => {
      const metrics = calculateLiveWishlistMetrics(wishlist, null); // Region not needed for pure counts
      
      totalItemsAccrossPlatform += metrics.totalItems;

      metrics.detailedItems.forEach(item => {
        if (!productPopularity[item.productId]) {
          productPopularity[item.productId] = { 
            title: item.title, 
            sku: item.sku, 
            image: item.image, 
            count: 0 
          };
        }
        productPopularity[item.productId].count += 1;
      });
    });

    const topWishlistedProducts = Object.values(productPopularity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalActiveWishlists,
        averageItemsPerWishlist: totalActiveWishlists > 0 ? Math.round((totalItemsAccrossPlatform / totalActiveWishlists) * 10) / 10 : 0,
        topWishlistedProducts
      }
    });

  } catch (error) {
    console.error("[Admin Wishlist Stats Error]", error);
    next(error);
  }
};

// ==========================================
// GET PAGINATED LIST (THE REGION-FILTERED TABLE)
// ==========================================
export const getAllActiveWishlists = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const regionFilter = req.query.region || 'global'; 

    const query = { 'items.0': { $exists: true } };

    // --- REGION FILTERING STRATEGY (TWO-STEP QUERY) ---
    if (regionFilter !== 'global') {
      let userQuery = {};

      if (regionFilter === 'domestic') {
        userQuery = { 
          $or: [
            { 'lastKnownRegion.countryCode': { $in: ['IN', 'INDIA'] } },
            { lastKnownRegion: { $exists: false } }
          ]
        };
      } else if (regionFilter === 'international') {
        userQuery = { 
          'lastKnownRegion.countryCode': { $nin: ['IN', 'INDIA', null, ''] },
          lastKnownRegion: { $exists: true }
        };
      } else {
        userQuery = { 'lastKnownRegion.countryCode': regionFilter.toUpperCase() };
      }

      const matchingUsers = await User.find(userQuery).select('_id').lean();
      const matchingUserIds = matchingUsers.map(user => user._id);

      if (matchingUserIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { totalItems: 0, totalPages: 0, currentPage: page, limit }
        });
      }

      query.user = { $in: matchingUserIds };
    }
    // ---------------------------------------------------

    const skip = (page - 1) * limit;

    const [wishlists, totalCount] = await Promise.all([
      Wishlist.find(query)
        .populate({ path: 'user', select: 'firstName lastName email lastKnownRegion' })
        .sort({ updatedAt: -1 }) // Sort by most recently updated wishlists
        .skip(skip)
        .limit(limit)
        .lean(),
      Wishlist.countDocuments(query)
    ]);

    const formattedWishlists = wishlists.map(wishlist => {
      const userRegion = wishlist.user?.lastKnownRegion;
      const isForeign = userRegion && userRegion.countryCode !== 'IN' && userRegion.countryCode !== 'INDIA';

      return {
        wishlistId: wishlist._id,
        user: wishlist.user ? {
          id: wishlist.user._id,
          name: `${wishlist.user.firstName || ''} ${wishlist.user.lastName || ''}`.trim() || 'Unknown User',
          email: wishlist.user.email,
          countryCode: userRegion?.countryCode || 'IN'
        } : { name: 'Deleted User', email: 'N/A', countryCode: 'IN' },
        itemCount: wishlist.items.length,
        isForeign,
        lastActive: wishlist.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedWishlists,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("[Admin Get All Wishlists Error]", error);
    next(error);
  }
};

// ==========================================
// GET DEEP-DIVE DETAILS FOR A SPECIFIC WISHLIST
// ==========================================
export const getWishlistDetails = async (req, res, next) => {
  try {
    const { wishlistId } = req.params;

    const wishlist = await Wishlist.findById(wishlistId)
      .populate({ path: 'user', select: 'firstName lastName email phoneCode phoneNumber createdAt lastKnownRegion' })
      .populate({ path: 'items.productId', select: 'title slug isPremium variants' })
      .lean();

    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    const userRegion = wishlist.user?.lastKnownRegion;
    const metrics = calculateLiveWishlistMetrics(wishlist, userRegion);

    let formattedUser = null;
    if (wishlist.user) {
      formattedUser = {
        id: wishlist.user._id,
        name: `${wishlist.user.firstName || ''} ${wishlist.user.lastName || ''}`.trim() || 'Unknown User',
        email: wishlist.user.email,
        phone: wishlist.user.phoneNumber ? `${wishlist.user.phoneCode || ''} ${wishlist.user.phoneNumber}`.trim() : 'Not Provided',
        registeredAt: wishlist.user.createdAt,
        countryCode: userRegion?.countryCode || 'IN'
      };
    }

    const isForeign = userRegion && userRegion.countryCode !== 'IN' && userRegion.countryCode !== 'INDIA';

    // Sort items by most recently added
    metrics.detailedItems.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    return res.status(200).json({
      success: true,
      data: {
        wishlistId: wishlist._id,
        user: formattedUser,
        summary: {
          totalItems: metrics.totalItems,
          currencyCode: userRegion?.currencyCode || 'INR',
          symbol: userRegion?.symbol || '₹',
          isForeign,
          lastActive: wishlist.updatedAt,
        },
        items: metrics.detailedItems
      }
    });

  } catch (error) {
    console.error("[Admin Get Wishlist Details Error]", error);
    next(error);
  }
};