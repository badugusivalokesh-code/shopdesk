import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getApiErrorMessage,
  getDashboardStats,
  type DashboardStats,
  type OrderStatus,
} from "@/api/shopdesk";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  PageHeading,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type StatusBadgeTone,
} from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { colors } from "@/styles/tokens";

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: DashboardStats };

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const countFormatter = new Intl.NumberFormat("en-US");

const chartDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const chartTooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
});

const orderDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const orderStatusTones: Record<OrderStatus, StatusBadgeTone> = {
  Cancelled: "danger",
  Delivered: "success",
  Pending: "warning",
  Processing: "info",
  Shipped: "info",
};

function formatChartDate(date: string): string {
  // The API provides UTC date keys; midnight UTC prevents local day shifts.
  return chartDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function formatChartTooltipDate(date: string): string {
  return chartTooltipDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function formatOrderDate(createdAt: string): string {
  return orderDateFormatter.format(new Date(createdAt));
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatCount(value: number): string {
  return countFormatter.format(value);
}

export default function SetupStatusPage() {
  const { theme } = useTheme();
  const requestId = useRef(0);
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const loadData = useCallback(() => {
    const currentRequestId = ++requestId.current;
    setState({ status: "loading" });

    void getDashboardStats()
      .then((data) => {
        if (requestId.current === currentRequestId) {
          setState({ data, status: "success" });
        }
      })
      .catch((error: unknown) => {
        if (requestId.current === currentRequestId) {
          setState({
            message: getApiErrorMessage(error, "Could not load shop statistics."),
            status: "error",
          });
        }
      });
  }, []);

  useEffect(() => {
    loadData();

    return () => {
      requestId.current += 1;
    };
  }, [loadData]);

  const chartTokens = theme === "dark" ? colors.dark : colors.light;
  const chartBrand = chartTokens.brand;

  return (
    <div className="min-w-0 space-y-8">
      <PageHeading
        action={<StatusBadge label="Shop activity" size="sm" status="info" tone="info" />}
        description="A focused view of your catalog and order activity."
        eyebrow="ShopDesk · Dashboard"
        title="Here is your shop overview"
      />

      {state.status === "loading" ? (
        <Card className="min-w-0">
          <CardContent className="flex min-h-[18rem] items-center justify-center p-6 sm:min-h-[20rem]">
            <LoadingIndicator label="Loading shop dashboard" showLabel size="lg" />
          </CardContent>
        </Card>
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          description={state.message}
          onRetry={loadData}
          retryLabel="Retry dashboard load"
          className="min-h-[18rem]"
          title="The dashboard is unavailable"
        />
      ) : null}

      {state.status === "success" ? (
        <DashboardContent data={state.data} chartBrand={chartBrand} chartTokens={chartTokens} />
      ) : null}
    </div>
  );
}

type DashboardContentProps = {
  data: DashboardStats;
  chartBrand: string;
  chartTokens: typeof colors.light | typeof colors.dark;
};

function DashboardContent({ data, chartBrand, chartTokens }: DashboardContentProps) {
  const { ordersByDay, recentOrders } = data;

  return (
    <div className="space-y-6">
      <section
        aria-label="Dashboard summary"
        className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          detail="Products in your catalog"
          icon={<ProductsIcon className="h-5 w-5" />}
          label="Total Products"
          value={formatCount(data.totalProducts)}
        />
        <SummaryCard
          detail="Across all orders"
          icon={<OrdersIcon className="h-5 w-5" />}
          label="Total Orders"
          value={formatCount(data.totalOrders)}
        />
        <SummaryCard
          detail="From delivered orders"
          icon={<RevenueIcon className="h-5 w-5" />}
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
        />
        <SummaryCard
          detail="5 units or fewer"
          icon={<StockIcon className="h-5 w-5" />}
          label="Low Stock Items"
          value={formatCount(data.lowStockProducts)}
        />
      </section>

      <Card className="min-w-0">
        <CardHeader className="flex-wrap sm:items-center">
          <div className="min-w-0">
            <CardTitle>Orders per day</CardTitle>
            <CardDescription>Daily order volume over the last 7 days (UTC).</CardDescription>
          </div>
          <StatusBadge label="Last 7 days" status="info" tone="info" size="sm" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {ordersByDay.length === 0 ? (
            <EmptyState
              className="min-h-[18rem] border-0 bg-surface-secondary/50 p-6 sm:p-8"
              description="There are no daily order statistics to display yet."
              title="No order trend available"
            />
          ) : (
            <div
              aria-label="Orders per day for the last 7 days"
              className="h-[18rem] min-w-0 w-full sm:h-[20rem] lg:h-[22rem]"
              role="img"
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  barCategoryGap="24%"
                  data={ordersByDay}
                  margin={{ bottom: 8, left: 0, right: 8, top: 12 }}
                >
                  <CartesianGrid
                    stroke={chartTokens.border}
                    strokeDasharray="3 3"
                    strokeOpacity={0.8}
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    interval="preserveStartEnd"
                    minTickGap={18}
                    padding={{ left: 8, right: 8 }}
                    tickFormatter={formatChartDate}
                    tick={{ fill: chartTokens.textSecondary, fontSize: 11 }}
                    tickMargin={8}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickFormatter={formatCount}
                    tick={{ fill: chartTokens.textSecondary, fontSize: 11 }}
                    tickMargin={8}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTokens.surface,
                      border: `1px solid ${chartTokens.border}`,
                      borderRadius: "12px",
                      color: chartTokens.textPrimary,
                    }}
                    cursor={{ fill: chartTokens.surfaceSecondary, fillOpacity: 0.8 }}
                    formatter={(value) => [formatCount(Number(value)), "Orders"]}
                    itemStyle={{ color: chartBrand, fontWeight: 700 }}
                    labelFormatter={(label) => formatChartTooltipDate(String(label))}
                    labelStyle={{ color: chartTokens.textSecondary, fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="count"
                    fill={chartBrand}
                    maxBarSize={48}
                    name="Orders"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="flex-wrap sm:items-center">
          <div className="min-w-0">
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Your latest orders. Totals are shown in USD.</CardDescription>
          </div>
          <StatusBadge
            label={`${recentOrders.length} shown`}
            status="neutral"
            tone="neutral"
            size="sm"
          />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {recentOrders.length === 0 ? (
            <EmptyState
              className="border-0 bg-surface-secondary/50 p-8"
              description="Orders will appear here once your shop receives them."
              title="No recent orders"
            />
          ) : (
            <Table
              aria-label="Recent orders"
              className="min-w-[46rem]"
              wrapperClassName="overflow-x-auto"
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10rem]">Order number</TableHead>
                  <TableHead className="min-w-[13rem]">Customer</TableHead>
                  <TableHead className="w-[9rem]">Date</TableHead>
                  <TableHead className="w-[8rem] text-right">Total</TableHead>
                  <TableHead className="w-[8.5rem]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.orderNo}>
                    <TableCell className="w-[10rem] whitespace-nowrap font-semibold text-brand">
                      {order.orderNo}
                    </TableCell>
                    <TableCell className="min-w-[13rem] font-medium">{order.customerName}</TableCell>
                    <TableCell className="w-[9rem] whitespace-nowrap text-text-secondary">
                      {formatOrderDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="w-[8rem] whitespace-nowrap text-right font-semibold">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="w-[8.5rem] whitespace-nowrap">
                      <StatusBadge
                        className="min-w-[6.5rem] justify-center"
                        label={order.status}
                        status={order.status}
                        tone={orderStatusTones[order.status]}
                        size="sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type SummaryCardProps = {
  detail: string;
  icon: ReactNode;
  label: string;
  value: string;
};

function SummaryCard({ detail, icon, label, value }: SummaryCardProps) {
  return (
    <Card className="h-full min-w-0 transition-shadow hover:shadow-card dark:shadow-card-dark dark:hover:shadow-card-dark">
      <CardContent className="flex h-full min-h-[168px] flex-col p-5 sm:min-h-[176px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="min-h-5 min-w-0 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">
            {label}
          </p>
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-secondary text-brand"
          >
            {icon}
          </div>
        </div>
        <div className="mt-auto pt-7">
          <p className="truncate text-2xl font-bold leading-none tracking-tight text-text-primary sm:text-[1.75rem]">
            {value}
          </p>
          <p className="mt-2 min-h-10 text-xs leading-5 text-text-tertiary">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="m4 8 8-4 8 4-8 4-8-4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4 8v8l8 4 8-4V8M12 12v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M5 6.5h14v13H5zM8 4.5v4M16 4.5v4M5 10.5h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M9 14h2m2 0h2m-6 3h2m2 0h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function RevenueIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3v18M16.5 7.5c-.8-1-2.1-1.5-4-1.5-2.2 0-3.5 1.1-3.5 2.6 0 1.6 1.3 2.3 3.5 2.9 2.2.6 3.5 1.3 3.5 2.9 0 1.5-1.3 2.6-3.5 2.6-1.9 0-3.2-.5-4-1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StockIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 4 3.8 19h16.4L12 4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M12 9v4m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
