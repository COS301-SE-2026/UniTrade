import { getApiUrl } from "../config";

import type {
  Review,
  UserReviewsResponse,
  SubmitReviewPayload,
} from "../types/listing";

import type { Result } from "../types/Reservations";

async function handleResponse<T>(res: Response): Promise<Result<T>> {
  if (res.ok) {
    const data = (await res.json()) as T;
    return { success: true, data };
  }

  let message: string | undefined;
  let code = "unknown_error";
  try {
    const body = await res.json();
    code = body.error ?? body.code ?? code;
    message = body.message;
  } catch {}

  return { success: false, error: { code, message, status: res.status } };
}

export async function createReview(
  payload: SubmitReviewPayload,
): Promise<Result<Review>> {
  const res = await fetch(`${getApiUrl()}/reviews`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Review>(res);
}

export async function getUserReviews(
  userId: string,
): Promise<Result<UserReviewsResponse>> {
  const res = await fetch(`${getApiUrl()}/reviews/users/${userId}`, {
    credentials: "include",
  });

  return handleResponse<UserReviewsResponse>(res);
}
