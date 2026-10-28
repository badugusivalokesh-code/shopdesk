import express from "express";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createAuthMiddleware } from "../middleware/auth.js";

const ORDER_DATE_LIMIT = 7;
const RECENT_ORDER_LIMIT = 5;

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function serializeCreatedAt(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  return value ?? null;
}

function toSafeRecentOrder(order) {
  return {
    orderNo: order?.orderNo,
    customerName: order?.customerName,
    total: toFiniteNumber(order?.total),
    status: order?.status,
    createdAt: serializeCreatedAt(order?.createdAt),
  };
}

/**
 * Create the authenticated dashboard statistics router without opening a
 * database connection or reading configuration from the environment.
 */
export function createStatsRouter({ jwtSecret } = {}) {
  const router = express.Router();
  const authenticate = createAuthMiddleware({ jwtSecret });

  router.use(authenticate);

  router.get("/", async (request, response, next) => {
    try {
      const [
        totalProducts,
        totalOrders,
        deliveredRevenue,
        lowStockProducts,
        dailyOrderCounts,
        recentOrders,
      ] = await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: "Delivered" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Product.countDocuments({ stock: { $lte: 5 } }),
        Order.aggregate([
          {
            $group: {
              _id: {
                $dateToString: {
                  date: "$createdAt",
                  format: "%Y-%m-%d",
                  timezone: "UTC",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: ORDER_DATE_LIMIT },
          { $sort: { _id: 1 } },
        ]),
        Order.find(
          {},
          {
            _id: 0,
            orderNo: 1,
            customerName: 1,
            total: 1,
            status: 1,
            createdAt: 1,
          },
        )
          .sort({ createdAt: -1, _id: -1 })
          .limit(RECENT_ORDER_LIMIT),
      ]);

      return response.json({
        totalProducts: toFiniteNumber(totalProducts),
        totalOrders: toFiniteNumber(totalOrders),
        totalRevenue: toFiniteNumber(deliveredRevenue?.[0]?.total),
        lowStockProducts: toFiniteNumber(lowStockProducts),
        ordersByDay: (Array.isArray(dailyOrderCounts) ? dailyOrderCounts : []).map(
          (entry) => ({
            date: String(entry?._id),
            count: toFiniteNumber(entry?.count),
          }),
        ),
        recentOrders: (Array.isArray(recentOrders) ? recentOrders : []).map(
          toSafeRecentOrder,
        ),
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

export default createStatsRouter;
