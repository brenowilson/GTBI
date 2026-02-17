import { ExternalServiceError } from "./errors.ts";

const IFOOD_BASE_URL = "https://merchant-api.ifood.com.br";
const IFOOD_AUTH_URL = "https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token";

export interface IfoodTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface IfoodRestaurant {
  id: string;
  name: string;
  address?: string;
  status?: string;
}

export interface IfoodPerformanceData {
  visits: number;
  views: number;
  toCart: number;
  checkout: number;
  completed: number;
  cancellationRate: number;
  openTimeRate: number;
  openTicketsRate: number;
  newCustomersRate: number;
}

export interface IfoodOrder {
  id: string;
  status: string;
  total: number;
  itemsCount: number;
  customerName: string;
  orderDate: string;
}

export interface IfoodReview {
  id: string;
  orderId: string;
  rating: number;
  comment: string;
  customerName: string;
  reviewDate: string;
}

export interface IfoodTicket {
  id: string;
  orderId: string;
  subject: string;
  status: string;
}

export interface IfoodFinancialEntry {
  id: string;
  type: string;
  description: string;
  amount: number;
  referenceDate: string;
  orderId?: string;
}

/**
 * Exchanges client credentials for an OAuth token with the iFood API.
 */
export async function exchangeToken(
  clientId: string,
  clientSecret: string,
): Promise<IfoodTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(IFOOD_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "iFood Auth",
      `Token exchange failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token ?? data.accessToken,
    refreshToken: data.refresh_token ?? data.refreshToken ?? "",
    expiresIn: data.expires_in ?? data.expiresIn ?? 3600,
    tokenType: data.token_type ?? data.tokenType ?? "Bearer",
  };
}

/**
 * Refreshes an OAuth token with the iFood API.
 */
export async function refreshToken(
  clientId: string,
  clientSecret: string,
  currentRefreshToken: string,
): Promise<IfoodTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: currentRefreshToken,
  });

  const response = await fetch(IFOOD_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "iFood Auth",
      `Token refresh failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token ?? data.accessToken,
    refreshToken: data.refresh_token ?? data.refreshToken ?? currentRefreshToken,
    expiresIn: data.expires_in ?? data.expiresIn ?? 3600,
    tokenType: data.token_type ?? data.tokenType ?? "Bearer",
  };
}

/**
 * Generic iFood API request helper with Bearer token.
 */
async function ifoodRequest<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${IFOOD_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "iFood API",
      `Request to ${path} failed (${response.status}): ${errorText}`,
    );
  }

  return await response.json() as T;
}

/**
 * Lists restaurants (merchants) associated with the account.
 */
export async function listRestaurants(
  accessToken: string,
  merchantId: string,
): Promise<IfoodRestaurant[]> {
  const data = await ifoodRequest<IfoodRestaurant[] | { restaurants: IfoodRestaurant[] }>(
    accessToken,
    `/merchant/v1.0/merchants/${merchantId}/restaurants`,
  );

  return Array.isArray(data) ? data : (data.restaurants ?? []);
}

/**
 * Fetches performance metrics for a restaurant in a given date range.
 */
export async function getPerformanceMetrics(
  accessToken: string,
  restaurantId: string,
  startDate: string,
  endDate: string,
): Promise<IfoodPerformanceData> {
  const data = await ifoodRequest<Record<string, unknown>>(
    accessToken,
    `/merchant/v1.0/restaurants/${restaurantId}/performance?startDate=${startDate}&endDate=${endDate}`,
  );

  return {
    visits: Number(data.visits ?? 0),
    views: Number(data.views ?? 0),
    toCart: Number(data.toCart ?? data.to_cart ?? 0),
    checkout: Number(data.checkout ?? 0),
    completed: Number(data.completed ?? 0),
    cancellationRate: Number(data.cancellationRate ?? data.cancellation_rate ?? 0),
    openTimeRate: Number(data.openTimeRate ?? data.open_time_rate ?? 0),
    openTicketsRate: Number(data.openTicketsRate ?? data.open_tickets_rate ?? 0),
    newCustomersRate: Number(data.newCustomersRate ?? data.new_customers_rate ?? 0),
  };
}

/**
 * Fetches recent orders for a restaurant.
 */
