import type { MeetupStatus } from "./meetup";

export interface MockMeetupProposal {
    id: string;
    location: string;
    time: string;
    status: MeetupStatus;
    isOwnMessage: boolean;
    caption: string;

}

export const MOCK_MEETUP_PROPOSALS: MockMeetupProposal[] = [
    {
        id: 'Mahadio Tlaka',
        location: 'Law Library',
        time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        isOwnMessage: false,
        caption: 'Proposed a meetup'
    },
    {
        id: 'Sabira Kaire',
        location: 'Meerensky Library-Main Entrance',
        time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'accepted',
        isOwnMessage: true,
        caption: 'Proposed a meetup'

    },
    {
        id: 'Tafadzwa Musiwa',
        location: 'IT Building ',
        time: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'declined',
        isOwnMessage: true,
        caption: 'Proposed a meetup'
    }

]