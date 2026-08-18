import { getApiUrl } from "../config";

import type {
     ListCasesParams,
    /*ListCasesResponse,
    GetCaseResponse,
    DecideCaseResponse,
    
    DisputeFiling,
    FileCaseResponse,
    ListAuditParams,
    ListAuditResponse,
    GetListingSnapshotResponse,
    PublishListingResponse,
    PublishListingError,
    UserReputation,
    ListUsersResponse,*/
     DecisionRequest,
     ApiError,
     ListCasesResponse,
     GetCaseResponse,
     DecideCaseResponse,
     DisputeFiling,
     FileCaseResponse,
     ListAuditParams,
    ListAuditResponse,
} from '../types/admin_disputes'

//these functions are just here for now, since there hasnt been a decsiion of how admin login will be handled

function getToken(): string {
    return localStorage.getItem('token') ?? '';
}

function authHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
        if (res.status === 204) return {} as T;
        return res.json() as Promise<T>
    }

    let errorBody: Partial<ApiError> = {};
    try {
        errorBody = await res.json();
    } catch {
        //nothing
    }

    const error: ApiError = {
        status: res.status,
        code: errorBody.code ?? 'UNKNOWN_ERROR',
        message: errorBody.message ?? res.statusText,
    };

    throw error;
}

export async function getCases(
    params: ListCasesParams = {}

): Promise<ListCasesResponse> {
    const query = new URLSearchParams();

    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(
        `${getApiUrl()}/admin/cases?${query.toString()}`,
        { method: 'GET', headers: authHeaders()}
    );

    return handleResponse<ListCasesResponse>(res)
}

export async function getCaseById(id: string): Promise<GetCaseResponse> {
    const res = await fetch(
        `${getApiUrl()}/admin/cases/${id}`,
        { method: 'GET', headers: authHeaders()}
    )

    return handleResponse<GetCaseResponse>(res);
}

export async function decideCase(
    id: string,
    body: DecisionRequest
): Promise<DecideCaseResponse> {
    const res = await fetch(
        `${getApiUrl()}/admin/cases/${id}/decision`,
        {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body),
        }
    );

    return handleResponse<DecideCaseResponse>(res);
}

export async function fileDispute(
    body: DisputeFiling
): Promise<FileCaseResponse> {
    const res = await fetch(
        `${getApiUrl()}/disputes`,
        {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body)
        }
    );

    return handleResponse<FileCaseResponse>(res);
}

export async function getAuditEntries(
    params: ListAuditParams = {}
): Promise<ListAuditResponse> {
    const query = new URLSearchParams();
    if (params.entityId) query.set('entityId', params.entityId);
    if (params.actorId)  query.set('actorId', params.actorId);
    if(params.page)      query.set('page', String(params.page));
    if(params.limit)     query.set('limit', String(params.limit));

    const res = await fetch(
        `${getApiUrl()}/admin/audit?${query.toString()}`,
        {method: 'GET', headers: authHeaders()}
    );

    return handleResponse<ListAuditResponse>(res);
}