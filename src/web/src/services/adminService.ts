import { getApiUrl } from "../config";

import type {
  ListCasesParams,
  PublishListingResponse,
  DecisionRequest,
  ApiError,
  ListCasesResponse,
  GetCaseResponse,
  DecideCaseResponse,
  DisputeFiling,
  FileCaseResponse,
  ListAuditParams,
  ListAuditResponse,
  GetListingSnapshotResponse,
  PublishListingError,
  ListUserParams,
  ListUsersResponse,
  UserReputation,
  CaseType,
  UserListing,
  CaseSummary,
} from "../types/admin_disputes";

export type ButtonAction =
  | "approve"
  | "reject"
  | "resubmit"
  | "uphold"
  | "dismiss"
  | "more-info"
  | "side-buyer"
  | "side-seller"
  | "remove-listing"
  | "warn-seller";

function normaliseCases(response: unknown): CaseSummary[] {
  if (Array.isArray(response)) {
    return response as CaseSummary[];
  }
  if (response && typeof response === "object" && "cases" in response) {
    const obj = response as { cases?: CaseSummary[] };
    return obj.cases ?? [];
  }
  return [];
}

function toDecisionRequest(
  type: CaseType,
  action: ButtonAction,
  reason?: string,
): DecisionRequest {
  const r = reason?.trim() || undefined;

  switch (type) {
    case "verification":
      return {
        decision: action as "approve" | "reject" | "resubmit",
        reason: r,
      };
    case "no_show":
      if (action === "uphold")
        return { decision: "uphold", outcomes: ["strike"], reason: r };
      if (action === "dismiss") return { decision: "dismiss", reason: r };
      if (action === "more-info")
        return { decision: "request_info", reason: r };
      break;
    case "listing_quality":
      // the backend evaluator computes action from the snapshot vs photos evidence,, so no need to send outcomes
      if (action === "side-buyer") return { decision: "uphold", reason: r };
      if (action === "side-seller") return { decision: "dismiss", reason: r };
      if (action === "dismiss") return { decision: "dismiss", reason: r };
      if (action === "more-info")
        return { decision: "request_info", reason: r };
      break;

    case "report_listing":
      if (action === "remove-listing")
        return { decision: "uphold", outcomes: ["remove_listing"], reason: r };
      if (action === "warn-seller")
        return { decision: "uphold", outcomes: ["strike"], reason: r };
      if (action === "dismiss") return { decision: "dismiss", reason: r };
      break;
  }
  throw new Error(`Invalid action "${action}" for case type 
    "${type}"`);
}
/*function getToken(): string {
  return localStorage.getItem("token") ?? "";
}

/*function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}*/

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  }

  let errorBody: Partial<ApiError> = {};
  try {
    errorBody = await res.json();
  } catch {
    //nothing
  }

  const error: ApiError = {
    status: res.status,
    code: errorBody.code ?? "UNKNOWN_ERROR",
    message: errorBody.message ?? res.statusText,
  };

  throw error;
}

export async function getCases(
  params: ListCasesParams = {},
): Promise<ListCasesResponse> {
  const query = new URLSearchParams();

  if (params.type) query.set("type", params.type);
  if (params.status) query.set("status", params.status);
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${getApiUrl()}/admin/cases?${query.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse<ListCasesResponse>(res);
}

export async function getCaseById(id: string): Promise<GetCaseResponse> {
  const res = await fetch(`${getApiUrl()}/admin/cases/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse<GetCaseResponse>(res);
}

export async function decideCase(
  id: string,
  body: DecisionRequest,
): Promise<DecideCaseResponse> {
  const res = await fetch(`${getApiUrl()}/admin/cases/${id}/decision`, {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });

  return handleResponse<DecideCaseResponse>(res);
}

export async function fileDispute(
  body: DisputeFiling,
): Promise<FileCaseResponse> {
  const res = await fetch(`${getApiUrl()}/disputes`, {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });

  return handleResponse<FileCaseResponse>(res);
}

export async function getAuditEntries(
  params: ListAuditParams = {},
): Promise<ListAuditResponse> {
  const query = new URLSearchParams();
  if (params.entityId) query.set("entityId", params.entityId);
  if (params.actorId) query.set("actorId", params.actorId);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${getApiUrl()}/admin/audit?${query.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse<ListAuditResponse>(res);
}

export async function getReservationSnapshot(
  reservationId: string,
): Promise<GetListingSnapshotResponse> {
  const res = await fetch(
    `${getApiUrl()}/reservations/${reservationId}/snapshot`,
    { method: "GET", credentials: "include" },
  );

  return handleResponse<GetListingSnapshotResponse>(res);
}

export async function publishListing(
  listingId: string,
): Promise<PublishListingResponse> {
  const res = await fetch(`${getApiUrl()}/listings/${listingId}/publish`, {
    method: "POST",
    credentials: "include",
  });

  if (res.status === 403) {
    const body: PublishListingError = await res.json();
    const error: ApiError = {
      status: 403,
      code: body.error,
      message: "Seller must be verified before publishing a listing.",
    };
    throw error;
  }

  return handleResponse<PublishListingResponse>(res);
}

export async function getUsers(
  params: ListUserParams = {},
): Promise<ListUsersResponse> {
  const query = new URLSearchParams();
  if (params.verificationStatus)
    query.set("verificationStatus", params.verificationStatus);
  if (params.hasStrikes !== undefined)
    query.set("hasStrikes", String(params.hasStrikes));
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${getApiUrl()}/admin/users?${query.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse<ListUsersResponse>(res);
}

export async function getUserReputation(
  userId: string,
): Promise<UserReputation> {
  const res = await fetch(`${getApiUrl()}/admin/users/${userId}/reputation`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse<UserReputation>(res);
}

export async function decideCaseWithAction(
  caseId: string,
  type: CaseType,
  action: ButtonAction,
  reason?: string,
): Promise<DecideCaseResponse> {
  const body = toDecisionRequest(type, action, reason);
  return decideCase(caseId, body);
}

export async function getUserListings(
  userId: string,
  limit: number = 5,
): Promise<UserListing[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(
    `${getApiUrl()}/admin/users/${userId}/listings?${query}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  return handleResponse<UserListing[]>(res);
}

export async function getTopVerifications(limit = 5): Promise<CaseSummary[]> {
  const response = await getCases({ type: "verification", status: "pending" });
  const cases = normaliseCases(response);
  return cases.slice(0, limit);
}

export async function getTopDisputes(limit = 5): Promise<CaseSummary[]> {
  const response = await getCases({ type: undefined, status: "pending" });
  const cases = normaliseCases(response);

  const disputeTypes = new Set<CaseType>([
    "no_show",
    "listing_quality",
    "report_listing",
  ]);
  const disputes = cases.filter((c) => disputeTypes.has(c.type));
  return disputes.slice(0, limit);
}

export async function getTotalUsers(): Promise<number> {
  const res = await getUsers({ limit: 1, page: 1 });
  return res.total;
}
