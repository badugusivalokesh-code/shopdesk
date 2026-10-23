import express from "express";
import mongoose from "mongoose";

import Product from "../models/Product.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

const PRODUCTS_PER_PAGE = 10;
const HTTP_URL_PATTERN = /^https?:\/\/[^\s]+$/i;

function makeValidationError(message = "Request validation failed") {
  return new AppError(message, 400, "VALIDATION_ERROR");
}

function makeNotFoundError() {
  return new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
}

function isValidHttpUrl(value) {
  if (!HTTP_URL_PATTERN.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateProductBody(body) {
  const errors = [];

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("name is required");
  }

  if (typeof body.category !== "string" || body.category.trim().length === 0) {
    errors.push("category is required");
  }

  if (
    typeof body.price !== "number" ||
    !Number.isFinite(body.price) ||
    body.price <= 0
  ) {
    errors.push("price must be a finite number greater than 0");
  }

  if (
    typeof body.stock !== "number" ||
    !Number.isInteger(body.stock) ||
    body.stock < 0
  ) {
    errors.push("stock must be a non-negative integer");
  }

  if (body.imageUrl !== undefined && body.imageUrl !== null) {
    if (typeof body.imageUrl !== "string") {
      errors.push("imageUrl must be a valid HTTP(S) URL");
    } else {
      const imageUrl = body.imageUrl.trim();
      if (imageUrl !== "" && !isValidHttpUrl(imageUrl)) {
        errors.push("imageUrl must be a valid HTTP(S) URL");
      }
    }
  }

  return errors;
}

function normalizeImageUrl(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeProductBody(body) {
  return {
    name: body.name.trim(),
    category: body.category.trim(),
    price: body.price,
    stock: body.stock,
    imageUrl: normalizeImageUrl(body.imageUrl),
  };
}

function toProductId(product) {
  const id = product?._id ?? product?.id;
  return id === undefined || id === null ? "" : String(id);
}

function toSafeProduct(product) {
  const safeProduct = {
    id: toProductId(product),
    name: typeof product?.name === "string" ? product.name.trim() : product?.name,
    category:
      typeof product?.category === "string"
        ? product.category.trim()
        : product?.category,
    price: product?.price,
    stock: product?.stock,
  };

  const imageUrl = normalizeImageUrl(product?.imageUrl);
  if (imageUrl !== undefined) {
    safeProduct.imageUrl = imageUrl;
  }

  return safeProduct;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readQuery(request) {
  const query = request.query ?? {};
  const searchValue = query.search;
  const categoryValue = query.category;
  const pageValue = query.page;

  if (searchValue !== undefined && typeof searchValue !== "string") {
    throw makeValidationError("search must be a string");
  }

  if (categoryValue !== undefined && typeof categoryValue !== "string") {
    throw makeValidationError("category must be a string");
  }

  let page = 1;
  if (pageValue !== undefined) {
    if (
      typeof pageValue !== "string" ||
      !/^\d+$/.test(pageValue.trim())
    ) {
      throw makeValidationError("page must be a positive integer");
    }

    page = Number(pageValue);
    const maxPage = Math.floor(Number.MAX_SAFE_INTEGER / PRODUCTS_PER_PAGE) + 1;
    if (!Number.isSafeInteger(page) || page < 1 || page > maxPage) {
      throw makeValidationError("page must be a positive integer");
    }
  }

  return {
    search: typeof searchValue === "string" ? searchValue.trim() : "",
    category: typeof categoryValue === "string" ? categoryValue.trim() : "",
    page,
  };
}

function buildProductFilter({ search, category }) {
  const filter = {};

  if (search) {
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { category: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  return filter;
}

function isValidProductId(id) {
  return (
    typeof id === "string" &&
    /^[a-f\d]{24}$/i.test(id) &&
    mongoose.Types.ObjectId.isValid(id)
  );
}

function validateProductId(request, response, next) {
  if (!isValidProductId(request.params?.id)) {
    return next(makeValidationError("id must be a valid product id"));
  }

  return next();
}

function buildProductUpdate(product) {
  const { imageUrl, ...fields } = product;
  const update = { $set: fields };

  if (imageUrl === undefined) {
    update.$unset = { imageUrl: 1 };
  } else {
    update.$set.imageUrl = imageUrl;
  }

  return update;
}

/**
 * Create the authenticated product CRUD router without opening a database
 * connection or reading configuration from the environment.
 */
export function createProductRouter({ jwtSecret } = {}) {
  const router = express.Router();
  const authenticate = createAuthMiddleware({ jwtSecret });

  router.use(authenticate);

  router.get("/", async (request, response, next) => {
    let pagination;

    try {
      pagination = readQuery(request);
    } catch (error) {
      return next(error);
    }

    const filter = buildProductFilter(pagination);
    const skip = (pagination.page - 1) * PRODUCTS_PER_PAGE;

    if (!Number.isSafeInteger(skip)) {
      return next(makeValidationError("page is too large"));
    }

    try {
      const [total, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
          .sort({ name: 1, _id: 1 })
          .skip(skip)
          .limit(PRODUCTS_PER_PAGE),
      ]);
      const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

      return response.json({
        products: products.map(toSafeProduct),
        page: pagination.page,
        limit: PRODUCTS_PER_PAGE,
        total,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post(
    "/",
    validateBody(validateProductBody),
    async (request, response, next) => {
      const productData = normalizeProductBody(request.body);

      try {
        const product = await Product.create(productData);
        return response.status(201).json({ product: toSafeProduct(product) });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.put(
    "/:id",
    validateProductId,
    validateBody(validateProductBody),
    async (request, response, next) => {
      const productData = normalizeProductBody(request.body);

      try {
        const product = await Product.findByIdAndUpdate(
          request.params.id,
          buildProductUpdate(productData),
          { new: true, runValidators: true },
        );

        if (!product) {
          return next(makeNotFoundError());
        }

        return response.json({ product: toSafeProduct(product) });
      } catch (error) {
        return next(error);
      }
    },
  );

  router.delete(
    "/:id",
    validateProductId,
    async (request, response, next) => {
      try {
        const product = await Product.findByIdAndDelete(request.params.id);

        if (!product) {
          return next(makeNotFoundError());
        }

        return response.json({ message: "Product deleted successfully" });
      } catch (error) {
        return next(error);
      }
    },
  );

  return router;
}

export default createProductRouter;
