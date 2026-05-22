# Universities API

Base path: `/api/universities`

---

## GET /

Returns all active universities. Mainly used to populate registration dropdowns and validate email domains.

No request body or query params required.

**Responses**

| Status | Body | When |
|--------|------|------|
| 200 | See below | Fetched successfully |
| 500 | `{ "message": "An error occurred while fetching universities" }` | Unexpected error |

**200 body**
```json
{
  "count": "number",
  "data": [
    {
      "universityId": "guid",
      "name": "string",
      "emailDomain": "string"
    }
  ]
}
```