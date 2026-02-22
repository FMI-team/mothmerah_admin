import { readAllPendingClaims } from "./claims";
import { readUsers } from "./users";
import { readMyProdcuts } from "./products";
import { readMyAuction, readAllAvailableAuctions } from "./auctions";
import { readMyInventory } from "./inventories";

export interface DashboardOverviewKPI {
  value: number;
  change?: string;
}

export interface DashboardOverviewResponse {
  pending_claims?: DashboardOverviewKPI;
  new_orders?: DashboardOverviewKPI;
  active_users?: DashboardOverviewKPI;
  total_revenue?: DashboardOverviewKPI;
}

export async function getDashboardOverview(): Promise<{
  status: number;
  data: DashboardOverviewResponse;
}> {
  const [claimsRes, usersRes] = await Promise.all([
    readAllPendingClaims().catch(() => ({ status: 0, data: [] })),
    readUsers().catch(() => ({ status: 0, data: [] })),
  ]);

  const pendingClaimsList = Array.isArray(claimsRes.data) ? claimsRes.data : [];
  const usersList = Array.isArray(usersRes.data) ? usersRes.data : [];

  const data: DashboardOverviewResponse = {
    pending_claims: { value: pendingClaimsList.length },
    new_orders: { value: 0 },
    active_users: { value: usersList.length },
    total_revenue: { value: 0 }
  };

  return { status: 200, data };
}

export interface BaseUserDashboardKPI {
  value: number;
  change?: string;
}

export interface BaseUserDashboardResponse {
  my_products: BaseUserDashboardKPI;
  my_auctions: BaseUserDashboardKPI;
  my_inventory_items: BaseUserDashboardKPI;
  available_auctions: BaseUserDashboardKPI;
}

function countFromResponse(res: { data?: unknown }): number {
  const d = res.data;
  if (Array.isArray(d)) return d.length;
  if (d && typeof d === "object" && "results" in d && Array.isArray((d as { results: unknown }).results))
    return (d as { results: unknown[] }).results.length;
  if (d && typeof d === "object" && "items" in d && Array.isArray((d as { items: unknown }).items))
    return (d as { items: unknown[] }).items.length;
  return 0;
}

export async function getBaseUserDashboardOverview(): Promise<{
  status: number;
  data: BaseUserDashboardResponse;
}> {
  const [productsRes, auctionsRes, inventoryRes, availableRes] = await Promise.all([
    readMyProdcuts().catch(() => ({ status: 0, data: [] })),
    readMyAuction().catch(() => ({ status: 0, data: [] })),
    readMyInventory().catch(() => ({ status: 0, data: [] })),
    readAllAvailableAuctions().catch(() => ({ status: 0, data: [] })),
  ]);

  const data: BaseUserDashboardResponse = {
    my_products: { value: countFromResponse(productsRes) },
    my_auctions: { value: countFromResponse(auctionsRes) },
    my_inventory_items: { value: countFromResponse(inventoryRes) },
    available_auctions: { value: countFromResponse(availableRes) },
  };

  return { status: 200, data };
}

export interface BaseUserActivityItem {
  id: string;
  activity: string;
  itemId: string;
  status: string;
  date: string;
}

function formatActivityDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

export async function getBaseUserLatestActivity(): Promise<{
  status: number;
  data: BaseUserActivityItem[];
}> {
  const [productsRes, auctionsRes] = await Promise.all([
    readMyProdcuts().catch(() => ({ status: 0, data: [] })),
    readMyAuction().catch(() => ({ status: 0, data: [] })),
  ]);

  const products = Array.isArray(productsRes.data) ? productsRes.data : [];
  const auctions = Array.isArray(auctionsRes.data) ? auctionsRes.data : [];

  type WithSort = BaseUserActivityItem & { sortTime: number };
  const withSort: WithSort[] = [
    ...products.map((p: { product_id?: string; created_at?: string; status?: { status_name_key?: string } }) => ({
      id: `p-${p.product_id ?? ""}`,
      activity: "منتج",
      itemId: `PRD-${(p.product_id ?? "").slice(0, 8)}`,
      status: p.status?.status_name_key ?? "—",
      date: p.created_at ? formatActivityDate(p.created_at) : "—",
      sortTime: p.created_at ? new Date(p.created_at).getTime() : 0,
    })),
    ...auctions.map((a: { auction_id?: string; created_at?: string; auction_status?: { status_name_key?: string } }) => ({
      id: `a-${a.auction_id ?? ""}`,
      activity: "مزاد",
      itemId: `AUC-${(a.auction_id ?? "").slice(0, 8)}`,
      status: a.auction_status?.status_name_key ?? "—",
      date: a.created_at ? formatActivityDate(a.created_at) : "—",
      sortTime: a.created_at ? new Date(a.created_at).getTime() : 0,
    })),
  ];

  const sorted: BaseUserActivityItem[] = withSort.sort((x, y) => y.sortTime - x.sortTime).slice(0, 10).map((item) => ({
    id: item.id,
    activity: item.activity,
    itemId: item.itemId,
    status: item.status,
    date: item.date,
  }));

  return { status: 200, data: sorted };
}