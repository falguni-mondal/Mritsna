import Wishlist from "../../models/wishlist.model.js";
import Product from "../../models/product.model.js";
// --- NEW: Inject the universal pricing engine ---
import { calculateRegionalPricing } from "../../utils/pricingEngine.js";

// ==========================================
// GET USER WISHLIST (DYNAMIC PRICING ENGINE)
// ==========================================
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user;

    // Find the wishlist and populate the actual product data
    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "items.productId",
      select: "title slug category isPremium status variants",
    });

    // Extract the region data dynamically attached by our middleware
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    // If empty wishlist, still send back the currency info so the UI knows what to render
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: { 
          items: [],
          currencySymbol: regionData.symbol,
          currencyCode: regionData.currencyCode
        },
      });
    }

    // Filter out items where the parent product was deleted from the DB
    const validItems = wishlist.items.filter((item) => item.productId !== null);

    // If we filtered out dead products, silently save the cleaned-up array back to the DB
    if (validItems.length !== wishlist.items.length) {
      wishlist.items = validItems;
      await wishlist.save();
    }

    // --- THE DTO OPTIMIZATION WITH PRICING ENGINE ---
    const formattedItems = validItems.map((item) => {
      const product = item.productId;
      
      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId.toString() || v.id === item.variantId
      );

      if (!variant) return null;

      let imgUrl = "";
      if (variant.images && variant.images.length > 0) {
        const primaryImg = variant.images.find((img) => img.isPrimary) || variant.images[0];
        imgUrl = primaryImg.baseUrl || primaryImg.url || "";
      }

      // --- APPLY THE PRICING ENGINE ---
      const localizedPricing = calculateRegionalPricing(
        variant.pricing.price, 
        variant.pricing.discountPercentage || 0, 
        product.isPremium || false, 
        regionData
      );

      return {
        productId: product._id || product.id,
        variantId: variant._id || variant.id,
        title: product.title || "Unknown Product",
        slug: product.slug || "#",
        img: imgUrl,
        colorName: variant.colorName || "Unknown Color",
        price: localizedPricing.sellingPrice, // Now perfectly converted + marked up
        originalPrice: localizedPricing.originalPrice, 
        status: product.status ? product.status.toLowerCase() : "active",
        inStock: variant.inventory?.quantity > 0,
        stockQuantity: variant.inventory?.quantity || 0,
        addedAt: item.addedAt
      };
    }).filter((item) => item !== null); 

    return res.status(200).json({
      success: true,
      data: { 
        items: formattedItems,
        currencySymbol: regionData.symbol,
        currencyCode: regionData.currencyCode
      },
    });
  } catch (error) {
    console.error("[Wishlist Controller - getWishlist Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch wishlist." });
  }
};

// ==========================================
// HYDRATE GUEST WISHLIST (NEW: DYNAMIC PRICING FOR LOCALSTORAGE)
// ==========================================
export const hydrateGuestWishlist = async (req, res, next) => {
  try {
    const { localItems } = req.body; 
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    if (!localItems || !Array.isArray(localItems) || localItems.length === 0) {
      return res.status(200).json({
        success: true,
        data: { items: [], currencySymbol: regionData.symbol, currencyCode: regionData.currencyCode }
      });
    }

    const formattedItems = [];

    // Fetch live product data for the IDs sent from localStorage
    for (const item of localItems) {
      // Validate IDs before querying MongoDB to prevent cast errors
      if (!item.productId || !item.variantId) continue;

      const product = await Product.findOne({ _id: item.productId, status: 'active' })
        .select('title slug category isPremium variants status')
        .lean();

      if (!product) continue;

      const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
      if (!variant) continue;

      let imgUrl = "";
      if (variant.images && variant.images.length > 0) {
        const primaryImg = variant.images.find((img) => img.isPrimary) || variant.images[0];
        imgUrl = primaryImg.baseUrl || primaryImg.url || "";
      }

      // --- APPLY THE PRICING ENGINE ---
      const localizedPricing = calculateRegionalPricing(
        variant.pricing.price, 
        variant.pricing.discountPercentage || 0, 
        product.isPremium || false, 
        regionData
      );

      formattedItems.push({
        productId: product._id,
        variantId: item.variantId,
        title: product.title,
        slug: product.slug,
        img: imgUrl,
        colorName: variant.colorName,
        price: localizedPricing.sellingPrice,
        originalPrice: localizedPricing.originalPrice,
        status: product.status.toLowerCase(),
        inStock: variant.inventory?.quantity > 0,
        stockQuantity: variant.inventory?.quantity || 0,
        addedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        currencySymbol: regionData.symbol,
        currencyCode: regionData.currencyCode
      }
    });

  } catch (error) {
    console.error("[Wishlist Controller - hydrateGuestWishlist Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to hydrate guest wishlist." });
  }
};


// ==========================================
// TOGGLE WISHLIST ITEM (DUMB DB UPDATE)
// ==========================================
export const toggleWishlistItem = async (req, res) => {
  try {
    const userId = req.user;
    const { productId, variantId } = req.body;

    if (!productId || !variantId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Product ID and Variant ID are required.",
        });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        items: [{ productId, variantId }],
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "Item added to wishlist.",
          action: "added",
        });
    }

    const itemIndex = wishlist.items.findIndex(
      (item) =>
        item.productId.toString() === productId && item.variantId === variantId,
    );

    if (itemIndex > -1) {
      wishlist.items.splice(itemIndex, 1);
      await wishlist.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Item removed from wishlist.",
          action: "removed",
        });
    } else {
      wishlist.items.unshift({ productId, variantId }); 
      await wishlist.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Item added to wishlist.",
          action: "added",
        });
    }
  } catch (error) {
    console.error("[Wishlist Controller - toggleWishlistItem Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update wishlist." });
  }
};


// ==========================================
// GUEST TO USER MERGE (DUMB DB UPDATE)
// ==========================================
export const syncWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const itemsToSync = req.body.localItems || req.body.items;

    if (!itemsToSync || !Array.isArray(itemsToSync) || itemsToSync.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "Nothing to sync." });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Map it down to just the IDs just in case the frontend sent rich data
      const cleanItems = itemsToSync.map(i => ({
         productId: i.productId || i.product, 
         variantId: i.variantId || i.variant 
      })).filter(i => i.productId && i.variantId);

      await Wishlist.create({
        user: userId,
        items: cleanItems,
      });
      return res
        .status(200)
        .json({ success: true, message: "Wishlist synced successfully." });
    }

    let addedCount = 0;

    itemsToSync.forEach((localItem) => {
      const pId = localItem.productId || localItem.product;
      const vId = localItem.variantId || localItem.variant;

      const exists = wishlist.items.some(
        (dbItem) =>
          dbItem.productId.toString() === pId &&
          dbItem.variantId === vId,
      );

      if (!exists && pId && vId) {
        wishlist.items.unshift({
          productId: pId,
          variantId: vId,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      await wishlist.save();
    }

    return res
      .status(200)
      .json({ success: true, message: "Wishlist synced successfully." });
  } catch (error) {
    console.error("[Wishlist Controller - syncWishlist Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to sync wishlist." });
  }
};


export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user;
    await Wishlist.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
    return res
      .status(200)
      .json({ success: true, message: "Wishlist cleared." });
  } catch (error) {
    console.error("[Wishlist Controller - clearWishlist Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to clear wishlist." });
  }
};