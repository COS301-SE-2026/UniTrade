import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listingsService } from "../services/listingsService";

export function useMeetupWindow(reservationId: string | undefined, enabled: boolean)
{
    const { data: meetup} = useQuery({
        queryKey: ['meetup', reservationId],
        queryFn: () => listingsService.getMeetupStatus(reservationId!),
        enabled: enabled && !!reservationId,
    });
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!meetup) return;
        const tick = () => setNow(Date.now());
        tick();
        const id = setInterval(tick, 15_000);
        return () => clearInterval(id);
    }, [meetup]);

    if (!meetup) return { meetup: undefined, isBefore: false, isOpen: false, isClosed: false};
    const opens = new Date(meetup.checkinWindowOpensAt).getTime();
    const closes = new Date(meetup.checkinWindowClosesAt).getTime();

    return {
        meetup,
        isBefore: now < opens,
        isOpen: now >= opens && now <= closes,
        isClosed: now > closes,
    };
}