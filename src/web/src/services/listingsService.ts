import type { ListingDetail } from "../types/listing";
import type {
  ListingSummary,
  MyListingsResponse,
  Category,
} from "../types/listing";
import type { SellerListingDetail } from "../types/listing";
import type {
  BrowseListing,
  BrowseListingsResponse,
  BrowseCondition,
  Course,
} from "../types/listing";
import biologyTextbook from "../assets/bio-textbook.jpg";
import { useAuthStore } from "../store/useAuthStore";

const BASE_URL = import.meta.env.VITE_API_URL;
const API_ORIGIN = new URL(BASE_URL).origin;

export function imageUrl(path: string): string {
  return `${API_ORIGIN}${path}`;
}
function mapCondition(condition: string): BrowseCondition {
  const map: Record<string, BrowseCondition> = {
    new: "like_new",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  };
  return map[condition] ?? "Fair";
}

function getFirstUploadedImagePath(
  images: { imageId: number; isPrimary: boolean; path: string }[],
): string | undefined {
  if (images.length === 0) return undefined;
  return images.reduce((earliest, img) =>
    img.imageId < earliest.imageId ? img : earliest,
  ).path;
}

const mockMyListings: ListingSummary[] = [
  {
    id: "1",
    title: "Chemistry Textbook - 3rd Ed",
    meta: "CMY127 · Listed 7 May 2026",
    price: 250,
    status: "live",
    views: 42,
    imageUrl: "https://placehold.co/48x48/1a3a7a/ffffff?text=CH",
  },
  {
    id: "2",
    title: 'HP Laptop 15" - Good Condition',
    meta: "Electronics · Listed 5 May 2026",
    price: 4500,
    status: "live",
    views: 25,
    imageUrl: "https://placehold.co/48x48/1a3a7a/ffffff?text=LP",
  },
  {
    id: "3",
    title: "Geometry Set - Unopened",
    meta: "Stationery · Listed 4 May 2026",
    price: 250,
    status: "pending",
    views: 68,
    imageUrl: "https://placehold.co/48x48/1a3a7a/ffffff?text=GS",
  },
  {
    id: "4",
    title: "Calculus - Early Transcendentals",
    meta: "WTW114 · Listed 3 May 2026",
    price: 350,
    status: "draft",
    views: 89,
    imageUrl: "https://placehold.co/48x48/1a3a7a/ffffff?text=CA",
  },
  {
    id: "5",
    title: "Molecular Biology - 6th Ed",
    meta: "BIO226 · Listed 3 May 2026",
    price: 350,
    status: "rejected",
    views: 89,
    imageUrl: "https://placehold.co/48x48/1a3a7a/ffffff?text=MB",
  },
];

const mockListingDetail: ListingDetail = {
  id: "1",
  title: "Calculus - Early Transcendentals",
  description:
    "Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP.",
  price: 280,
  condition: "new",
  category: "book",
  status: "live",
  courseCode: "WTW114",
  university: "University of Pretoria",
  tags: ["WTW114", "First Year", "University of Pretoria"],
  images: [
    { id: "1", url: biologyTextbook, isPrimary: true },
    { id: "2", url: biologyTextbook, isPrimary: false },
    { id: "3", url: biologyTextbook, isPrimary: false },
  ],
  views: 42,
  listedAt: "2026-05-07T09:14:00Z",
  sellerId: "seller-1",
  sellerName: "Langa Vakalisa",
  sellerInitials: "LV",
  sellerRating: 4.9,
  sellerResponseRate: 98,
  sellerTotalListings: 12,
  isReserved: false,
  aiScore: 78,
  aiLabel: "low_risk",
  reviews: [
    {
      id: "r1",
      initials: "ZS",
      name: "Zelamene S.",
      stars: 5,
      text: "Item was exactly as described.",
      date: "2026-05-03T00:00:00Z",
    },
    {
      id: "r2",
      initials: "SK",
      name: "Sabira K.",
      stars: 4,
      text: "Book was in good condition.",
      date: "2026-04-28T00:00:00Z",
    },
  ],
  similarListings: [
    {
      id: "2",
      title: "Calculus - Early Transcendentals 3rd Ed",
      meta: "UP · R120",
      condition: "good",
    },
    {
      id: "3",
      title: "Linear Algebra - 6th Ed",
      meta: "UP · R310",
      condition: "fair",
    },
  ],
};

const mockSellerListingDetail: SellerListingDetail = {
  id: "4",
  title: "Calculus - Early Transcendentals",
  price: 4500,
  condition: "good",
  category: "book",
  courseCode: "WTW114",
  listedAt: "2026-05-07T09:15:00Z",
  views: 42,
  description: "Good condition with minor highlighting on pages 3-5.",
  tags: ["WTW114", "First Year", "UP"],
  images: [
    "https://placehold.co/540x300/1a3a7a/ffffff?text=Calculus",
    "https://placehold.co/80x70/1a3a7a/ffffff?text=img2",
    "https://placehold.co/80x70/1a3a7a/ffffff?text=img3",
    "https://placehold.co/80x70/1a3a7a/ffffff?text=img4",
  ],
  status: "live",
  aiScore: 78,
  aiLabel: "Low Risk",
  isReserved: true,
  timeline: [
    { label: "Draft created", time: "2026-05-07T09:15:00Z", done: true },
    { label: "Submitted for review", time: "2026-05-07T09:22:00Z", done: true },
    { label: "AI Scoring Complete", time: "2026-05-07T09:23:00Z", done: true },
    { label: "Live", time: "2026-05-07T09:23:00Z", done: true },
  ],
};

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  condition: string;
  categoryName: string;
  courseId: number | null;
  listingStatus: string;
}

