import { getApiUrl } from "../../config";

export interface SavedSearch {
    searchId: string;
    query: string;
    categoryId?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    courseId?: string | null;
    isActive: boolean;
}

export interface CreateSavedSearchInput {
    query: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    courseId?: string;

}

//triggerpipe
export async function getSavedSearches(): Promise<SavedSearch[]>{
    const res = await fetch(`${getApiUrl()}/saved-searches`, {
        method: "GET",
        credentials: "include",
    });
    if(!res.ok) throw new Error("Failed to fetch saved searches");
    return res.json();
}

export async function createSavedSearch(
    search: CreateSavedSearchInput
): Promise<SavedSearch> {
    const res = await fetch(`${getApiUrl()}/saved-searches`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(search),
    });
    if(!res.ok) throw new Error("Failed to create saved search");
    return res.json();
}

export async function deleteSavedSearch(searchId: string): Promise<void> {
    const res = await fetch(`${getApiUrl()}/saved-searches/${searchId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete saved search");
}