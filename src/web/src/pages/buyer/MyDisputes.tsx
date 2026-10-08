import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { useNavigate, useSearchParams } from "react-router";
import chemImg from "../../assets/bio-textbook.jpg";
import calcImg from "../../assets/calculas-textbook.jpg";
import laptopImg from "../../assets/hp-laptop.jpg";
import { type CaseType, type ViewerRole } from "../../types/admin_disputes";
import { getMyCases } from "../../services/adminService";
import { LoadingState } from "../../components/layout/Spinner";
import { imageUrl } from "../../services/listingsService";
export interface MyDisputeRow {
  id: string;
  title: string;
  buyerInitials: string;
  sellerInitials: string;
  timeAgo: string;
  type: "No-show" | "Listing-quality" | "Report";
  status: string;
  image: string;
  viewerRole: ViewerRole;
}
function getTimeAgo(ageHours: number): string {
  if (ageHours < 1) return "Just now";
  if (ageHours < 24) return `${Math.round(ageHours)}h ago`;
  const days = Math.round(ageHours / 24);
  return `${days}d ago`;
}
type DisputeCaseType = "no_show" | "listing_quality" | "report_listing";
function getDisplayType(
  caseType: DisputeCaseType,
): "No-show" | "Listing-quality" | "Report" {
  const map: Record<DisputeCaseType, "No-show" | "Listing-quality" | "Report"> =
    {
      no_show: "No-show",
      listing_quality: "Listing-quality",
      report_listing: "Report",
    };
  return map[caseType];
}
function getPlaceholder(type: CaseType): string {
  const map: Record<CaseType, string> = {
    verification: chemImg,
    no_show: chemImg,
    listing_quality: calcImg,
    report_listing: laptopImg,
  };
  return map[type] ?? chemImg;
}
export default function MyDisputes() {
  const [filter, setFilter] = useState<
    "all" | "No-show" | "Listing-quality" | "Report"
  >("all");
  const [roleFilter, setRoleFilter] = useState<"all" | ViewerRole>("all");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.myDisputes(),
    queryFn: async () => {
      const response = await getMyCases();

      return response.cases.map((summary) => ({
        id: summary.caseId,
        title: summary.title ?? "Unknown listing",
        buyerInitials: summary.counterpartyInitials ?? "??",
        sellerInitials: summary.subjectInitials ?? "??",
        timeAgo: getTimeAgo(summary.ageHours),
        type: getDisplayType(summary.type as DisputeCaseType),
        status: summary.status,
        image: summary.imageUrl
          ? imageUrl(summary.imageUrl)
          : getPlaceholder(summary.type as CaseType),
        viewerRole: summary.viewerRole,
      })) as MyDisputeRow[];
    },
  });

  const filteredRows = rows.filter((row) => {
    if (!row.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    if (filter !== "all" && row.type !== filter) return false;
    if (roleFilter !== "all" && row.viewerRole !== roleFilter) return false;
    return true;
  });
  const totalDisputes = rows.length;
  const filedByYou = rows.filter((r) => r.viewerRole === "filed_by_me").length;
  const againstYou = rows.filter((r) => r.viewerRole === "against_me").length;
  const resolved = rows.filter(
    (r) => r.status === "resolved" || r.status === "dismissed",
  ).length;
  if (isLoading) {
    return <LoadingState message="Loading your disputes..." />;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {(error as Error).message || "Failed to load disputes."}
      </p>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
          My Disputes
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Disputes you've filed and disputes filed against you.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold text-navy-700 dark:text-white">
            {totalDisputes}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">Total Disputes</div>
        </div>
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div>
            <div className="text-2xl font-bold text-navy-700 dark:text-white">
              {filedByYou}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">Filed by You</div>
          </div>
        </div>
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold text-navy-700 dark:text-white">
            {againstYou}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">Against You</div>
        </div>
        <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="text-2xl font-bold text-navy-700 dark:text-white">
            {resolved}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">Resolved</div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-gray-300 bg-white p-0.5 text-xs font-semibold">
            {(
              [
                { key: "all", label: "All" },
                { key: "filed_by_me", label: "Filed by you" },
                { key: "against_me", label: "Against you" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRoleFilter(opt.key)}
                className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer
    ${
      roleFilter === opt.key
        ? "bg-navy-700 text-white"
        : "text-gray-600 hover:bg-gray-50"
    }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {(["all", "No-show", "Listing-quality", "Report"] as const).map(
            (opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors
${
  filter === opt
    ? "bg-navy-700 text-white"
    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
}`}
              >
                {opt === "all"
                  ? "All"
                  : opt === "No-show"
                    ? "No-show"
                    : opt === "Listing-quality"
                      ? "Quality"
                      : "Report"}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-gray-600 font-normal">
              <th className="py-3 px-4">Listing</th>
              <th className="py-3 px-4 text-center">Dispute type</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right pr-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-600">
                  No disputes match your criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((dispute) => (
                <tr
                  key={dispute.id}
                  className={`hover:bg-gray-50/50 transition-colors border-l-4 ${dispute.viewerRole === "filed_by_me" ? "border-l-navy-700" : "border-l-gray-300"}`}
                >
                  <td className="py-4 px-4 flex items-center space-x-3">
                    <img
                      src={dispute.image}
                      alt={dispute.title}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-gray-900">
                        {dispute.title}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {dispute.viewerRole === "filed_by_me"
                          ? "Filed by you"
                          : "Filed against you"}{" "}
                        &bull; {dispute.timeAgo}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${
                        dispute.type === "No-show"
                          ? "bg-rose-200 text-rose-800"
                          : dispute.type === "Listing-quality"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {dispute.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 capitalize">
                      {dispute.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/buyer/disputes/${dispute.id}`)}
                      className="bg-navy-700 text-white px-5 py-1.5 rounded-full font-semibold hover:bg-navy-500 transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
