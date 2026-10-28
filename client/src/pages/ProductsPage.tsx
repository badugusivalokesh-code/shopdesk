import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  PRODUCT_CATEGORIES,
  createProduct,
  deleteProduct,
  getApiErrorMessage,
  listProducts,
  updateProduct,
  type Product,
  type ProductInput,
  type ProductListResponse,
} from "@/api/shopdesk";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogFooter,
  EmptyState,
  ErrorState,
  Input,
  LoadingIndicator,
  PageHeading,
  SearchInput,
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

type ProductsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: ProductListResponse };

type ProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  imageUrl: string;
};

type ProductFormErrors = Partial<Record<keyof ProductForm, string>>;

type StockPresentation = {
  label: string;
  status: string;
  tone: StatusBadgeTone;
};

const productCategoryOptions = PRODUCT_CATEGORIES.map((category) => ({
  label: category,
  value: category,
}));

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

function createEmptyProductForm(): ProductForm {
  return {
    category: "",
    imageUrl: "",
    name: "",
    price: "",
    stock: "",
  };
}

function productToForm(product: Product): ProductForm {
  return {
    category: product.category,
    imageUrl: product.imageUrl ?? "",
    name: product.name,
    price: String(product.price),
    stock: String(product.stock),
  };
}

function validateProductForm(form: ProductForm): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const trimmedName = form.name.trim();
  const trimmedCategory = form.category.trim();
  const trimmedPrice = form.price.trim();
  const trimmedStock = form.stock.trim();

  if (!trimmedName) {
    errors.name = "Product name is required.";
  }

  if (!PRODUCT_CATEGORIES.some((category) => category === trimmedCategory)) {
    errors.category = "Select a listed category.";
  }

  const price = Number(trimmedPrice);
  if (!trimmedPrice || !Number.isFinite(price) || price <= 0) {
    errors.price = "Enter a numeric price greater than 0.";
  }

  const stock = Number(trimmedStock);
  if (!trimmedStock || !Number.isInteger(stock) || stock < 0) {
    errors.stock = "Stock must be a non-negative whole number.";
  }

  if (form.imageUrl.trim()) {
    try {
      const imageUrl = new URL(form.imageUrl.trim());
      if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
        errors.imageUrl = "Image URL must start with http:// or https://.";
      }
    } catch {
      errors.imageUrl = "Enter a valid image URL or leave this field blank.";
    }
  }

  return errors;
}

