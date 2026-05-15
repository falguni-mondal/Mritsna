import Product from '../../models/product.model.js'; // Adjust path if necessary

export const getNewArrivals = async (req, res, next) => {
  try {
    // --- Extract the region data from the middleware ---
    const rate = req.region?.rate || 1;
    const symbol = req.region?.symbol || '₹';
    const currencyCode = req.region?.currencyCode || 'INR';

    const newArrivals = await Product.find({ 
      status: 'active', 
      isPremium: false
    })
      .select('title slug isPremium variants.pricing variants.images')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(); 

    const formattedProducts = newArrivals.map((product) => {
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      // 1. Calculate Base Prices in INR
      const basePriceINR = pricing.price;
      const finalPriceINR = pricing.discountPercentage > 0 
        ? basePriceINR - (basePriceINR * (pricing.discountPercentage / 100))
        : basePriceINR;

      // 2. Convert to Regional Price dynamically
      const originalPriceConverted = Math.round(basePriceINR * rate);
      const finalPriceConverted = Math.round(finalPriceINR * rate);

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        isPremium: product.isPremium || false,
        originalPrice: originalPriceConverted, // Send the converted price
        finalPrice: finalPriceConverted,       // Send the converted price
        img: firstImage.baseUrl || null, 
        altText: firstImage.altText || product.title
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
      currencySymbol: symbol,       // Pass the symbol for the UI
      currencyCode: currencyCode 
    });

  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    next(error);
  }
};

export const getPaginatedProducts = async (req, res, next) => {
  try {
    // --- Extract the region data from the middleware ---
    const rate = req.region?.rate || 1;
    const symbol = req.region?.symbol || '₹';
    const currencyCode = req.region?.currencyCode || 'INR';

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const search = req.query.search || '';
    const category = req.query.category || '';
    const isPremium = req.query.isPremium;
    const sortParams = req.query.sort || 'newest';

    const filter = { status: 'active' };

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    if (isPremium === 'true') filter.isPremium = true;
    if (isPremium === 'false') filter.isPremium = false;

    let sortStrategy = {};
    switch (sortParams) {
      case 'price_asc':
        sortStrategy = { 'variants.pricing.price': 1 };
        break;
      case 'price_desc':
        sortStrategy = { 'variants.pricing.price': -1 };
        break;
      case 'name_asc':
        sortStrategy = { title: 1 };
        break;
      case 'newest':
      default:
        sortStrategy = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .select('title slug category isPremium variants.pricing variants.images createdAt')
        .sort(sortStrategy)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    const formattedProducts = products.map((product) => {
      const firstVariant = product.variants?.[0] || {};
      const firstImage = firstVariant.images?.[0] || {};
      const pricing = firstVariant.pricing || { price: 0, discountPercentage: 0 };

      // 1. Calculate Base Prices in INR
      const basePriceINR = pricing.price;
      const finalPriceINR = pricing.discountPercentage > 0 
        ? basePriceINR - (basePriceINR * (pricing.discountPercentage / 100))
        : basePriceINR;

      // 2. Convert to Regional Price dynamically
      const originalPriceConverted = Math.round(basePriceINR * rate);
      const finalPriceConverted = Math.round(finalPriceINR * rate);

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        category: product.category,
        isPremium: product.isPremium || false,
        originalPrice: originalPriceConverted, // Send the converted price
        finalPrice: finalPriceConverted,       // Send the converted price
        discount: pricing.discountPercentage,
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      currencySymbol: symbol,       // Pass the symbol for the UI
      currencyCode: currencyCode,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: page,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching paginated products:", error);
    next(error);
  }
};

export const getSingleProduct = async (req, res, next) => {
  try {
    // --- Extract the region data from the middleware ---
    const rate = req.region?.rate || 1;
    const symbol = req.region?.symbol || '₹';
    const currencyCode = req.region?.currencyCode || 'INR';

    const { slug } = req.params;
    const product = await Product.findOne({ slug, status: 'active' })
      .select('-pricing.hsnCode -pricing.taxClass -shipping.weightGrams -variants.sku')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or is no longer available.'
      });
    }

    let formattedDimensions = "Dimensions unavailable";
    if (product.shipping && product.shipping.dimensions) {
      const { lengthCm, widthCm, heightCm } = product.shipping.dimensions;
      formattedDimensions = `L ${lengthCm}cm x W ${widthCm}cm x H ${heightCm}cm`;
    }

    const formattedVariants = product.variants.map(variant => {
      // 1. Calculate Base Prices in INR
      const basePriceINR = variant.pricing?.price || 0;
      const discount = variant.pricing?.discountPercentage || 0;
      const finalPriceINR = discount > 0 ? basePriceINR - (basePriceINR * (discount / 100)) : basePriceINR;
      
      // 2. Convert to Regional Price dynamically
      const originalPriceConverted = Math.round(basePriceINR * rate);
      const finalPriceConverted = Math.round(finalPriceINR * rate);

      const stockQuantity = variant.inventory?.quantity || 0;
      const threshold = variant.inventory?.lowStockThreshold || 3;

      return {
        variantId: variant._id,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        originalPrice: originalPriceConverted, // Send the converted price
        finalPrice: finalPriceConverted,       // Send the converted price
        discountPercentage: discount,
        material: variant.attributes?.material,
        finish: variant.attributes?.finish,
        stockQuantity: stockQuantity, 
        
        inStock: stockQuantity > 0 || (variant.inventory?.allowBackorder || false),
        lowStockWarning: stockQuantity > 0 && stockQuantity <= threshold,
        images: variant.images.map(img => ({
          url: img.baseUrl,
          alt: img.altText,
          isPrimary: img.isPrimary
        }))
      };
    });

    const publicProductData = {
      id: product._id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      category: product.category,
      isPremium: product.isPremium,
      dimensions: formattedDimensions,
      variants: formattedVariants,
      currencySymbol: symbol,
      currencyCode: currencyCode
    };

    return res.status(200).json({
      success: true,
      data: publicProductData
    });

  } catch (error) {
    console.error("Error fetching single product:", error);
    next(error);
  }
};