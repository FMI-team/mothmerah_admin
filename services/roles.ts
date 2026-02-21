import api from "@/utils/api";

export async function readRoles() {
  const response = await api.get("admin/rbac/roles");
  return response;
}

export async function createNewRole(role: unknown) {
  const response = await api.post('admin/rbac/roles', role)
  return response
}

export async function removeRole(role_id: number) {
  const response = await api.delete(`admin/rbac/roles/${role_id}`)
  return response
}