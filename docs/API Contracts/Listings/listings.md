# Listings API

Base path: `/api/listings`

---

## POST /

Creates a new listing.

**Request body**
```json
{
  "title": "string",
  "description": "string",
  "price": "number",
  "condition": "string",
  "listingType": "string",
  "listingStatus": "string",
  "sellerId": "guid",
  "courseId": "guid | null",
  "isbn": "string | null",
  "author": "string | null",
  "edition": "string | null",
  "isBundle": "boolean",
  "images": [
    {
      "imageUrl": "string",
      "isPrimary": "boolean"
    }
  ]
}
```

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `ListingSummary` (see below) | Created successfully |
| 400 | `"Field(s) missing."` | Title, condition, or price missing/invalid |

---

## PUT /{id}

Updates an existing listing by ID. Only updates title, description, price, and condition.

**Path params** — `id: guid`

**Request body**
```json
{
  "title": "string",
  "description": "string",
  "price": "number",
  "condition": "string"
}
```

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `"Listings updated successfully"` | Updated |
| 404 | — | Listing not found |

---

## DELETE /{id}

Deletes a listing by ID.

**Path params** — `id: guid`

**Responses**

| Status | Body | When |
|--------|------|------|
| 204 | — | Deleted |
| 404 | — | Listing not found |

---

## GET /

Returns a paginated list of listings, with optional filters.

**Query params**

All fields are optional. Defined by `ListFilterDto` (exact filter fields TBD by implementation).

**Responses**

| Status | Body |
|--------|------|
| 200 | `PagedResult<ListingSummary>` (see below) |

---

## GET /{id}

Returns a single listing by ID.

**Path params** — `id: guid`

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `ListingSummary` | Found |
| 404 | `{ "error": "listing_not_found" }` | Not found |

---

## POST /images

Uploads one or more images and returns their URLs. Call this before creating a listing to get the image URLs to include in the request body.

**Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Notes |
|-------|------|-------|
| `files` | `File[]` | JPEG, PNG, or WebP only. Max 10MB per file. |

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | `{ "urls": ["string"] }` | All files uploaded |
| 400 | `"no_files"` | No files provided |
| 400 | `"file_too_large"` | A file exceeds 10MB |
| 400 | `"invalid_file_type"` | File isn't JPEG, PNG, or WebP |

---

## Shared types

### ListingSummary

Returned by GET and POST endpoints.

```json
{
  "listingId": "guid",
  "sellerId": "guid",
  "title": "string",
  "description": "string",
  "price": "number",
  "condition": "string",
  "listingType": "string",
  "courseId": "guid | null",
  "isbn": "string | null",
  "author": "string | null",
  "edition": "string | null",
  "listingStatus": "string",
  "isBundle": "boolean",
  "viewCount": "number",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "images": [
    {
      "imageId": "guid",
      "url": "string",
      "isPrimary": "boolean"
    }
  ]
}
```

### PagedResult

```json
{
  "items": "ListingSummary[]",
  "total": "number"
}
```
