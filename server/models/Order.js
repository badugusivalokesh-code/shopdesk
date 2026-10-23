import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    quantity: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => Number.isInteger(value) && value > 0,
        message: "Quantity must be a positive integer",
      },
    },
    unitPrice: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => Number.isFinite(value) && value > 0,
        message: "Unit price must be a finite number greater than zero",
      },
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 1,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      default: undefined,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Order must contain at least one item",
      },
    },
    total: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => Number.isFinite(value) && value > 0,
        message: "Total must be a finite number greater than zero",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export { Order, orderSchema, orderItemSchema };
export default Order;
