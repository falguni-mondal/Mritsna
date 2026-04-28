import Product from '../../models/product.model.js';
import slugify from 'slugify';
import { deleteImageKitFile } from '../../utils/imagekit.js';

/**
 * Generate a unique slug for SEO
 */
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await Product.exists({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    productData.slug = await generateUniqueSlug(productData.title);

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Database Conflict: The ${duplicatedField} '${error.keyValue[duplicatedField]}' is already in use.`
      });
    }
    next(error); 
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 1. Fetch the OLD product first to get the existing images
    const oldProduct = await Product.findById(id);

    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Spot the missing ImageKit IDs
    if (updateData.variants) {
      // Flatten all old file IDs into a simple array
      const oldFileIds = oldProduct.variants.flatMap(variant => 
        variant.images.map(img => img.imagekitFileId)
      );

      // Flatten all incoming (new) file IDs into a simple array
      const newFileIds = updateData.variants.flatMap(variant => 
        variant.images?.map(img => img.imagekitFileId) || []
      );

      // Find IDs that exist in the old array but NOT in the new array
      const orphanedFileIds = oldFileIds.filter(id => !newFileIds.includes(id));

      // We loop through orphans and call delete without 'await' to avoid blocking the response
      orphanedFileIds.forEach(fileId => {
        deleteImageKitFile(fileId); 
      });
    }

    // Proceed with the actual database update
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Conflict: A variant with this SKU already exists in the catalog.`
      });
    }
    next(error);
  }
};

export const changeProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!['active', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Product status changed to ${status}`,
      data: { id: product._id, status: product.status }
    });

  } catch (error) {
    next(error);
  }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find({})
      .select('title slug category pricing.basePrice status variants.sku variants.inventory variants.images')
      .sort({ createdAt: -1 })
      .lean(); 

    const tableData = products.map((product) => {
      const firstVariant = product.variants?.[0];
      const firstImage = firstVariant?.images?.[0];

      return {
        _id: product._id,
        title: product.title,
        slug: product.slug,
        category: product.category,
        price: product.pricing?.basePrice,
        status: product.status,
        
        sku: firstVariant?.sku || 'N/A',
        stock: firstVariant?.inventory?.quantity || 0,
        lowStock: firstVariant?.inventory?.quantity <= (firstVariant?.inventory?.lowStockThreshold || 5),
        
        // Return baseUrl instead of thumbnailUrl
        image: firstImage ? {
          baseUrl: firstImage.baseUrl,
          altText: firstImage.altText
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      count: tableData.length,
      data: tableData
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};