import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuestions, askQuestion, answerQuestion} from "../services/listingQuestionsService";
import { connectionManager } from "../services/realtime/connectionManager";
import { useToast } from "./layout/useToast";

interface Props {
    listingId: string;
    isSeller: boolean;
    canAsk: boolean;
}

export default function ListingQnA({ listingId, isSeller, canAsk }: Props) {
    const { showToast } = useToast();
    const [draft, setDraft] = useState("");
    const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

    const { data: questions = [], refetch } = useQuery({
        queryKey: ["listing-questions", listingId],
        queryFn: () => getQuestions(listingId),
    });

    useEffect(() => {
        connectionManager.connect().catch((e) => console.error("connect failed", e));
        const offAsked = connectionManager.onListingQuestionAsked((e) => {
            if (e.listingId === listingId) refetch();
        });
        const offAnswered = connectionManager.onListingQuestionAnswered((e) => {
            if (e.listingId === listingId) refetch();
        });

        return () => { offAsked(); offAnswered(); };

    }, [listingId, refetch]);

    const submitQuestion = async () => {
        if (!draft.trim()) return;
        try { await askQuestion(listingId, draft.trim()); setDraft("");
        refetch(); showToast("success", "Question posted");
        } catch {showToast("error", "Could not post question"); }
    };

    const submitAnswer = async (questionId: string) => {
        const text = answerDrafts[questionId]?.trim();
        if (!text) return;
        try { await answerQuestion(questionId, text); refetch(); showToast(
            "success", "Answer posted"); }
        catch {showToast("error", "Could not post answer"); }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Questions &amp; Answers ({questions.length})
            </h2>

            {canAsk && (
                <div className="flex gap-2">
                    <input 
                       value={draft}
                       onChange={(e) => setDraft(e.target.value)}
                       placeholder="Ask the seller a question...."
                       className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm"
                       />
                    <button type="button" onClick={submitQuestion}
                    className="bg-navy-700 text-white px-5 py-2 rounded-xl text-sm font-semibold">
                        Ask
                    </button>
                    </div>
            )}
        {questions.length === 0 ? (
            <p className="text-sm text-slate-400">No questions yet.</p>
        ) : (
            <ul className="space-y-4">
                {questions.map((q) => (
                    <li key={q.questionId} className="border-b border-slate-100 pb-3 last:border-0">
                        <div className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {q.askerInitials}
                            </span>
                            <p className="text-sm text-slate-800"><span className="font-semibold">Q:</span>{q.questionText}</p>
                        </div>

                        {q.answerText? (
                            <p className="text-sm text-slate-600 ml-8 mt-1"><span className="font-semibold">A:</span> {q.answerText}</p>
                        ) : isSeller ? (
                            <div className="flex gap-2 ml-8 mt-2">
                                <input
                                value={answerDrafts[q.questionId] ?? ""}
                                onChange={(e) => setAnswerDrafts((s) => ({...s, [q.questionId]: e.target.value}))}
                                placeholder="Answer this question..."
                                className="flex-1 border border-slate-300  rounded-xl px-3 py-2 text-sm"
                                />
                                <button type="button" onClick={() => submitAnswer(q.questionId)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                                    Answer
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 ml-8 mt-1 italic">Awaiting seller response</p>
                        )}
                    </li>
                ))}
            </ul>
        )}
        </div>
    )
}
