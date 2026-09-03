import { getApiUrl } from "../config";

export interface ListingQuestion {
    questionId: string;
    listingId: string;
    questionText: string;
    answerText?: string | null;
    askedAt: string;
    answeredAt?: string;
    askerInitials: string;
    isAnswered: boolean;
}

export async function getQuestions(listingId: string): Promise<ListingQuestion[]>{
    const res = await fetch(`${getApiUrl()}/listings/${listingId}/questions`, { credentials: "include"});
    if (!res.ok) throw new Error("Failed to load questions");
    return res.json();
}

export async function askQuestion(listingId: string, questionText: string): Promise<ListingQuestion>{
    const res = await fetch(`${getApiUrl()}/listings/${listingId}/questions`, {
        method: "POST", credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ questionText }),
    });
    if(!res.ok) throw new Error("Failed to post question");
    return res.json();
}

export async function answerQuestion(questionId: string, answerText: string): Promise<ListingQuestion> {
    const res = await fetch(`${getApiUrl()}/listings/questions/${questionId}/answer`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ answerText }),
    });
    if (!res.ok) throw new Error("Failed to post answer");
    return res.json();
}