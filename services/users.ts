import api from "@/utils/api";

export async function readUsers(opts?: { include_deleted?: boolean }) {
    const params: Record<string, boolean> = {};
    if (opts?.include_deleted === true) params.include_deleted = true;
    const response = await api.get('admin/users/', Object.keys(params).length > 0 ? { params } : {});
    return response;
}

export async function readUserById(userId: string) {
    const response = await api.get(`admin/users/${userId}`)
    return response
}

export async function deleteUser(userId: string) {
    const response = await api.delete(`admin/users/${userId}`)
    return response
}

export async function createUser(user: unknown) {
    const response = await api.post(`admin/users/create`, user)
    return response
}

export async function updateUserStatus(userId: string, data: {new_status_id: number, reason_for_change: string}) {
    const response = await api.patch(`admin/users/${userId}/status`, data)
    return response
}