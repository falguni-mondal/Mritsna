import Product from '../../models/product.model.js'; // Adjust path if necessary

export const getNewArrivals = async (req, res, next) => {
  try {
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

      const finalPrice = pricing.discountPercentage > 0 
        ? pricing.price - (pricing.price * (pricing.discountPercentage / 100))
        : pricing.price;

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        isPremium: product.isPremium || false,
        originalPrice: pricing.price,
        finalPrice: finalPrice,
        img: firstImage.baseUrl || null, 
        altText: firstImage.altText || product.title
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });

  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    next(error);
  }
};

export const getPaginatedProducts = async (req, res, next) => {
  try {
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

      const finalPrice = pricing.discountPercentage > 0 
        ? pricing.price - (pricing.price * (pricing.discountPercentage / 100))
        : pricing.price;

      return {
        _id: product._id,
        slug: product.slug,
        name: product.title,
        category: product.category,
        isPremium: product.isPremium || false,
        originalPrice: pricing.price,
        finalPrice: finalPrice,
        discount: pricing.discountPercentage,
        img: firstImage.baseUrl || null,
        altText: firstImage.altText || product.title
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: formattedProducts,
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
      const price = variant.pricing?.price || 0;
      const discount = variant.pricing?.discountPercentage || 0;
      const finalPrice = discount > 0 ? price - (price * (discount / 100)) : price;
      
      const stockQuantity = variant.inventory?.quantity || 0;
      const threshold = variant.inventory?.lowStockThreshold || 3;

      return {
        variantId: variant._id,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        originalPrice: price,
        finalPrice: finalPrice,
        discountPercentage: discount,
        material: variant.attributes?.material,
        finish: variant.attributes?.finish,
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
      baseCurrency: product.pricing?.baseCurrency || 'INR',
      dimensions: formattedDimensions,
      variants: formattedVariants
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