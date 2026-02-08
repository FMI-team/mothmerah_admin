import api from "@/utils/api"

export async function readCategories() {
    const response = await api.get('api/v1/products/categories')
    return response
}