function getStockPresentation(stock: number): StockPresentation {
  if (stock === 0) {
    return { label: "Out of stock", status: "out-of-stock", tone: "danger" };
  }

  if (stock <= 5) {
    return { label: "Low stock", status: "low-stock", tone: "warning" };
  }

  return { label: "In stock", status: "in-stock", tone: "success" };
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export default function ProductsPage() {
  const { error: showError, success: showSuccess } = useToast();
  const requestId = useRef(0);
  const mutationInFlight = useRef(false);
  const productNameInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ProductsState>({ status: "loading" });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(createEmptyProductForm);
  const [productFormErrors, setProductFormErrors] = useState<ProductFormErrors>({});
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const loadData = useCallback(() => {
    const currentRequestId = ++requestId.current;
    setState({ status: "loading" });

    void listProducts(searchQuery.trim(), categoryFilter, currentPage)
      .then((data) => {
        if (requestId.current === currentRequestId) {
          if (currentPage > Math.max(1, data.totalPages)) {
            setCurrentPage(Math.max(1, data.totalPages));
            return;
          }

          setState({ data, status: "success" });
        }
      })
      .catch((error: unknown) => {
        if (requestId.current === currentRequestId) {
          setState({
            message: getApiErrorMessage(error, "Could not load products."),
            status: "error",
          });
        }
      });
  }, [categoryFilter, currentPage, searchQuery]);

  useEffect(() => {
    loadData();

    return () => {
      requestId.current += 1;
    };
  }, [loadData]);

  function openCreateDialog() {
    setEditingProductId(null);
    setProductForm(createEmptyProductForm());
    setProductFormErrors({});
    setIsProductDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProductId(product.id);
    setProductForm(productToForm(product));
    setProductFormErrors({});
    setIsProductDialogOpen(true);
  }

  function closeProductDialog() {
    if (isSavingProduct) {
      return;
    }

    resetProductDialog();
  }

  function resetProductDialog() {
    setIsProductDialogOpen(false);
    setEditingProductId(null);
    setProductForm(createEmptyProductForm());
    setProductFormErrors({});
  }

  function handleProductFieldChange(
    field: keyof ProductForm,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setProductForm((form) => ({ ...form, [field]: event.target.value }));
    setProductFormErrors((errors) => {
      if (!errors[field]) {
        return errors;
      }

      const nextErrors = { ...errors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutationInFlight.current) {
      return;
    }

    const errors = validateProductForm(productForm);
    if (Object.keys(errors).length > 0) {
      setProductFormErrors(errors);
      window.requestAnimationFrame(() => {
        productNameInputRef.current?.focus();
      });
      return;
    }

    mutationInFlight.current = true;
    setProductFormErrors({});
    setIsSavingProduct(true);

    try {
      const payload: ProductInput = {
        category: productForm.category.trim(),
        imageUrl: productForm.imageUrl.trim(),
        name: productForm.name.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      };
      const wasEditing = editingProductId !== null;
      const product = wasEditing
        ? await updateProduct(editingProductId, payload)
        : await createProduct(payload);

      if (wasEditing) {
        showSuccess({
          description: `${product.name} was updated.`,
          title: "Product updated",
        });
      } else {
        showSuccess({
          description: `${product.name} was added to your catalog.`,
          title: "Product added",
        });
      }

      resetProductDialog();
      if (!wasEditing && currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadData();
      }
    } catch (error: unknown) {
      showError({
        description: getApiErrorMessage(error, "Could not save product."),
        title: "Could not save product",
      });
    } finally {
      mutationInFlight.current = false;
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct() {
    if (!productToDelete || mutationInFlight.current) {
      return;
    }

    mutationInFlight.current = true;
    setIsDeletingProduct(true);

    try {
      const deletedName = productToDelete.name;
      const deletedLastOnPage =
        state.status === "success" && state.data.products.length === 1 && currentPage > 1;
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      showSuccess({
        description: `${deletedName} was removed from your catalog.`,
        title: "Product deleted",
      });
      if (deletedLastOnPage) {
        setCurrentPage((page) => Math.max(1, page - 1));
      } else {
        loadData();
      }
    } catch (error: unknown) {
      showError({
        description: getApiErrorMessage(error, "Could not delete product."),
        title: "Could not delete product",
      });
    } finally {
      mutationInFlight.current = false;
      setIsDeletingProduct(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <PageHeading
        action={
          <Button
            className="w-full sm:w-auto"
            disabled={state.status !== "success" || isDeletingProduct}
            onClick={openCreateDialog}
            type="button"
          >
            <PlusIcon />
            Add product
          </Button>
        }
        className="min-w-0 sm:items-center"
        description="Browse, search, and manage your shop catalog."
        eyebrow="ShopDesk · Products"
        title="Products"
      />

      <Card className="min-w-0">
        <CardHeader className="flex-wrap sm:items-center">
          <div className="min-w-0">
            <CardTitle>Product catalog</CardTitle>
            <CardDescription>Search, filter, and update products in your catalog.</CardDescription>
          </div>
          {state.status === "success" ? (
            <StatusBadge
              className="shrink-0"
              label={`${state.data.total} products`}
              size="sm"
              status="info"
              tone="info"
            />
          ) : null}
        </CardHeader>

        <CardContent className="min-w-0 space-y-5 sm:py-6">
          <div className="grid min-w-0 gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] lg:items-end lg:gap-5">
            <SearchInput
              aria-label="Search products"
              label="Search products"
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              placeholder="Search by product name or category"
              value={searchQuery}
            />
            <Select
              aria-label="Filter products by category"
              label="Category"
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
              options={productCategoryOptions}
              placeholder="All categories"
              value={categoryFilter}
            />
          </div>

          {state.status === "loading" ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <LoadingIndicator label="Loading product catalog" showLabel size="lg" />
            </div>
          ) : state.status === "error" ? (
            <ErrorState
              description={state.message}
              onRetry={loadData}
              retryLabel="Retry catalog load"
              title="The product catalog is unavailable"
            />
          ) : state.data.products.length === 0 && !searchQuery.trim() && !categoryFilter ? (
            <EmptyState
              action={
                <Button onClick={openCreateDialog} type="button">
                  Add your first product
                </Button>
              }
              description="Add a product to get started."
              title="No products yet"
            />
          ) : state.data.products.length === 0 ? (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("");
                    setCurrentPage(1);
                  }}
                  type="button"
                  variant="outline"
                >
                  Clear filters
                </Button>
              }
              description="Try a different search term or category filter."
              title="No products match these filters"
            />
          ) : (
            <>
              <Table
                aria-label="Products"
                className="w-full min-w-[56rem] table-fixed"
                wrapperClassName="min-w-0"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%] py-3">Product</TableHead>
                    <TableHead className="w-[17%] py-3">Category</TableHead>
                    <TableHead className="w-[14%] py-3 text-right">Price</TableHead>
                    <TableHead className="w-[19%] py-3">Stock</TableHead>
                    <TableHead className="w-[20%] py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.data.products.map((product) => {
                    const stockPresentation = getStockPresentation(product.stock);

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand/10 text-xs font-bold text-brand ring-1 ring-inset ring-brand/15"
                            >
                              {getInitials(product.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold leading-5 text-text-primary">{product.name}</p>
                              <p className="mt-1 truncate text-xs leading-4 text-text-tertiary">
                                {product.imageUrl ? "Custom image" : "No image"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-text-secondary">
                          {product.category}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="font-semibold tabular-nums text-text-primary">{product.stock} units</span>
                            <StatusBadge
                              className="min-w-[6.75rem] justify-center"
                              label={stockPresentation.label}
                              size="sm"
                              status={stockPresentation.status}
                              tone={stockPresentation.tone}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              aria-label={`Edit ${product.name}`}
                              onClick={() => openEditDialog(product)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              aria-label={`Delete ${product.name}`}
                              onClick={() => setProductToDelete(product)}
                              size="sm"
                              type="button"
                              variant="destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex min-w-0 flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-text-secondary sm:text-sm">
                  Showing {(state.data.page - 1) * state.data.limit + 1}–
                  {Math.min(state.data.page * state.data.limit, state.data.total)} of {state.data.total} products
                </p>
                <nav aria-label="Product pagination" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                  <Button
                    aria-label="Previous product page"
                    disabled={!state.data.hasPreviousPage}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span aria-current="page" className="min-w-[5.75rem] text-center text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                    Page {state.data.page} of {state.data.totalPages}
                  </span>
                  <Button
                    aria-label="Next product page"
                    disabled={!state.data.hasNextPage}
                    onClick={() => setCurrentPage((page) => page + 1)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        closeOnBackdrop={!isSavingProduct}
        closeOnEscape={!isSavingProduct}
        onClose={closeProductDialog}
        open={isProductDialogOpen}
        title={editingProductId ? "Edit product" : "Add product"}
        description="Complete the required fields to save this product."
      >
        <form className="space-y-5" noValidate onSubmit={handleProductSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-y-5">
            <div className="sm:col-span-2">
              <Input
                autoComplete="off"
                autoFocus
                error={productFormErrors.name}
                id="product-name"
                label="Product name"
                onChange={(event) => handleProductFieldChange("name", event)}
                ref={productNameInputRef}
                required
                value={productForm.name}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                error={productFormErrors.category}
                id="product-category"
                label="Category"
                onChange={(event) => handleProductFieldChange("category", event)}
                options={productCategoryOptions}
                placeholder="Select a category"
                required
                value={productForm.category}
              />
            </div>
            <Input
              error={productFormErrors.price}
              id="product-price"
              inputMode="decimal"
              label="Price (USD)"
              min="0.01"
              onChange={(event) => handleProductFieldChange("price", event)}
              required
              step="0.01"
              type="number"
              value={productForm.price}
            />
            <Input
              error={productFormErrors.stock}
              id="product-stock"
              inputMode="numeric"
              label="Stock units"
              min="0"
              onChange={(event) => handleProductFieldChange("stock", event)}
              required
              step="1"
              type="number"
              value={productForm.stock}
            />
            <div className="sm:col-span-2">
              <Input
                autoComplete="url"
                error={productFormErrors.imageUrl}
                hint="Optional. Use an http:// or https:// image URL."
                id="product-image-url"
                label="Image URL"
                onChange={(event) => handleProductFieldChange("imageUrl", event)}
                type="url"
                value={productForm.imageUrl}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              className="w-full sm:w-auto"
              disabled={isSavingProduct}
              onClick={closeProductDialog}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto sm:min-w-32"
              loading={isSavingProduct}
              loadingLabel="Saving product"
              type="submit"
            >
              {editingProductId ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog
        closeOnBackdrop={!isDeletingProduct}
        closeOnEscape={!isDeletingProduct}
        onClose={() => {
          if (!isDeletingProduct) {
            setProductToDelete(null);
          }
        }}
        open={productToDelete !== null}
        size="sm"
        title="Delete product?"
        description="This permanently removes the product from your catalog."
      >
        <div className="flex items-start gap-3 rounded-panel border border-danger/25 bg-danger/5 p-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-danger/10 text-danger"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="M12 3.5 2.5 20h19L12 3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
              <path d="M12 9v4m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
            </svg>
          </span>
          <p className="min-w-0 break-words text-sm leading-6 text-text-secondary">
            Delete <span className="font-semibold text-text-primary">{productToDelete?.name}</span>? This action cannot be undone.
          </p>
        </div>
        <DialogFooter className="gap-3 border-danger/20">
          <Button
            className="w-full sm:w-auto"
            disabled={isDeletingProduct}
            onClick={() => setProductToDelete(null)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto sm:min-w-32"
            loading={isDeletingProduct}
            loadingLabel="Deleting product"
            onClick={() => void handleDeleteProduct()}
            type="button"
            variant="destructive"
          >
            Delete product
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function getInitials(value: string): string {
  const initials = value
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "P";
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
