import api from "@/utils/api";

export interface AuctionsParams {
  status_name_key?: string;
  type_name_key?: string;
  seller_user_id?: string;
  skip?: number;
  limit?: number;
}

export async function readAllAvailableAuctions(params?: AuctionsParams) {
  const searchParams = new URLSearchParams();
  if (params?.status_name_key) searchParams.set("status_name_key", params.status_name_key);
  if (params?.type_name_key) searchParams.set("type_name_key", params.type_name_key);
  if (params?.seller_user_id) searchParams.set("seller_user_id", params.seller_user_id);
  if (params?.skip != null) searchParams.set("skip", String(params.skip));
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  const query = searchParams.toString();
  const url = query ? `api/v1/auctions/?${query}` : "api/v1/auctions/";
  const response = await api.get(url);
  return response;
}

export async function readAuctionById(auctionId: string) {
  const response = await api.get(`api/v1/auctions/${auctionId}`);
  return response;
}

export async function updateAuctionById(auctionId: string, data:unknown) {
  const response = await api.patch(`api/v1/auctions/${auctionId}`, data);
  return response;
}

export async function deleteAuctionById(auctionId: string) {
  const response = await api.delete(`api/v1/auctions/${auctionId}`)
  return response
}

export async function readMyAuction() {
  const response = await api.get('api/v1/auctions/me/created')
  return response
}

export async function createAuction(data: unknown) {
  const response = await api.post('api/v1/auctions/', data)
  return response
}

export async function readAllAuctionStatuses() {
  const response = await api.get('admin/admin/auctions/statuses')
  return response
}

export async function deleteAuctionStatusById(auctionStatusId: number) {
  const response = await api.delete(`admin/admin/auctions/statuses/${auctionStatusId}`)
  return response
}

export async function updateAuctionStatusById(auctionStatusId: number, data: unknown) {
  const response = await api.patch(`admin/admin/auctions/statuses/${auctionStatusId}`, data)
  return response
}

export async function createAuctionStatus(data: unknown) {
  const response = await api.post('admin/admin/auctions/statuses', data)
  return response
}