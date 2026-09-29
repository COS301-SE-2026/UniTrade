const ACCOUNT_STATE_MESSAGES: Record<string, string> = {
    seller_suspended:
        "You're temporarily suspended from selling, so you can't post or publish listings right now. You can still browse and buy — your existing listings return automatically when the suspension lifts.",
    buyer_suspended:
        "You're temporarily suspended from buying, so you can't reserve items right now. You can still sell.",
    account_blocked:
        "Your account has been permanently banned.",
};

export function getAccountStateErrorMessage(
    code: string,
    fallback: string,

): string {
    return ACCOUNT_STATE_MESSAGES[code] ?? fallback;
}