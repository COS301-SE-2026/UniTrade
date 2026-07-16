export type MeetupStatus = 'pending' | 'accepted' | 'declined';

export type CheckInState = 'requesting' | 'success' | 'denied' | 'unsupported' | 'error';

export interface MeetupProposalPayload {
    proposedLocation: string;
    proposedTime: string;
    status: MeetupStatus;
    proposedByUserId?: string;
}

export interface MeetupFormValues {
    date: string;
    time:string;
    location: string;
}

export function combineDateAndTime(date: string, time: string): string{
    return new Date(`${date}T${time}`).toISOString();
}

export const PRESET_MEETUP_LOCATIONS: readonly string[] = [
    'Meerensky Library - Main Entrance',
    'Lucky Bread - Piazza',
    'Law Library - Thuto Entrance',
    'IT Building',

] as const;