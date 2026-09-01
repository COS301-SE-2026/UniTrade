import {useEffect, useState} from "react";
import { useToast } from "../../components/layout/useToast";
import { listingsService } from "../../services/listingsService";
import { getDisplayCategory, sortTheCategories } from "../../utils/categoryUtils";
import type { Category } from "../../types/listing";
import {
    getSavedSearches,
    createSavedSearch,
    deleteSavedSearch,
} from "../../services/realtime/savedSearchServices";
import type { SavedSearch, CreateSavedSearchInput } from "../../services/realtime/savedSearchServices";
import { LoadingState } from "../../components/layout/Spinner";

export default function SavedSearches() {
const [searches, setSearches] = useState<SavedSearch[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [query, setQuery] = useState("");
const [categoryId, setCategoryId] = useState<number | "">("");
const [minPrice, setMinPrice] = useState<number | "">("");
const [maxPrice, setMaxPrice] = useState<number | "">("");
const [loading, setLoading] = useState(true);
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
        showToast("success", "Search deleted");
    } catch {
        showToast("error", "Failed to delete search");
    }
};

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
                <label htmlFor="keywords" className = "block text-xs font-medium text-gray-700 mb-1">
                    Keywords
                </label>
                <input 
                value = {query}
                onChange = {(e) => setQuery(e.target.value)}
                placeholder="e.g. COS301textbook"
                className = "w-full border rounded px-3 py-2 text-sm"
                />
            </div>

            <div className = "w-40">
                <label htmlFor="category" className = "block text-xs font-medium text-gray-700 mv-1">
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
                <label htmlFor="min-price" className = "block text-xs font-medium text-gray-700 mb-1">
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
                <label htmlFor="max-price" className = "block text-xs font-medium text-gray-700 mb-1">
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
            type="button"
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
                            {!!s.categoryId && (
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
                        <button 
                        type="button"
                        onClick = {() => handleDelete(s.searchId)}
                        className = "text-red-500 text-sm hover:underline"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        )}


    </div>
);

}