export async function getOrders(
  accessToken: string,
  restaurantId: string,
  startDate: string,
  endDate: string,
): Promise<IfoodOrder[]> {
  const data = await ifoodRequest<IfoodOrder[] | { orders: IfoodOrder[] }>(
    accessToken,
    `/merchant/v1.0/restaurants/${restaurantId}/orders?startDate=${startDate}&endDate=${endDate}`,
  );

  const orders = Array.isArray(data) ? data : (data.orders ?? []);
  return orders.map((o: Record<string, unknown>) => ({
    id: String(o.id ?? ""),
    status: String(o.status ?? ""),
    total: Number(o.total ?? 0),
    itemsCount: Number(o.itemsCount ?? o.items_count ?? 0),
    customerName: String(o.customerName ?? o.customer_name ?? ""),
    orderDate: String(o.orderDate ?? o.order_date ?? ""),
  }));
}

/**
 * Fetches reviews for a restaurant.
 */
export async function getReviews(
  accessToken: string,
  restaurantId: string,
  startDate: string,
  endDate: string,
): Promise<IfoodReview[]> {
  const data = await ifoodRequest<IfoodReview[] | { reviews: IfoodReview[] }>(
    accessToken,
    `/merchant/v1.0/restaurants/${restaurantId}/reviews?startDate=${startDate}&endDate=${endDate}`,
  );

  const reviews = Array.isArray(data) ? data : (data.reviews ?? []);
  return reviews.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    orderId: String(r.orderId ?? r.order_id ?? ""),
    rating: Number(r.rating ?? 0),
    comment: String(r.comment ?? ""),
    customerName: String(r.customerName ?? r.customer_name ?? ""),
    reviewDate: String(r.reviewDate ?? r.review_date ?? ""),
  }));
}

/**
 * Fetches open tickets for a restaurant.
 */
export async function getTickets(
  accessToken: string,
  restaurantId: string,
): Promise<IfoodTicket[]> {
  const data = await ifoodRequest<IfoodTicket[] | { tickets: IfoodTicket[] }>(
    accessToken,
    `/merchant/v1.0/restaurants/${restaurantId}/tickets`,
  );

  const tickets = Array.isArray(data) ? data : (data.tickets ?? []);
  return tickets.map((t: Record<string, unknown>) => ({
    id: String(t.id ?? ""),
    orderId: String(t.orderId ?? t.order_id ?? ""),
    subject: String(t.subject ?? ""),
    status: String(t.status ?? ""),
  }));
}

/**
 * Fetches financial entries for a restaurant in a date range.
 */
export async function getFinancialEntries(
  accessToken: string,
  restaurantId: string,
  startDate: string,
  endDate: string,
): Promise<IfoodFinancialEntry[]> {
  const data = await ifoodRequest<IfoodFinancialEntry[] | { entries: IfoodFinancialEntry[] }>(
    accessToken,
    `/merchant/v1.0/restaurants/${restaurantId}/financial?startDate=${startDate}&endDate=${endDate}`,
  );

  const entries = Array.isArray(data) ? data : (data.entries ?? []);
  return entries.map((e: Record<string, unknown>) => ({
    id: String(e.id ?? ""),
    type: String(e.type ?? e.entry_type ?? "other"),
    description: String(e.description ?? ""),
    amount: Number(e.amount ?? 0),
    referenceDate: String(e.referenceDate ?? e.reference_date ?? ""),
    orderId: e.orderId ? String(e.orderId) : (e.order_id ? String(e.order_id) : undefined),
  }));
}

/**
 * Submits a response to a review via iFood API.
 */
export async function respondToReview(
  accessToken: string,
  restaurantId: string,
  reviewId: string,
  responseText: string,
): Promise<void> {
  await ifoodRequest<unknown>(
    accessToken,
    `/merchant/v1.0/restaurants/${restaurantId}/reviews/${reviewId}/response`,
    {
      method: "POST",
      body: JSON.stringify({ response: responseText }),
    },
  );
}

/**
 * Submits a message to a ticket via iFood API.
 */
export async function respondToTicket(
  accessToken: string,
  restaurantId: string,
  ticketId: string,
  messageText: string,
): Promise<void> {
  await ifoodRequest<unknown>(
    accessToken,
    `/merchant/v1.0/restaurants/${restaurantId}/tickets/${ticketId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content: messageText }),
    },
  );
}
