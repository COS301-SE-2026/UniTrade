export function timetableErrorMessage(
  code?: string,
  fallback?: string,
): string {
  switch (code) {
    case "invalid_time_range":
      return "Times must be between 08:00 and 20:00, and end after start.";
    case "overlapping_entry":
      return "You already have a busy block at that time.";

    case "entry_not_found":
      return "That block no longer exists - it may have been deleted already.";
    case "reservation_not_found":
      return "This reservation isn't available for scheduling.";
    default:
      return fallback ?? "Something went wrong. Please try again.";
  }
}
