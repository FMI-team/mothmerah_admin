import api from "@/utils/api";

export async function deleteProduct(productId: string) {
    const response = await api.delete(`api/v1/products/${productId}`)
    return response
}

export async function readMyProdcuts() {
    const response = await api.get('api/v1/products/me')
    return response
}

export async function readProduct(productId: string) {
    const response = await api.get(`api/v1/products/${productId}`)
    return response
}

export async function updateProduct(productId: string, data: unknown) {
    const response = await api.patch(`api/v1/products/${productId}`, data)
    return response
}

export async function createProduct(data: FormData) {
    const response = await api.post("api/v1/products/", data);
    return response;
}