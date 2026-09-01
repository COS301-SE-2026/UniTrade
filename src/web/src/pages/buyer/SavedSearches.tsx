import {useEffect, useState} from "react";
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
import {formatPrice} from "../../utils/formatters";
import {IconChevronLeft} from "@tabler/icons-react"
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
    .then(data => {
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
    if(!selectedSearch) {
        return;
    }
    let cancelled = false;
    setLoadingMatches(true);
    getMatchingListings(selectedSearch.searchId)
    .then((data) => { if (!cancelled) setMatchingListings(data); })
    .catch(() => {if (!cancelled) showToast("error", "Failed to load matching listings"); })
    .finally(() => { if (!cancelled) setLoadingMatches(false); });
    return () => {cancelled = true;};
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
setSearches([...searches, newSearch]);
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
    try{
        await deleteSavedSearch(id);
        setSearches(searches.filter(s => s.searchId !==id ));
        if(selectedSearch?.searchId === id) setSelectedSearch(null);
        showToast("success", "Search deleted");
    } catch {
        showToast("error", "Failed to delete search");
    }
};

const handleViewMatches = (search: SavedSearch) => {
    setSelectedSearch(selectedSearch?.searchId === search.searchId ? null : search);

};

const handleBack = () => setSelectedSearch(null);

if(loading ){
    return <LoadingState message = "Loading saved searches..." />
}

return (
    <div className = "space-y-4">
        <h2 className = "font-['Fraunces'] font-normal text-[32px] text-gray-800">
            Saved Searches
        </h2>
        <div className = "flex flex-wrap gap-4 items-end border p-4 rounded-lg bg0gray-50">
            <div className = "flex-1 min-w-[200px]">
                <label className = "block text-xs font-medium text-gray-700 mb-1">
                    Keywords
                </label>
                <input 
                id = "keywords"
                value = {query}
                onChange = {(e) => setQuery(e.target.value)}
                placeholder="e.g. COS301textbook"
                className = "w-full border rounded px-3 py-2 text-sm"
                />
            </div>

            <div className = "w-40">
                <label className = "block text-xs font-medium text-gray-700 mv-1">
                    Category
                </label>
                <select 
                value = {categoryId}
                onChange = {(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                className = "w-full border rounded px-3 py-2 text-sm"
                >
                    <option value = "">
                        All
                    </option>
                    {categories.map(cat => (
                        <option key = {cat.id} value = {cat.id}>
                            {getDisplayCategory(cat.name)}
                        </option>
                    ))}
                </select>
            </div>
            <div className = "w-32">
                <label className = "block text-xs font-medium text-gray-700 mb-1">
                    Min Price (R)
                </label>
                <input 
                type = "number"
                min = "0"
                step = "1"
                value = {minPrice}
                onChange = {(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                className = "w-full border rounded px-3 py-2 text-sm"
                />
            </div>
            <div className = "w-32">
                <label className = "block text-xs font-medium text-gray-700 mb-1">
                    Max Price (R)
                </label>
                <input 
                type = "number"
                min = "0"
                step = "1"
                value = {minPrice}
                onChange = {(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                className = "w-full border rounded px-3 py-2 text-sm"
                />
            </div>
            <button 
            onClick = {handleCreate}
            className = "bg-navy-700 hover:bg-navy-500 text-white px-6 py-2 rounded text-sm font-semibold transition-colors"
            >
                Save Search
            </button>
        </div>

        {searches.length === 0 ? (
            <p className = "text-sm text-gray-400">
                No saved searches yet.
            </p>
        ) : (
            <ul className = "divide-y">
                {searches.map(s => (
                    <li key = {s.searchId} className = "py-3 flex justify-between items-center">
                        <div>
                            <span className = "font-medium">
                                {s.query}
                            </span>
                            {s.categoryId && (
                                <span className = ",l-2 text-xs bg-gray-200 px-2 py-0.5 rounded ">
                                    {getDisplayCategory(
                                        categories.find(c => c.id === s.categoryId)?.name ?? ""
                                    )}
                                </span>
                            )}
                            {s.minPrice !== undefined && s.minPrice !== null && (
                                <span className = "ml-2 text-xs text-gray-500">
                                    R{s.minPrice} - {s.maxPrice !== undefined && s.maxPrice !== null ? `R${s.maxPrice}` : "no max "}
                                </span>
                            )}
                        </div>

                        <div className = "flex items-center gap-2">
                            <button 
                            type = "button"
                            onClick = {() => handleViewMatches(s)}
                            className = "text-xs text-blue-600 hover:underline"
                            >
                                {selectedSearch?.searchId === s.searchId ? "Hide matches" : "View matches"}
                            </button>
                        <button 
                        type = "button"
                        onClick = {() => handleDelete(s.searchId)}
                        className = "text-red-500 text-sm hover:underline"
                        >
                            Delete
                        </button>
                        </div>
                    </li>
                ))}
            </ul>
        )}

        {selectedSearch && (
            <div className = "mt-6 border-t pt-4">
                <div className = "flex items-center gap-4 mb-4">
                    <button
                    type = "button"
                    onClick = {handleBack}
                    className = "flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                        <IconChevronLeft size = {16} />
                        Back
                    </button>
                    <h3 className = "text-lg font-semibold text-gray-800">
                        Matches for "{selectedSearch.query}"
                    </h3>
                </div>

                {loadingMatches ? (
                    <div className = "flex justify-center py-8">
                        <LoadingState message = "Loading matches..." />
                    </div>
                ) : matchingListings.length === 0 ? (
                    <p className = "text-sm text-gray-400 py-4">
                        No listings match this search.
                    </p>
                ) : (
                    <div className = "space-y-3">
                        {matchingListings.map((listing) => (
                            <div 
                            key = {listing.id}
                            className = "flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                            >
                                <img 
                                src = {listing.imageUrl || "/placeholder.png"}
                                alt = {listing.title}
                                className = "w-16 h-16 rounded-lg object-cover flex-shrrink-0"
                                />
                                <div className = "flex-1 min-w-0">
                                    <p className = "text-sm font-semibold text-navy-700 truncate">
                                        {listing.title}
                                    </p>
                                    <div className = "flex flex-wrap items-center gap-2 mt-1">
                                        <span className = "text-xs bg-gray-200 px-2 py-0.5 rounded">
                                            {getDisplayCategory(listing.title)} {/*need to verify this, add an category name in the listing summary maybe ? */}
                                            </span>
                                            <span className = "text-sm font-bold text-navy-700">
                                                {formatPrice(listing.price)}
                                            </span>
                                        </div>
                                        </div>
                                        <button 
                                        type = "button"
                                        onClick = {() => navigate(`/buyer/listings/${listing.id}`)}
                                        className  = "bg-navy-700 hover:bg-navy-500 text-white text-sm font-semibold px-4 py-2 rounded-full-transition-colors whitespace-nowrap"
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