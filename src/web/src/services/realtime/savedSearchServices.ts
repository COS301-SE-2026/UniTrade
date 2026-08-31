import { getApiUrl } from "../../config";

export interface SavedSearch {
    searchId: string;
    query: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    courseId?: string;
    isActive: boolean;
}

export interface CreateSavedSearchInput {
    query: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;

}

export async function getSavedSearches(): Promise<SavedSearch[]>{
    const res = await fetch(`${getApiUrl()}/saved-searches`, {
        credentials: "include",
    });
    if(~res.ok) throw new Error("Failed to fetch saved searches");
    return res.json();
}