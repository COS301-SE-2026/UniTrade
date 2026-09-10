import { useSearchParams } from "react-router";

export function useSearchQuery(): string {
    const [searchParams] = useSearchParams()
    return (searchParams.get('q') || '').trim().toLowerCase()
}