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
//these functions are just here for now, since there hasnt been a decsiion of how admin login will be handled
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
function getToken(): string {
  return localStorage.getItem("token") ?? "";
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

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
    headers: authHeaders(),
  });

  return handleResponse<ListCasesResponse>(res);
}

export async function getCaseById(id: string): Promise<GetCaseResponse> {
  const res = await fetch(`${getApiUrl()}/admin/cases/${id}`, {
    method: "GET",
    headers: authHeaders(),
  });

  return handleResponse<GetCaseResponse>(res);
}

export async function decideCase(
  id: string,
  body: DecisionRequest,
): Promise<DecideCaseResponse> {
  const res = await fetch(`${getApiUrl()}/admin/cases/${id}/decision`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse<DecideCaseResponse>(res);
}

export async function fileDispute(
  body: DisputeFiling,
): Promise<FileCaseResponse> {
  const res = await fetch(`${getApiUrl()}/disputes`, {
    method: "POST",
    headers: authHeaders(),
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
    headers: authHeaders(),
  });

  return handleResponse<ListAuditResponse>(res);
}

export async function getReservationSnapshot(
  reservationId: string,
): Promise<GetListingSnapshotResponse> {
  const res = await fetch(
    `${getApiUrl()}/reservations/${reservationId}/snapshot`,
    { method: "GET", headers: authHeaders() },
  );

  return handleResponse<GetListingSnapshotResponse>(res);
}

export async function publishListing(
  listingId: string,
): Promise<PublishListingResponse> {
  const res = await fetch(`${getApiUrl()}/listings/${listingId}/publish`, {
    method: "POST",
    headers: authHeaders(),
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
    headers: authHeaders(),
  });

  return handleResponse<ListUsersResponse>(res);
}

export async function getUserReputation(
  userId: string,
): Promise<UserReputation> {
  const res = await fetch(`${getApiUrl()}/admin/users/${userId}/reputation`, {
    method: "GET",
    headers: authHeaders(),
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
