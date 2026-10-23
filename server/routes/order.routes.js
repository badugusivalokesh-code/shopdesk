import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function makeValidationError(message = "Request validation failed") {
  return new AppError(message, 400, "VALIDATION_ERROR");
}

function makeNotFoundError() {
  return new AppError("Order not found", 404, "ORDER_NOT_FOUND");
}

function isSupportedStatus(value) {
  return typeof value === "string" && ORDER_STATUSES.includes(value);
}

function readStatusFilter(request) {
  const status = request.query?.status;

  if (status === undefined) {
    return undefined;
  }

  if (!isSupportedStatus(status)) {
    throw makeValidationError(
      `status must be one of: ${ORDER_STATUSES.join(", ")}`,
    );
  }

  return status;
}

function isValidOrderId(id) {
  return (
    typeof id === "string" &&
    /^[a-f\d]{24}$/i.test(id) &&
    mongoose.Types.ObjectId.isValid(id)
  );
}

function validateOrderId(request, response, next) {
  if (!isValidOrderId(request.params?.id)) {
    return next(makeValidationError("id must be a valid order id"));
  }

  return next();
}

function getOrderId(order) {
  const id = order?._id ?? order?.id;
  return id === undefined || id === null ? "" : String(id);
}

function toSafeOrder(order) {
  return {
    id: getOrderId(order),
    orderNo: order?.orderNo,
    customerName: order?.customerName,
    items: Array.isArray(order?.items)
      ? order.items.map((item) => ({
          productName: item?.productName,
          quantity: item?.quantity,
          unitPrice: item?.unitPrice,
        }))
      : [],
    total: order?.total,
    status: order?.status,
    createdAt: order?.createdAt,
    updatedAt: order?.updatedAt,
  };
}

function validateOrderStatusBody(body) {
  const errors = [];
  const unexpectedKeys = Object.keys(body).filter((key) => key !== "status");

  if (unexpectedKeys.length > 0) {
    errors.push("request body may only contain status");
  }

  if (!Object.prototype.hasOwnProperty.call(body, "status")) {
    errors.push("status is required");
  } else if (!isSupportedStatus(body.status)) {
    errors.push(
      `status must be one of: ${ORDER_STATUSES.join(", ")}`,
    );
  }

  return errors;
}

/**
 * Create the authenticated orders router without opening a database
 * connection or reading configuration from the environment.
 */
export function createOrderRouter({ jwtSecret } = {}) {
  const router = express.Router();
  const authenticate = createAuthMiddleware({ jwtSecret });

  router.use(authenticate);

  router.get("/", async (request, response, next) => {
    let status;

    try {
      status = readStatusFilter(request);
    } catch (error) {
      return next(error);
    }

    const filter = status === undefined ? {} : { status };

    try {
      const orders = await Order.find(filter).sort({ createdAt: -1, _id: -1 });

      return response.json({ orders: orders.map(toSafeOrder) });
    } catch (error) {
      return next(error);
    }
  });

  router.patch(
    "/:id/status",
    validateOrderId,
    validateBody(validateOrderStatusBody),
    async (request, response, next) => {
      try {
        const order = await Order.findByIdAndUpdate(
          request.params.id,
          { $set: { status: request.body.status } },
          { new: true, runValidators: true },
        );

        if (!order) {
          return next(makeNotFoundError());
        }

        return response.json({ order: toSafeOrder(order) });
      } catch (error) {
        return next(error);
      }
    },
  );

  return router;
}

export default createOrderRouter;
