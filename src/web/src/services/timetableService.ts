import { getApiUrl } from "../config";
import type {
  TimetableEntry,
  NewTimetableEntry,
  AvailabilityResponse,
  ImportPreview,
  ImportPattern,
  ImportCommitResult,
} from "../types/timetable";

type ServiceError = { message?: string; code?: string };
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

const TIMETABLE_BASE = `${getApiUrl()}/timetable`;
const AVAILABILITY_URL = `${getApiUrl()}/meetups/availability`;

async function parseJsonSafe(res: Response): Promise<{ error?: string }> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getMyTimetable(): Promise<Result<TimetableEntry[]>> {
  try {
    const res = await fetch(TIMETABLE_BASE, { credentials: "include" });
    if (!res.ok) {
      const body = await parseJsonSafe(res);
      return {
        success: false,
        error: { message: body.error, code: body.error },
      };
    }
    return { success: true, data: (await res.json()) as TimetableEntry[] };
  } catch {
    return {
      success: false,
      error: { message: "Network error loading timetable" },
    };
  }
}

export async function addTimetableEntry(
  entry: NewTimetableEntry,
): Promise<Result<TimetableEntry>> {
  try {
    const res = await fetch(TIMETABLE_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(entry),
    });
    const body = await parseJsonSafe(res);
    if (!res.ok) {
      return {
        success: false,
        error: { message: body.error, code: body.error },
      };
    }
    return { success: true, data: body as unknown as TimetableEntry };
  } catch {
    return { success: false, error: { message: "Network error adding entry" } };
  }
}

export async function deleteTimetableEntry(
  entryId: string,
): Promise<Result<void>> {
  try {
    const res = await fetch(`${TIMETABLE_BASE}/${entryId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok && res.status !== 404) {
      const body = await parseJsonSafe(res);
      return {
        success: false,
        error: { message: body.error, code: body.error },
      };
    }
    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: { message: "Network error deleting entry" },
    };
  }
}

export async function getMutualAvailability(
  reservationId: string,
): Promise<Result<AvailabilityResponse>> {
  try {
    const res = await fetch(
      `${AVAILABILITY_URL}?reservationId=${encodeURIComponent(reservationId)}`,
      {
        credentials: "include",
      },
    );
    const body = await parseJsonSafe(res);
    if (!res.ok) {
      return {
        success: false,
        error: { message: body.error, code: body.error },
      };
    }
    return { success: true, data: body as unknown as AvailabilityResponse };
  } catch {
    return {
      success: false,
      error: { message: "Network error loading availability" },
    };
  }
}

export async function previewTimetableImport(
  file: File,
): Promise<Result<ImportPreview>> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${TIMETABLE_BASE}/import/preview`, {
      method: "POST",
      credentials: "include",
      body: form,
    });

    const body = await parseJsonSafe(res);
    if (!res.ok) {
      return {
        success: false,
        error: { message: body.error, code: body.error },
      };
    }
    return { success: true, data: body as unknown as ImportPreview };
  } catch {
    return {
      success: false,
      error: { message: "Network error reading timetable" },
    };
  }
}

export async function commitTimetableImport(
  patterns: ImportPattern[],
): Promise<Result<ImportCommitResult>> {
  try {
    const res = await fetch(`${TIMETABLE_BASE}/import/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patterns),
    });

    const body = await parseJsonSafe(res);
    if (!res.ok) {
      return {
        success: false,
        error: { message: body.error, code: body.error },
      };
    }
    return { success: true, data: body as unknown as ImportCommitResult };
  } catch {
    return {
      success: false,
      error: { message: "Network error saving timetable" },
    };
  }
}
