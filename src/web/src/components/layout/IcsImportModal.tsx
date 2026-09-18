import { useRef, useState } from "react";
import {
    DAY_LABEL,
    DAY_ORDER,
    type DayOfWeek,
    type ImportPattern,
    type ImportPreview,
} from "../../types/timetable";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";
import {
    commitTimetableImport,
    previewTimetableImport,
} from "../../services/timetableService";
import { timetableErrorMessage } from "../../utils/timetableErrors";
import {
    IconAlertCircle,
    IconTrash,
    IconUpload,
    IconX,
} from "@tabler/icons-react";

interface Props {
    onClose: () => void;
}

type Stage = "idle" | "uploading" | "preview" | "committing" | "done";

const skipped_reason_copy: Record<string, string> = {
    missing_times: "Missing start or end time",
    unreadable: "Couldn't read the time",
    invalid_range: "End time was before start time",
    implausible_duration: "Class length looked wrong",
    outside_window: "Outside 08:00–20:00",
    recurrence_not_supported: "Repeating event – add manually",
    slot_conflict: 'Another module already has this time',
};

export default function IcsImportModal({ onClose }: Readonly<Props>) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stage, setStage] = useState<Stage>("idle");
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [editedPatterns, setEditedPatterns] = useState<ImportPattern[]>([]);
    const [summary, setSummary] = useState<{
        imported: number;
        conflicts: number;
    } | null>(null);
    const [showSkipped, setShowSkipped] = useState(false);

    const handleFile = async (file: File) => {
        setStage("uploading");
        const result = await previewTimetableImport(file);
        if (!result.success) {
            showToast("error", timetableErrorMessage(result.error.code));
            setStage("idle");
            return;
        }
        setPreview(result.data);
        setEditedPatterns(result.data.patterns);
        setStage("preview");
    };

    const handleSave = async () => {
        setStage("committing");
        const result = await commitTimetableImport(editedPatterns);
        if (!result.success) {
            showToast("error", timetableErrorMessage(result.error.code));
            setStage("preview");
            return;
        }
        setSummary({
            imported: result.data.imported,
            conflicts: result.data.conflicts.length,
        });
        queryClient.invalidateQueries({ queryKey: ["timetable"] });
        setStage("done");
    };

    const updatePatterns = (index: number, patch: Partial<ImportPattern>) => {
        setEditedPatterns((prev) =>
            prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
        );
    };

    const removePattern = (index: number) => {
        setEditedPatterns((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Import Timetable</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        aria-label="Close"
                    >
                        <IconX size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {stage === "idle" && (
                        <>
                            <p className="text-sm text-gray-500">
                                Export your timetable from the UP Timetable Creator using the{" "}
                                {""}
                                <strong>iCal</strong> button, then upload the .ics file here.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".ics,text/calendar"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handleFile(file);
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center gap-2 text-gray-500 hover:border-navy-500 hover:text-navy-700 transition-colors"
                            >
                                <IconUpload size={28} />
                                <span className="text-sm font-semibold">Choose .ics file</span>
                            </button>
                        </>
                    )}
                    {stage === "uploading" && (
                        <div className="py-8 text-center text-sm text-gray-400">
                            Reading your timetable...
                        </div>
                    )}

                    {(stage === "preview" || stage === "committing") &&
                        preview && (
                            <>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        Found
                                        <strong className="text-navy-900">
                                            {editedPatterns.length}
                                        </strong>{" "}
                                        weekly blocks from {preview.totalEventsRead} events.
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {editedPatterns.map((p, i) => (
                                        <div
                                            key={`${p.dayOfWeek}-${p.startTime}-${p.endTime}-${i}`}
                                            className="border border-gray-200 rounded-2xl p-3 space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <select
                                                    value={p.dayOfWeek}
                                                    onChange={(e) =>
                                                        updatePatterns(i, {
                                                            dayOfWeek: Number(e.target.value) as DayOfWeek,
                                                        })
                                                    }
                                                    className="text-sm font-semibold text-navy-900 bg-transparent border border-gray-200 rounded-lg px-2 py-1"
                                                >
                                                    {DAY_ORDER.map((d) => (
                                                        <option key={d} value={d}>
                                                            {DAY_LABEL[d]}
                                                        </option>
                                                    ))}
                                                </select>
                                                {p.source && (
                                                    <span className="text-xs text-gray-500">
                                                        {p.source}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removePattern(i)}
                                                    className="text-red-500 hover:opacity-75 p-1"
                                                    aria-label="Remove"
                                                >
                                                    <IconTrash size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={p.startTime}
                                                    min="08:00"
                                                    max="20:00"
                                                    onChange={(e) =>
                                                        updatePatterns(i, { startTime: e.target.value })
                                                    }
                                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                                                />
                                                <span className="text-gray-400">-</span>
                                                <input
                                                    type="time"
                                                    value={p.endTime}
                                                    min="08:00"
                                                    max="20:00"
                                                    onChange={(e) =>
                                                        updatePatterns(i, { endTime: e.target.value })
                                                    }
                                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                                                />
                                            </div>
                                            {p.clamped && (
                                                <p className="text-[11px] text-amber-600 flex items-center gap-1">
                                                    <IconAlertCircle size={12} />
                                                    Adjusted to fit within 08:00–20:00
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {preview.skipped.length > 0 && (
                                    <div className="border-t border-gray-100 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowSkipped((s) => !s)}
                                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                                        >
                                            {preview.skipped.length} block
                                            {preview.skipped.length === 1 ? "" : "s"} skipped — {" "}
                                            {showSkipped ? "hide" : "show"}
                                        </button>
                                        {showSkipped && (
                                            <ul className="mt-2 space-y-1 text-xs text-gray-500">
                                                {preview.skipped.map((s, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span>{s.source ?? "Unnamed event"}</span>
                                                        <span className="text-gray-400">
                                                            {skipped_reason_copy[s.reason] ?? s.reason}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                    {stage === "done" && summary && (
                        <div className="py-4 text-center space-y-2">
                            <p className="text-sm font-semibold text-navy-900">
                                {summary.imported} block{summary.imported === 1 ? "" : "s"}{" "}
                                imported.
                            </p>
                            {summary.conflicts > 0 && (
                                <p className="text-xs text-amber-600">
                                    {summary.conflicts} couldn't be saved because they overlapped
                                    existing blocks.
                                </p>
                            )}
                        </div>
                    )}
                </div>
                {(stage === "preview" || stage === "committing") && (
                    <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={stage === "committing"}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={stage === "committing" || editedPatterns.length === 0}
                            className="flex-1 py-2.5 bg-navy-700 text-white rounded-xl text-sm font-semibold hover:bg-navy-500 disabled:opacity-50"
                        >
                            {stage === "committing"
                                ? "Saving…"
                                : `Save ${editedPatterns.length} blocks`}
                        </button>
                    </div>
                )}
                {stage === "done" && (
                    <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2.5 bg-navy-700 text-white rounded-xl text-sm font-semibold hover:bg-navy-500"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
