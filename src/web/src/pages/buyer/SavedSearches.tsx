import { useEffect, useState } from "react";
import { useToast } from "../../components/layout/useToast";
import { listingsService } from "../../services/listingsService";
import { getDisplayCategory, sortTheCategories } from "../../utils/categoryUtils";
import type { Category, ListingSummary } from "../../types/listing";
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  getMatchingListings,
} from "../../services/realtime/savedSearchServices";
import type { SavedSearch, CreateSavedSearchInput } from "../../services/realtime/savedSearchServices";
import { LoadingState } from "../../components/layout/Spinner";
import { formatPrice } from "../../utils/formatters";
import { IconChevronLeft, IconTrash, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useNavigate } from "react-router";

export default function SavedSearches() {
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearch | null>(null);
  const [matchingListings, setMatchingListings] = useState<ListingSummary[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    listingsService
      .getListingsCategories()
      .then((data) => {
        setCategories(sortTheCategories(data));
      })
      .catch(() => showToast("error", "Failed to load the categories"));
  }, [showToast]);

  useEffect(() => {
    getSavedSearches()
      .then(setSearches)
      .catch(() => showToast("error", "Failed to load saved searches"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    if (!selectedSearch) return;

    let cancelled = false;
    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const data = await getMatchingListings(selectedSearch.searchId);
        if (!cancelled) setMatchingListings(data);
      } catch {
        if (!cancelled) showToast("error", "Failed to load matching listings");
      } finally {
        if (!cancelled) setLoadingMatches(false);
      }
    };

    fetchMatches();

    return () => {
      cancelled = true;
    };
  }, [selectedSearch, showToast]);

  const handleCreate = async () => {
    if (!query.trim()) {
      showToast("info", "Please enter a search query.");
      return;
    }
    const payload: CreateSavedSearchInput = {
      query: query.trim(),
      categoryId: categoryId || undefined,
      minPrice: minPrice !== "" ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
    };
    try {
      const newSearch = await createSavedSearch(payload);
      setSearches((prev) => [...prev, newSearch]);
      setQuery("");
      setCategoryId("");
      setMinPrice("");
      setMaxPrice("");
      showToast("success", "Search saved!");
    } catch {
      showToast("error", "Failed to save search");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedSearch(id);
      setSearches((prev) => prev.filter((s) => s.searchId !== id));
      if (selectedSearch?.searchId === id) {
        setSelectedSearch(null);
        setMatchingListings([]);
      }
      showToast("success", "Search deleted");
    } catch {
      showToast("error", "Failed to delete search");
    }
  };

  const handleViewMatches = (search: SavedSearch) => {
    if (selectedSearch?.searchId === search.searchId) {
      setSelectedSearch(null);
      setMatchingListings([]);
    } else {
      setSelectedSearch(search);
    }
  };

  const handleBack = () => {
    setSelectedSearch(null);
    setMatchingListings([]);
  };

  if (loading) {
    return <LoadingState message="Loading saved searches..." />;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-['Fraunces'] font-normal text-[32px] text-gray-800">
        Saved Searches
      </h2>
      <div className="flex flex-wrap gap-3 items-end  p-4 rounded-2xl">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="keywords" className="block text-xs font-medium text-gray-700 mb-1">
            Keywords
          </label>
          <input
            id="keywords"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. COS301 textbook"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        <div className="w-40">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getDisplayCategory(cat.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="w-32">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Price (R)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        <div className="w-32">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Max Price (R)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        <button
          onClick={handleCreate}
          className="bg-navy-700 hover:bg-navy-500 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          Save Search
        </button>
      </div>

      {searches.length === 0 ? (
        <p className="text-sm text-gray-400 p-4">No saved searches yet.</p>
      ) : (
        <div className="space-y-2">
          {searches.map((s) => {
            const isSelected = selectedSearch?.searchId === s.searchId;
            return (
              <div
                key={s.searchId}
                className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-full border transition-all ${
                  isSelected
                    ? "bg-navy-50/60 border-navy-300 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 pl-3 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{s.query}</span>

                  {s.categoryId && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
                      {getDisplayCategory(
                        categories.find((c) => c.id === s.categoryId)?.name ?? ""
                      )}
                    </span>
                  )}

                  {(s.minPrice !== undefined && s.minPrice !== null) ||
                  (s.maxPrice !== undefined && s.maxPrice !== null) ? (
                    <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      R{s.minPrice ?? 0} - {s.maxPrice ? `R${s.maxPrice}` : "No Max"}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 pr-1">
                  <button
                    type="button"
                    onClick={() => handleViewMatches(s)}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-navy-700 text-white shadow-sm"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <IconEyeOff size={14} />
                        Hide Matches
                      </>
                    ) : (
                      <>
                        <IconEye size={14} />
                        View Matches
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(s.searchId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <IconTrash size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSearch && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <IconChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              Matches for "{selectedSearch.query}"
            </h3>
          </div>

          {loadingMatches ? (
            <div className="flex justify-center py-8">
              <LoadingState message="Loading matches..." />
            </div>
          ) : matchingListings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No listings match this search.</p>
          ) : (
            <div className="space-y-3">
              {matchingListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={listing.imageUrl || "/placeholder.png"}
                    alt={listing.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-700 truncate">
                      {listing.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                        {getDisplayCategory(listing.categoryName)}
                      </span>
                      <span className="text-sm font-bold text-navy-700">
                        {formatPrice(listing.price)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/buyer/listings/${listing.id}`)}
                    className="bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors whitespace-nowrap shadow-sm"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}