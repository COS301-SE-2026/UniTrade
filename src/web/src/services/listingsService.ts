import type {
  ListingDetail,
  ListingSummary,
  MyListingsResponse,
  Category,
  SellerListingDetail,
  BrowseListing,
  BrowseListingsResponse,
  BrowseCondition,
  Course,
  ListingMetadata,
  SimilarListing,
  ListingStatus,
  WishlistResponse,
  WishlistListing,
  MeetupStatusResponse,
  ProposeMeetupPayload,
  UserReviewsResponse,
  SubmitReviewPayload,
  Review,
  OrderItem,
  SaleItem
} from "../types/listing";

import biologyTextbook from "../assets/bio-textbook.jpg";
import { useAuthStore } from "../store/useAuthStore";
import { getSimilarListings as computeSimilarListings } from "../utils/similarListings";
import { getReservations, getTransactionStatus } from "./reservationService";


import { getApiUrl } from "../config";

export function imageUrl(path: string): string {
  const origin = new URL(getApiUrl()).origin;

  return `${origin}${path}`;
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

/*const mockListingDetail: ListingDetail = {
  id: "1",
  title: "Calculus - Early Transcendentals",
  description:
    "Good condition with minor highlighting on pages 3-5. All pages intact, spine undamaged. Ideal for first year Calculus students at UP.",
  price: 280,
  condition: "new",
  category: "book",
  status: "live",
  courseCode: "WTW114",
  courseId: 1076,
  university: "University of Pretoria",
  tags: ["WTW114", "First Year", "University of Pretoria"],
  metadata: null,
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
      meta: "UP · R120",
      condition: "fair",
    },
  ],
};*/

const mockSellerListingDetail: SellerListingDetail = {
  id: "4",
  title: "Calculus - Early Transcendentals",
  price: 4500,
  condition: "good",
  category: "book",
  courseId: 1,
  courseCode: "WTW114",
  listedAt: "2026-05-07T09:15:00Z",
  views: 42,
  description: "Good condition with minor highlighting on pages 3-5.",
  tags: ["WTW114", "First Year", "UP"],
  metadata: null,
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
  metadata?: ListingMetadata;
}

function mapWishListItem(item: unknown): WishlistListing {
  const w = item as {
    wishlistId: number;
    listingId: string;
    addedAt: string;
    listing: {
      listingId: string;
      title: string;
      price: number;
      sellerId: string;
      courseId?: number | null;
      categoryName: string;
      condition: string;
      listingStatus: string;
      metadata?: ListingMetadata;
      images: { imageId: number; isPrimary: boolean; path: string }[];
      seller?: { sellerId: string; fullName: string } | null;
    };
  };
  const l = w.listing;
  const primary = getFirstUploadedImagePath(l.images);
  return {
    id: l.listingId,
    title: l.title,
    price: l.price,
    module: l.courseId?.toString() ?? "General",
    courseId: l.courseId ?? null,
    category: l.categoryName,
    condition: mapCondition(l.condition),
    image: primary ? imageUrl(primary) : biologyTextbook,
    metadata: l.metadata ?? null,
    sellerId: l.sellerId ?? l.seller?.sellerId ?? "",
    sellerName: l.seller?.fullName ?? null,
    status: l.listingStatus as ListingStatus,
    addedAt: w.addedAt,
  };
}

export const listingsService = {
  getById: async (id: string): Promise<ListingDetail> => {
    const res = await fetch(`${getApiUrl()}/listings/${id}`, {
      credentials: "include",
      cache: "no-store",
    });
    //const res = await fetch(`${getApiUrl()}/listings/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch listing");
    const item = await res.json();
    return {
      id: item.listingId,
      title: item.title,
      description: item.description,
      price: item.price,
      condition: item.condition,
      status: item.listingStatus,
      views: item.viewCount,
      sellerId: item.sellerId,
      seller: item.seller ?? null,
      listedAt: item.createdAt,
      courseId: item.courseId ?? null,
      courseCode: item.courseCode ?? "",
      category: item.categoryName,
      metadata: item.metadata ?? null,
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

    const res = await fetch(`${getApiUrl()}/listings?sellerId=${user.id}`, {
      credentials: "include",
      cache: "no-store",
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
    const res = await fetch(`${getApiUrl()}/listings/${id}`, {
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
      isReserved: item.listingStatus === "reserved",
      views: item.viewCount,
      listedAt: item.createdAt,
      description: item.description,
      courseId: item.courseId ?? null,
      courseCode: "",
      category: item.categoryName,
      metadata: item.metadata ?? null,
      images:
        item.images.length > 0
          ? item.images.map((i: unknown) =>
            imageUrl((i as { path: string }).path),
          )
          : mockSellerListingDetail.images,
    };
  },

  getBrowseListings: async (options?: {
    search?: string;
  }): Promise<BrowseListingsResponse> => {
    const params = new URLSearchParams();
    params.set("listingStatus", "live");

    const user = useAuthStore.getState().user;
    if (user) {
      params.set("excludeSellerId", user.id);
    }

    if (options?.search) {
      params.set("search", options.search);
    }
    const res = await fetch(`${getApiUrl()}/listings?${params.toString()}`, {
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
        metadata?: ListingMetadata;
        images: { imageId: number; isPrimary: boolean; path: string }[];
        seller?: { sellerId: string };
      };
      const primary = getFirstUploadedImagePath(l.images);
      return {
        id: l.listingId,
        title: l.title,
        price: l.price,
        module: l.courseId?.toString() ?? "General",
        courseId: l.courseId ?? null,
        category: l.categoryName,
        condition: mapCondition(l.condition),
        image: primary ? imageUrl(primary) : biologyTextbook,
        metadata: l.metadata ?? null,
        sellerId: l.seller?.sellerId ?? "",
      };
    });

    return { listings, total: data.total };
  },

  getSimilarListings: async (
    listing: ListingDetail,
    limit = 2,
  ): Promise<SimilarListing[]> => {
    const { listings } = await listingsService.getBrowseListings();
    return computeSimilarListings(listing, listings, limit);
  },

  uploadImages: async (listingId: string, files: File[]): Promise<number[]> => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const res = await fetch(`${getApiUrl()}/listings/${listingId}/images`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) throw new Error("Failed to upload images");
    const { imageIds } = await res.json();
    return imageIds;
  },

  createListing: async (payload: CreateListingPayload): Promise<string> => {
    const res = await fetch(`${getApiUrl()}/listings`, {
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
        metadata: payload.metadata ?? null,
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
      metadata?: ListingMetadata;
    },
  ): Promise<void> => {
    const res = await fetch(`${getApiUrl()}/listings/${id}`, {
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
        metadata: payload.metadata ?? null,
      }),
    });
    if (!res.ok) throw new Error("Failed to update listing");
  },

  deleteListing: async (id: string): Promise<void> => {
    const res = await fetch(`${getApiUrl()}/listings/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete listing");
  },

  getListingsCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${getApiUrl()}/listing-categories`, {
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
    const res = await fetch(`${getApiUrl()}/courses?${params}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch courses");
    return await res.json();
  },

  getCourse: async (id: number): Promise<Course> => {
    const res = await fetch(`${getApiUrl()}/courses/${id}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch the courses");
    return await res.json();
  },

  updateListingStatus: async (
    id: string,
    status: ListingStatus,
  ): Promise<void> => {
    const res = await fetch(`${getApiUrl()}/listings/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to update listing status");
    }
  },

  getWishlist: async (): Promise<WishlistResponse> => {
    const res = await fetch(`${getApiUrl()}/wishlist`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch wishlist");
    const data = await res.json();
    const listings: WishlistListing[] = data.items.map(mapWishListItem);
    return { listings, total: data.total };
  },

  addToWishlist: async (listingId: string): Promise<WishlistListing> => {
    const res = await fetch(`${getApiUrl()}/wishlist`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to add to wishlist ");
    }
    return mapWishListItem(await res.json());
  },

  removeFromWishlist: async (listingId: string): Promise<void> => {
    const res = await fetch(`${getApiUrl()}/wishlist/${listingId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok && res.status !== 404) {
      throw new Error("Failed to remove from wishlist ");
    }
  },

  proposeMeetup: async (
    reservationId: string,
    payload: ProposeMeetupPayload,
  ): Promise<MeetupStatusResponse> => {
    const res = await fetch(
      `${getApiUrl()}/reservations/${reservationId}/meetup/propose`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to propose meetup");
    }
    return res.json();
  },

  acceptMeetup: async (
    reservationId: string,
    proposalMessageId: number,
  ): Promise<MeetupStatusResponse> => {
    const res = await fetch(
      `${getApiUrl()}/reservations/${reservationId}/meetup/accept`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalMessageId }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to accept meetup");
    }
    return res.json();
  },

  declineMeetup: async (
    reservationId: string,
    proposalMessageId: number,
  ): Promise<void> => {
    const res = await fetch(
      `${getApiUrl()}/reservations/${reservationId}/meetup/decline`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalMessageId }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to decline meetup");
    }
  },

  checkInMeetup: async (
    reservationId: string,
    lat?: number,
    lng?: number,
  ): Promise<MeetupStatusResponse> => {
    const res = await fetch(
      `${getApiUrl()}/reservations/${reservationId}/meetup/check-in`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to check in");
    }
    return res.json();
  },

  getMeetupStatus: async (
    reservationId: string,
  ): Promise<MeetupStatusResponse | null> => {
    const res = await fetch(
      `${getApiUrl()}/reservations/${reservationId}/meetup`,
      {
        credentials: "include",
      },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch meetup status");
    return res.json();
  },

  getReviewsForUser: async (userId: string): Promise<UserReviewsResponse> => {
    const res = await fetch(`${getApiUrl()}/reviews/users/${userId}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to fetch reviews");
    }
    return res.json();
  },

  submitReview: async (payload: SubmitReviewPayload): Promise<Review> => {
    const res = await fetch(`${getApiUrl()}/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to submit review");
    }
    return res.json();
  },

  getCompletedOrders: async (): Promise<OrderItem[]> => {
    const res = await getReservations({ role: 'buyer' });
    if (!res.success) {
      throw new Error(res.error.message ?? 'Failed to load your orders');
    }

    const completed = res.data.items.filter(
      (r) => r.reservationStatus === 'completed',
    );

    if (completed.length === 0) return [];

    const listingIds = [...new Set(completed.map((r) => r.listingId))];
    const conditionMap = new Map<string, string>();

    await Promise.all(
      listingIds.map(async (listingId) => {
        try {
          const detail = await listingsService.getById(listingId);
          conditionMap.set(listingId, detail.condition);
        } catch {
          conditionMap.set(listingId, 'Unknown');
        }
      }),
    );

    const txMap = new Map<string, string | null>();
    await Promise.all(
      completed.map(async (r) => {
        const tx = await getTransactionStatus(r.reservationId);
        txMap.set(r.reservationId, tx.success ? tx.data.transactionId : null);
      }),
    );

    const sellerIds = [...new Set(completed.map((r) => r.counterParty.userId))];
    const reviewsMap = new Map<string, Review[]>();
    await Promise.all(
      sellerIds.map(async (sellerId) => {
        try {
          const data = await listingsService.getReviewsForUser(sellerId);
          reviewsMap.set(sellerId, data.reviews);
        } catch {
          reviewsMap.set(sellerId, []);
        }
      }),
    );

    function toRefNum(reservationId: string): string {
      return `#${reservationId.slice(0, 8).toUpperCase()}`;
    }

    function formatOrderDate(iso: string): string {
      return new Date(iso).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    return completed.map((r) => {
      const transactionId = txMap.get(r.reservationId);
      const sellerReviews = reviewsMap.get(r.counterParty.userId) ?? [];
      const theReview = transactionId
        ? sellerReviews.find((rev) => rev.transactionId === transactionId)
        : undefined;

      return {
        id: r.reservationId,
        transactionId: transactionId ?? null,
        refNum: toRefNum(r.reservationId),
        title: r.listing.title,
        condition: conditionMap.get(r.listingId) ?? 'Unknown',
        sellerName: r.counterParty.name,
        sellerInitials: r.counterParty.initials,
        price: r.listing.price,
        date: formatOrderDate(r.createdAt),
        status: 'Completed' as const,
        rating: theReview?.rating ?? 0,
        _createdAtIso: r.createdAt,
        imageUrl: r.listing.imagePath ? imageUrl(r.listing.imagePath) : '',
      }
    });
  },

  getCompletedSales: async (): Promise<SaleItem[]> => {
    const res = await getReservations({ role: 'seller' });
    if (!res.success) {
      throw new Error(res.error.message ?? 'Failed to load your sales');
    }

    const completed = res.data.items.filter(
      (r) => r.reservationStatus === 'completed',
    );

    if (completed.length === 0) return [];

    const listingIds = [...new Set(completed.map((r) => r.listingId))];
    const conditionMap = new Map<string, string>();


    await Promise.all(
      listingIds.map(async (listingId) => {
        try {
          const detail = await listingsService.getById(listingId);
          conditionMap.set(listingId, detail.condition);


        } catch {
          conditionMap.set(listingId, 'Unknown');

        }
      }),
    );

    const txMap = new Map<string, string | null>();
    await Promise.all(
      completed.map(async (r) => {
        const tx = await getTransactionStatus(r.reservationId);
        txMap.set(r.reservationId, tx.success ? tx.data.transactionId : null);
      }),
    );

    const buyerIds = [...new Set(completed.map((r) => r.counterParty.userId))];
    const reviewsMap = new Map<string, Review[]>();
    await Promise.all(
      buyerIds.map(async (buyerId) => {
        try {
          const data = await listingsService.getReviewsForUser(buyerId);
          reviewsMap.set(buyerId, data.reviews);
        } catch {
          reviewsMap.set(buyerId, []);
        }
      })
    );


    function toRefNum(reservationId: string): string {
      return `#${reservationId.slice(0, 8).toUpperCase()}`;
    }

    function formatOrderDate(iso: string): string {
      return new Date(iso).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    return completed.map((r) => {
      const transactionId = txMap.get(r.reservationId);
      const buyerReviews = reviewsMap.get(r.counterParty.userId) ?? [];
      const theReview = transactionId
        ? buyerReviews.find((rev) => rev.transactionId === transactionId)
        : undefined;

      return {
        id: r.reservationId,
        transactionId: transactionId ?? null,
        refNum: toRefNum(r.reservationId),
        title: r.listing.title,
        condition: conditionMap.get(r.listingId) ?? 'Unknown',
        buyerName: r.counterParty.name,
        buyerInitials: r.counterParty.initials,
        price: r.listing.price,
        date: formatOrderDate(r.createdAt),
        status: 'Completed' as const,
        rating: theReview?.rating ?? 0,
        _createdAtIso: r.createdAt,
        imageUrl: r.listing.imagePath ? imageUrl(r.listing.imagePath) : '',
      }
    });
  },

}
