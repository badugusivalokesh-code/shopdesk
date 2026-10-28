import { useCallback, useEffect, useRef, useState } from "react";

import {
  getApiErrorMessage,
  listOrders,
  ORDER_STATUSES,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "@/api/shopdesk";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  PageHeading,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
  type StatusBadgeTone,
} from "@/components/ui";

type OrderStatusFilter = "" | OrderStatus;

type OrdersState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: Order[] };

const orderStatusOptions = ORDER_STATUSES.map((status) => ({ label: status, value: status }));

const orderStatusTones: Record<OrderStatus, StatusBadgeTone> = {
  Cancelled: "danger",
  Delivered: "success",
  Pending: "warning",
  Processing: "info",
  Shipped: "info",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const orderDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export default function OrdersPage() {
  const { error: showError, success: showSuccess } = useToast();
  const requestId = useRef(0);
  const mountedRef = useRef(false);
  const filterRef = useRef<OrderStatusFilter>("");
  const updatingOrderRef = useRef<string | null>(null);
  const [state, setState] = useState<OrdersState>({ status: "loading" });
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadData = useCallback((filter: OrderStatusFilter) => {
    const currentRequestId = ++requestId.current;
    setState({ status: "loading" });

    void listOrders(filter || undefined)
      .then((orders) => {
        if (requestId.current === currentRequestId) {
          setState({ data: orders, status: "success" });
        }
      })
      .catch((error: unknown) => {
        if (requestId.current === currentRequestId) {
          setState({ message: getApiErrorMessage(error, "The order list could not be loaded."), status: "error" });
        }
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadData(statusFilter);
    return () => {
      requestId.current += 1;
    };
  }, [loadData, statusFilter]);

  function handleStatusChange(order: Order, value: string) {
    if (updatingOrderRef.current !== null || value === order.status) {
      return;
    }

    if (!isOrderStatus(value)) {
      showError({
        description: "Choose one of the available order statuses.",
        title: "Status was not changed",
      });
      return;
    }

    updatingOrderRef.current = order.id;
    setUpdatingOrderId(order.id);

    void updateOrderStatus(order.id, value)
      .then(() => {
        if (mountedRef.current) {
          loadData(filterRef.current);
          showSuccess({
            description: `${order.orderNo} is now marked ${value.toLowerCase()}.`,
            title: "Order status updated",
          });
        }
      })
      .catch((error: unknown) => {
        if (mountedRef.current) {
          showError({
            description: getApiErrorMessage(error, "The order status could not be updated."),
            title: "Could not update order status",
          });
        }
      })
      .finally(() => {
        updatingOrderRef.current = null;
        if (mountedRef.current) {
          setUpdatingOrderId(null);
        }
      });
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <PageHeading
        action={
          <div className="w-full sm:w-56">
            <Select
              aria-label="Filter orders by status"
              label="Status filter"
              onChange={(event) => {
                const value = event.target.value;
                if (value === "" || isOrderStatus(value)) {
                  filterRef.current = value;
                  setStatusFilter(value);
                }
              }}
              options={orderStatusOptions}
              placeholder="All statuses"
              value={statusFilter}
            />
          </div>
        }
        className="min-w-0 sm:items-end"
        description="Review the order queue and update fulfillment status."
        eyebrow="ShopDesk · Orders"
        title="Orders"
      />

      <Card className="min-w-0">
        <CardHeader className="flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>Order queue</CardTitle>
            <CardDescription>Filter orders by status and manage fulfillment.</CardDescription>
          </div>
          {state.status === "success" ? (
            <StatusBadge
              className="shrink-0"
              label={`${state.data.length} shown`}
              size="sm"
              status="neutral"
              tone="neutral"
            />
          ) : null}
        </CardHeader>
        <CardContent className="min-w-0 py-4 sm:py-5">
          {state.status === "loading" ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <LoadingIndicator label="Loading orders" showLabel size="lg" />
            </div>
          ) : null}

          {state.status === "error" ? (
            <ErrorState
              description={state.message}
              onRetry={() => loadData(statusFilter)}
              retryLabel="Retry orders load"
              title="The order list is unavailable"
            />
          ) : null}

          {state.status === "success" ? (
            state.data.length === 0 ? (
              <EmptyState
                action={statusFilter ? (
                  <Button
                    onClick={() => {
                      filterRef.current = "";
                      setStatusFilter("");
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Clear status filter
                  </Button>
                ) : undefined}
                description={statusFilter ? "Try another status or clear the current filter." : "There are no orders yet."}
                title={statusFilter ? "No orders match this status" : "No orders yet"}
              />
            ) : (
              <Table aria-label="Orders" className="w-full min-w-[60rem] table-fixed" wrapperClassName="min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[16%] px-3 sm:px-4">Order number</TableHead>
                    <TableHead className="w-[18%] px-3 sm:px-4">Customer</TableHead>
                    <TableHead className="w-[14%] px-3 sm:px-4">Date</TableHead>
                    <TableHead className="w-[13%] px-3 text-right sm:px-4">Total</TableHead>
                    <TableHead className="w-[15%] px-3 sm:px-4">Status</TableHead>
                    <TableHead className="w-[24%] px-3 sm:px-4">Change status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="px-3 py-2 sm:px-4">
                        <span className="inline-block max-w-full break-all rounded-control bg-surface-secondary px-2.5 py-1 font-bold tabular-nums tracking-tight text-brand">
                          {order.orderNo}
                        </span>
                      </TableCell>
                      <TableCell className="break-words px-3 py-2 font-semibold text-text-primary sm:px-4">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-text-secondary sm:px-4">
                        {orderDateFormatter.format(new Date(order.createdAt))}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums text-text-primary sm:px-4">
                        {currencyFormatter.format(order.total)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 sm:px-4">
                        <StatusBadge
                          label={order.status}
                          size="md"
                          status={order.status}
                          tone={orderStatusTones[order.status]}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="min-w-0 max-w-48 flex-1">
                            <Select
                              aria-label={`Change status for ${order.orderNo}`}
                              className="min-w-0"
                              disabled={updatingOrderId !== null}
                              onChange={(event) => handleStatusChange(order, event.target.value)}
                              options={orderStatusOptions}
                              value={order.status}
                            />
                          </div>
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            {updatingOrderId === order.id ? (
                              <LoadingIndicator aria-label={`Updating ${order.orderNo}`} size="sm" />
                            ) : null}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
