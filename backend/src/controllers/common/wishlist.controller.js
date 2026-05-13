import Wishlist from "../../models/wishlist.model.js";

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user;

    // Find the wishlist and populate the actual product data
    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "items.productId",
      select: "title slug category isPremium status variants",
    });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: { items: [] },
      });
    }

    // Filter out items where the parent product was deleted from the DB
    const validItems = wishlist.items.filter((item) => item.productId !== null);

    // If we filtered out dead products, silently save the cleaned-up array back to the DB
    if (validItems.length !== wishlist.items.length) {
      wishlist.items = validItems;
      await wishlist.save();
    }

    // --- THE DTO OPTIMIZATION ---
    // Format the items so the frontend receives a clean, flat object
    const formattedItems = validItems.map((item) => {
      const product = item.productId;
      
      // Find the specific variant the user added
      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId.toString() || v.id === item.variantId
      );

      // If the variant was deleted from the product, return null to filter it out
      if (!variant) return null;

      // Extract the primary image URL securely
      let imgUrl = "";
      if (variant.images && variant.images.length > 0) {
        const primaryImg = variant.images.find((img) => img.isPrimary) || variant.images[0];
        imgUrl = primaryImg.baseUrl || primaryImg.url || "";
      }

      return {
        productId: product._id || product.id,
        variantId: variant._id || variant.id,
        title: product.title || "Unknown Product",
        slug: product.slug || "#",
        img: imgUrl,
        colorName: variant.colorName || "Unknown Color",
        price: variant.finalPrice || variant.pricing?.price || 0,
        status: product.status ? product.status.toLowerCase() : "active",
        inStock: variant.inventory?.quantity > 0,
        stockQuantity: variant.inventory?.quantity || 0,
        addedAt: item.addedAt
      };
    }).filter((item) => item !== null); // Strip out any nulls from deleted variants

    // Send the flattened, lightweight array to the frontend
    return res.status(200).json({
      success: true,
      data: { items: formattedItems },
    });
  } catch (error) {
    console.error("[Wishlist Controller - getWishlist Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch wishlist." });
  }
};

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

    // Find the user's wishlist
    let wishlist = await Wishlist.findOne({ user: userId });

    // If they don't have a wishlist yet, create one and add the item
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

    // Check if the exact variant is already in the wishlist
    const itemIndex = wishlist.items.findIndex(
      (item) =>
        item.productId.toString() === productId && item.variantId === variantId,
    );

    if (itemIndex > -1) {
      // It exists -> Remove it
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
      // It doesn't exist -> Add it to the top of the list
      wishlist.items.unshift({ productId, variantId }); // unshift puts it at index 0 (newest first)
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

export const syncWishlist = async (req, res) => {
  try {
    const userId = req.user;
    
    // Accept either localItems or items to make it bulletproof against frontend changes
    const itemsToSync = req.body.localItems || req.body.items;

    // If local storage was empty, do nothing
    if (!itemsToSync || !Array.isArray(itemsToSync) || itemsToSync.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "Nothing to sync." });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    // If they have no DB wishlist, simply create one with the local items
    if (!wishlist) {
      await Wishlist.create({
        user: userId,
        items: itemsToSync,
      });
      return res
        .status(200)
        .json({ success: true, message: "Wishlist synced successfully." });
    }

    // If they DO have a DB wishlist, we need to merge carefully to avoid duplicates
    let addedCount = 0;

    itemsToSync.forEach((localItem) => {
      // Support frontend sending 'product'/'variant' or 'productId'/'variantId'
      const pId = localItem.productId || localItem.product;
      const vId = localItem.variantId || localItem.variant;

      const exists = wishlist.items.some(
        (dbItem) =>
          dbItem.productId.toString() === pId &&
          dbItem.variantId === vId,
      );

      if (!exists && pId && vId) {
        // Add new items to the top of the list
        wishlist.items.unshift({
          productId: pId,
          variantId: vId,
        });
        addedCount++;
      }
    });

    // Only hit the database with a save if we actually added something new
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

    // We don't delete the document, we just empty the array.
    // This is much faster and keeps the document index intact.
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