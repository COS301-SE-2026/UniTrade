import { getApiUrl } from "../../config";
import type { ListingSummary } from "../../types/listing";
import { imageUrl } from "../listingsService";

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

interface BListingSummary {
  listingId: string;
  title: string;
  categoryName: string;
  createdAt: string;
  price: number;
  listingStatus: string;
  viewCount: number;
  images?: Array<{ path: string; isPrimary?: boolean }>;
}
export async function getSavedSearches(): Promise<SavedSearch[]> {
  const res = await fetch(`${getApiUrl()}/saved-searches`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch saved searches");
  return res.json();
}

export async function createSavedSearch(
  search: CreateSavedSearchInput,
): Promise<SavedSearch> {
  const res = await fetch(`${getApiUrl()}/saved-searches`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(search),
  });
  if (!res.ok) throw new Error("Failed to create saved search");
  return res.json();
}

export async function deleteSavedSearch(searchId: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/saved-searches/${searchId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete saved search");
}

export async function getMatchingListings(
  searchId: string,
): Promise<ListingSummary[]> {
  const res = await fetch(
    `${getApiUrl()}/saved-searches/${searchId}/listings`,
    {
      credentials: "include",
    },
  );
  if (!res.ok) throw new Error("Failed to fetch matching listings");
  const data = await res.json();

  return data.map((item: BListingSummary) => {
    const firstImage = item.images?.[0];
    const imagePath = firstImage?.path;
    return {
      id: item.listingId,
      title: item.title,
      meta: `${item.categoryName} · ${new Date(item.createdAt).toLocaleDateString()}`,
      price: item.price,
      status: item.listingStatus,
      views: item.viewCount ?? 0,
      imageUrl: imagePath ? imageUrl(imagePath) : "/placeholder.png",
      categoryName: item.categoryName || "",
    };
  });
}
