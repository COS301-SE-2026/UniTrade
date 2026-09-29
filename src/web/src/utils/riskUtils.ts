const LOW_MATCH_THRESHOLD = 0.5;

export function isLowImageMatch(score: number | null): boolean {
    return score !== null && score < LOW_MATCH_THRESHOLD;
}