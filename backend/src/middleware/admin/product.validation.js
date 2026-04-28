import { z } from "zod";

// --- Reusable Sub-Schemas ---
const imageSchema = z.object({
  imagekitFileId: z.string().min(1, "ImageKit File ID is required"),
  baseUrl: z.string().url("High-res URL must be a valid URL"),
  altText: z.string().min(1, "Alt text is required for accessibility"),
  isPrimary: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
});

const variantSchema = z.object({
  colorName: z.string().min(1, "Color name is required"),
  colorHex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid Hex code"),
  sku: z.string().min(3, "SKU is required and must be at least 3 characters"),
  inventory: z.object({
    quantity: z.number().int().min(0, "Quantity cannot be negative"),
    lowStockThreshold: z.number().int().min(0).optional().default(5),
    allowBackorder: z.boolean().optional().default(false),
  }),
  images: z.array(imageSchema).max(5, "A variant cannot exceed 5 images"),
});

// --- Exported Schemas ---
export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title too long"),
  description: z.string().min(10, "Description needs more detail"),
  category: z.enum(["Vases", "Lighting", "Dinnerware", "Decor", "Sculpture"]),

  pricing: z.object({
    basePrice: z
      .number()
      .int()
      .min(0, "Price cannot be negative (must be in lowest currency unit)"),
    baseCurrency: z
      .string()
      .length(3, "Currency must be a 3-letter ISO code")
      .optional()
      .default("INR"),
    discountPercentage: z.number().min(0).max(100).optional().default(0),
    taxClass: z.string().optional().default("standard"),
    hsnCode: z
      .string()
      .min(4, "HSN Code is required for international shipping"),
  }),

  shipping: z.object({
    weightGrams: z
      .number()
      .int()
      .min(1, "Weight is required for shipping calculations"),
    dimensions: z.object({
      lengthCm: z.number().min(0.1, "Length is required"),
      widthCm: z.number().min(0.1, "Width is required"),
      heightCm: z.number().min(0.1, "Height is required"),
    }),
    isFragile: z.boolean().optional().default(true),
  }),

  attributes: z.object({
    material: z.string().min(1, "Material is required"),
    finish: z.string().optional(),
  }),

  variants: z
    .array(variantSchema)
    .min(1, "You must provide at least one color variant"),

  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),

  status: z.enum(["draft", "active", "archived"]).optional().default("draft"),
});

export const updateProductSchema = createProductSchema.partial();

// --- Exported Middleware ---
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Invalid product data",
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};