export const listingsService = {
  getById: async (id: string): Promise<ListingDetail> => {
    const res = await fetch(`${BASE_URL}/listings/${id}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch listing");
    const item = await res.json();
    return {
      ...mockListingDetail,
      id: item.listingId,
      title: item.title,
      description: item.description,
      price: item.price,
      condition: item.condition,
      status: item.listingStatus,
      views: item.viewCount,
      sellerId: item.sellerId,
      listedAt: item.createdAt,
      courseCode: item.courseId?.toString() ?? mockListingDetail.courseCode,
      category: item.categoryName,
      images: item.images.map((i: unknown) => {
        const img = i as { imageId: number; path: string; isPrimary: boolean };
        return {
          id: img.imageId.toString(),
          url: imageUrl(img.path),
          isPrimary: img.isPrimary,
        };
      }),
    };
  },

  getMyListings: async (): Promise<MyListingsResponse> => {
    const user = useAuthStore.getState().user;
    if (!user)
      return { listings: mockMyListings, total: mockMyListings.length };

    const res = await fetch(`${BASE_URL}/listings?sellerId=${user.id}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch listings");

    const data = await res.json();
const listings: ListingSummary[] = data.items.map((item: unknown) => {
  const l = item as {
    listingId: string;
    title: string;
    categoryName: string;
    createdAt: string;
    price: number;
    listingStatus: string;
    viewCount: number;
    images: { imageId: number; isPrimary: boolean; path: string }[];
  };
  const primary = getFirstUploadedImagePath(l.images);
  return {
    id: l.listingId,
    title: l.title,
    meta: `${l.categoryName} · Listed ${new Date(l.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`,
    price: l.price,
    status: l.listingStatus,
    views: l.viewCount,
    imageUrl: primary ? imageUrl(primary) : biologyTextbook,
  };
});
    return { listings, total: data.total };
  },

  getSellerListingById: async (id: string): Promise<SellerListingDetail> => {
    const res = await fetch(`${BASE_URL}/listings/${id}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch listing");
    const item = await res.json();
    return {
      ...mockSellerListingDetail,
      id: item.listingId,
      title: item.title,
      price: item.price,
      condition: item.condition,
      status: item.listingStatus,
      views: item.viewCount,
      listedAt: item.createdAt,
      description: item.description,
      courseCode:
        item.courseId?.toString() ?? mockSellerListingDetail.courseCode,
      category: item.categoryName,
      images:
        item.images.length > 0
          ? item.images.map((i: unknown) =>
              imageUrl((i as { path: string }).path),
            )
          : mockSellerListingDetail.images,
    };
  },

  getBrowseListings: async (): Promise<BrowseListingsResponse> => {
    const res = await fetch(`${BASE_URL}/listings`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch listings");
    const data = await res.json();
    const listings: BrowseListing[] = data.items.map((item: unknown) => {
  const l = item as {
    listingId: string;
    title: string;
    price: number;
    courseId?: number;
    categoryName: string;
    condition: string;
    images: { imageId: number; isPrimary: boolean; path: string }[];
  };
  const primary = getFirstUploadedImagePath(l.images);
  return {
    id: l.listingId,
    title: l.title,
    price: l.price,
    module: l.courseId?.toString() ?? "General",
    category: l.categoryName,
    condition: mapCondition(l.condition),
    image: primary ? imageUrl(primary) : biologyTextbook,
  };
});
    return { listings, total: data.total };
  },

  uploadImages: async (listingId: string, files: File[]): Promise<number[]> => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const res = await fetch(`${BASE_URL}/listings/${listingId}/images`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) throw new Error("Failed to upload images");
    const { imageIds } = await res.json();
    return imageIds;
  },

  createListing: async (payload: CreateListingPayload): Promise<string> => {
    const res = await fetch(`${BASE_URL}/listings`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        price: payload.price,
        condition: payload.condition,
        categoryName: payload.categoryName,
        listingStatus: payload.listingStatus,
        courseId: payload.courseId,
        isBundle: false,
      }),
    });
    if (!res.ok) throw new Error("Failed to create listing");
    const createdListing = await res.json();
    return createdListing.listingId;
  },

  updateListing: async (
    id: string,
    payload: {
      title: string;
      description: string;
      price: number;
      condition: string;
      categoryName: string;
      courseId: number | null;
      removedImageIds?: number[];
    },
  ): Promise<void> => {
    const res = await fetch(`${BASE_URL}/listings/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        price: payload.price,
        condition: payload.condition,
        categoryName: payload.categoryName,
        courseId: payload.courseId,
        removedImageIds: payload.removedImageIds ?? [],
      }),
    });
    if (!res.ok) throw new Error("Failed to update listing");
  },

  deleteListing: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/listings/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete listing");
  },

  getListingsCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${BASE_URL}/listing-categories`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data: Category[] = await res.json();
    return data;
  },

  searchCourses: async (search: string): Promise<Course[]> => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search);
    }
    params.set("universityId", "2"); // this has the UP courses only
    params.set("limit", "50");
    const res = await fetch(`${BASE_URL}/courses?${params}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch courses");
    return await res.json();
  },
};
