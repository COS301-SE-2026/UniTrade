import React, {useEffect, useState} from "react";
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
        <h2 className = "text-lg font-bold">
            Saved Searches
        </h2>
        <div className = "flex flex-wrap gap-4 items-end border p-4 rounded-lg bg0gray-50">
            <div className = "flex-1 min-w-[200px]">
                <label className = "block text-xs font-medium text-gray-700 mb-1">
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
        </div>
    </div>
)

}