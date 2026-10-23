import express from "express";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createAuthMiddleware } from "../middleware/auth.js";

const DASHBOARD_DAYS = 7;
const RECENT_ORDER_LIMIT = 5;

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getUtcDateRange() {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (DASHBOARD_DAYS - 1));
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function getUtcDateKeys(start) {
  return Array.from({ length: DASHBOARD_DAYS }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
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
    // UTC keeps the seven-day window and its labels independent of the
    // browser/server local timezone.
    const { start, end } = getUtcDateRange();
    const dateKeys = getUtcDateKeys(start);

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
            $match: {
              createdAt: {
                $gte: start,
                $lt: end,
              },
            },
          },
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

      const orderCountByDate = new Map(
        (Array.isArray(dailyOrderCounts) ? dailyOrderCounts : []).map(
          (entry) => [String(entry?._id), toFiniteNumber(entry?.count)],
        ),
      );

      return response.json({
        totalProducts: toFiniteNumber(totalProducts),
        totalOrders: toFiniteNumber(totalOrders),
        totalRevenue: toFiniteNumber(deliveredRevenue?.[0]?.total),
        lowStockProducts: toFiniteNumber(lowStockProducts),
        ordersByDay: dateKeys.map((date) => ({
          date,
          count: toFiniteNumber(orderCountByDate.get(date)),
        })),
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
