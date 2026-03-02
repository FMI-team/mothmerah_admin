import api from "@/utils/api";

export async function readMyInventory() {
    const response  = await api.get('api/v1/inventory/me')
    return response
}

export async function adjustStock(productPackagingOptionId: number, changeInQuantity: number) {
    const response  = await api.post('api/v1/inventory/adjust-stock', {
        product_packaging_option_id: productPackagingOptionId,
        change_in_quantity: changeInQuantity
    })
    return response
}

export async function readInventoryProducts(product_id: string){
    const response = await api.get(`api/v1/inventory/products/${product_id}`)
    return response
}

export async function adjustInventoryProductStock(productPackagingOptionId: number, changeInQuantity: number, productId: string){
    const response = await api.post(`api/v1/inventory/products/${productId}/adjust`, {
        product_packaging_option_id: productPackagingOptionId,
        change_in_quantity: changeInQuantity
    })
    return response
}

export interface InventorySummarySeller {
    seller_user_id: string;
    total_items: number;
    total_value: number;
}

export interface InventorySummaryResponse {
    total_products: number;
    low_stock_items: number;
    out_of_stock_items: number;
    total_value: number;
    recent_movements: unknown[];
    sellers_summary: InventorySummarySeller[];
}

export async function readInventorySummary(sellerId?: string, categoryId?: number, search?: string) {
    const params: Record<string, string | number> = {};
    if (sellerId != null && sellerId !== "") params.seller_id = sellerId;
    if (categoryId != null) params.category_id = categoryId;
    if (search != null && search !== "") params.search = search;
    const response = await api.get<InventorySummaryResponse>("api/admin/inventory/summary", Object.keys(params).length > 0 ? { params } : {});
    return response;
}

export interface InventoryAdminProductItem {
    packaging_option_id: number;
    product_id: string;
    product_name: string;
    packaging_sku: string | null;
    base_price: number;
    on_hand_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    last_restock_date: string | null;
    seller_user_id: string;
    seller_name: string;
    category_id: number;
}

export interface InventoryAdminProductsResponse {
    total: number;
    page: number;
    limit: number;
    items: InventoryAdminProductItem[];
}

export async function readInventoryAdminProducts(
    opts?: { sellerId?: string; categoryId?: number; search?: string; page?: number; limit?: number }
) {
    const params: Record<string, string | number> = {};
    if (opts?.sellerId != null && opts.sellerId !== "") params.seller_id = opts.sellerId;
    if (opts?.categoryId != null) params.category_id = opts.categoryId;
    if (opts?.search != null && opts.search !== "") params.search = opts.search;
    if (opts?.page != null) params.page = opts.page;
    if (opts?.limit != null) params.limit = opts.limit;
    const response = await api.get<InventoryAdminProductsResponse>(
        "api/admin/inventory/products",
        Object.keys(params).length > 0 ? { params } : {}
    );
    return response;
}

// Product detail (single product) API response
export interface CategoryTranslation {
    language_code: string;
    translated_category_name: string;
    translated_category_description: string | null;
}

export interface ProductDetailCategory {
    category_id: number;
    category_name_key: string;
    parent_category_id: number | null;
    category_image_url: string | null;
    sort_order: number | null;
    is_active: boolean;
    translations: CategoryTranslation[];
}

export interface ProductDetailStatus {
    product_status_id: number;
    status_name_key: string;
}

export interface ProductDetailUnit {
    unit_id: number;
    unit_name_key: string;
    unit_abbreviation_key: string;
    is_active: boolean;
}

export interface ProductDetailTranslation {
    language_code: string;
    translated_product_name: string;
    translated_description: string | null;
    translated_short_description: string | null;
}

export interface PackagingOptionTranslation {
    language_code: string;
    translated_packaging_option_name?: string;
    translated_name?: string;
}

export interface ProductDetailPackagingOption {
    packaging_option_id: number;
    product_id: string;
    packaging_option_name_key: string;
    custom_packaging_description: string | null;
    quantity_in_packaging: number;
    unit_of_measure_id_for_quantity: number;
    base_price: number;
    sku: string | null;
    barcode: string | null;
    is_default_option: boolean;
    is_active: boolean;
    sort_order: number | null;
    unit_of_measure: ProductDetailUnit;
    translations: PackagingOptionTranslation[];
}

export interface ProductDetails {
    product_id: string;
    seller_user_id: string;
    category_id: number;
    base_price_per_unit: number;
    unit_of_measure_id: number;
    country_of_origin_code: string | null;
    is_organic: boolean;
    is_local_saudi_product: boolean;
    main_image_url: string | null;
    sku: string;
    tags: unknown;
    created_at: string;
    updated_at: string;
    category: ProductDetailCategory;
    status: ProductDetailStatus;
    unit_of_measure: ProductDetailUnit;
    translations: ProductDetailTranslation[];
    packaging_options: ProductDetailPackagingOption[];
}

export interface CurrentStock {
    available: number;
    on_hand: number;
    reserved: number;
}

export interface InventoryAdminProductDetailResponse {
    product_details: ProductDetails;
    inventory_history: unknown[];
    current_stock: CurrentStock;
}

export async function readInventoryAdminProduct(productId: string) {
    const response = await api.get<InventoryAdminProductDetailResponse>(`api/admin/inventory/products/${productId}`);
    return response;
}