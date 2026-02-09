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