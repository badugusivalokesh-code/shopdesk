import mongoose from "mongoose";

const httpUrlPattern = /^https?:\/\/[^\s]+$/i;

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => Number.isFinite(value) && value > 0,
        message: "Price must be a finite number greater than zero",
      },
    },
    stock: {
      type: Number,
      required: true,
      validate: {
        validator: (value) =>
          Number.isFinite(value) && Number.isInteger(value) && value >= 0,
        message: "Stock must be a finite non-negative integer",
      },
    },
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => value == null || httpUrlPattern.test(value),
        message: "Image URL must be a valid HTTP(S) URL",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export { Product, productSchema };
export default Product;
