const ERROR_MESSAGES: Record<string, string> = {
    invalid_time: 'Times must be between 08:00 and 20:00.',
    overlapping_entry: 'You already have a busy block at that time.',
    entry_not_found: 'That block no longer exists  \u2014 it may have been deleted already.',
    reservation_not_found: 'That reservation is notavailable for scheduling.',};

    export function timetableErrorMessage(code?: string | null): string {
         if (!code) return 'Something went wrong.Please try again.';
        return ERROR_MESSAGES[code] ?? 'Something went wrong.Please try again.';
    }
