# Database Schema Documentation
## UniTrade

---

## 1. Users

Stores core identity and authentication information for every registered person on the platform. This base table is shared by all roles (students and admins). Role-specific data is stored in the Student_profiles and Admin_profiles tables.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| user_id | SERIAL | PK | Unique identifier for each user. |
| first_name | VARCHAR(50) | NOT NULL | User's first name. |
| last_name | VARCHAR(50) | NOT NULL | User's last name. |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Must be a valid SA university email domain. |
| password | TEXT | NOT NULL | Securely hashed password. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the account was created. |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of the most recent account update. |
| role | VARCHAR(10) | NOT NULL, CHECK contraint | One of: student, admin. Determines which profile table to join. |

**Notes:**
- Email domain is validated on registration against known SA university domains stored in the `University` table.

---

## 2. University

Stores information about South African universities supported by the platform. Used to validate/verify student email domains at registration.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| university_id | SERIAL | PK | Unique identifier for each university. |
| name | VARCHAR(100) | NOT NULL | Full official name of the university. |
| email_domain | VARCHAR(100) | UNIQUE, NOT NULL | The university's student email domain (e.g.`up.ac.za`). |
| city | VARCHAR(100) | NOT NULL | City where the university is located. |
| is_active | BOOLEAN | DEFAULT TRUE | Controls whether this university is available for registration. |

**Notes:**
- Email domain validation at registration queries this table to determine whether a submitted email is from a supported institution.

---

## 3. Course

Stores degree and course information offered by universities. Used to tag listings and to build behaviour-driven recommendations over time.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| course_id | SERIAL | PK | Unique identifier for each course. |
| university_id | INT | FK → University(university_id), NOT NULL | The university that offers this course. |
| course_code | VARCHAR(20) | NOT NULL | Short course code (e.g. `COS284`). |
| course_name | VARCHAR(100) | NOT NULL | Full name of the course or module. |
| faculty | VARCHAR(100) | | The faculty or school this course belongs to. |

**Notes:**
- Courses are scoped per university; the same course code at two universities is two separate records.
- Listing tags referencing course codes drive the recommendation engine over time.

---

## 4. Verification_requests

Tracks the two-step student verification process: OTP email confirmation followed by AI and/or admin review of the uploaded proof of registration (PoR).

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| verification_id | SERIAL | PK | Unique identifier for each verification request. |
| user_id | INT | FK → Users(user_id), NOT NULL | The user submitting this request. |
| otp_code | VARCHAR(10) | | One-time passcode sent to the student email. |
| otp_verified_at | TIMESTAMP | | Timestamp when the OTP was successfully confirmed. |
| otp_expires_at | TIMESTAMP | NOT NULL | Expiry time of the OTP. |
| por_file_path | TEXT | | Storage path of the uploaded proof of registration (PDF only). |
| ai_confidence_score | NUMERIC(5,2) | | Confidence score output by the AI verification layer (0–100). |
| ai_decision | VARCHAR(20) | CHECK constraint | One of: `auto_approved`, `escalated`. Null until AI processes the PoR. |
| admin_id | INT | FK → Users(user_id), nullable | The admin assigned to review this request, if escalated. |
| admin_decision | VARCHAR(20) | CHECK constraint | One of: `approved`, `rejected`. Null until admin acts. |
| rejection_reason | TEXT | | Explanation sent to the user if the request is rejected. |
| status | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `otp_pending`, `por_pending`, `under_review`, `approved`, `rejected`. |
| submitted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the request was created. |
| decided_at | TIMESTAMP | | Timestamp when a final decision was made. |
| attempt_number | INT | NOT NULL, DEFAULT 1 | The attempt number for this user (1st, 2nd, etc.). |
| is_current | BOOLEAN | DEFAULT TRUE | Flags the active/latest record for a user. Only one attempt per user should be current at any time. |

**Notes:**
- This is a **1:1** relationship with `Users` , each user has exactly one verification request record.
- AI auto-approves high-confidence submissions; medium and low confidence is escalated to an admin.
- SLA target for admin review is 2–3 business days.

---

## 5. Listings

Stores all textbook and material listings created by sellers. Listings go through a pipeline before becoming visible to buyers.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| listing_id | SERIAL | PK | Unique identifier for each listing. |
| seller_id | INT | FK → Users(user_id), NOT NULL | The user who created the listing. |
| course_id | INT | FK → Course(course_id), nullable | Optional course/module tag for recommendations. |
| title | VARCHAR(150) | NOT NULL | Title of the listing (e.g. "Foundations of Computer science"). |
| description | TEXT | NOT NULL | Full description of the item. |
| price | NUMERIC(10,2) | NOT NULL, CHECK (> 0) | Asking price in ZAR. |
| condition | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `new`, `good`, `fair`, `poor`. |
| listing_status | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `draft`, `pending_review`, `live`, `low_visibility`, `rejected`, `sold`. |
| ai_risk_score | NUMERIC(5,2) | | Risk score output by the AI pipeline (0–100). |
| ai_risk_level | VARCHAR(10) | CHECK constraint | One of: `low`, `medium`, `high`. Set after AI processing. |
| visibility_score | INT | DEFAULT 100 | Controls search ranking; reduced for medium-risk listings. |
| is_bundle | BOOLEAN | DEFAULT FALSE | Indicates if this listing is part of a bundle pack offer. |
| rejection_reason | TEXT | | Reason provided to the seller if the listing is rejected. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the listing was created. |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of the most recent update. |

**Listing Status Flow:**
```
Draft →[AI Scoring] → Low risk: Live
                     → medium risk: Low Visibility (optionally queued for admin)
                     → High risk: Pending Review then the Admin makes decision then it either goes Live or is Rejected
```

**Notes:**
- Sellers who are not yet verified can create drafts but cannot submit them for AI scoring.
- The seller does not manually choose to publish; the system decides based on verification status and AI score.
- `visibility_score` is used to deprioritise listings in search results and hide them from recommendation surfaces.

---

## 6. Listing_images

Stores image references for each listing. 

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| image_id | SERIAL | PK | Unique identifier for each image record. |
| listing_id | INT | FK → Listings(listing_id), NOT NULL, ON DELETE CASCADE | The listing this image belongs to. |
| image_url | TEXT | NOT NULL | Storage URL or path for the uploaded image. |
| is_primary | BOOLEAN | DEFAULT FALSE | Marks the main display image for the listing card. |
| uploaded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the image was uploaded. |

**Notes:**
- Only one image per listing should have `is_primary = TRUE`.
- Images are processed by the AI pipeline as part of listing risk scoring (duplicate detection, reverse-image checks, content classification).

---

## 7. Reservations

Represents a buyer expressing interest in one or more listings, creating a temporary hold. Drives the timed coordination window between buyer and seller.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| reservation_id | SERIAL | PK | Unique identifier for each reservation. |
| buyer_id | INT | FK → Users(user_id), NOT NULL | The user making the reservation. |
| seller_id | INT | FK → Users(user_id), NOT NULL | The seller whose listing(s) are being reserved. |
| is_bundle | BOOLEAN | DEFAULT FALSE | TRUE for bundle pack reservations (multiple listings, 7-day window). |
| reservation_status | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `active`, `expired`, `cancelled`, `completed`. |
| seller_acknowledged_at | TIMESTAMP | | Timestamp when the seller first responded in chat. |
| buyer_responded_at | TIMESTAMP | | Timestamp when the buyer responded after seller acknowledgement. |
| expires_at | TIMESTAMP | NOT NULL | Expiry deadline, 24 hours for single items and 7 days for bundles. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the reservation was created. |

**Reservation Timer Logic:**
- On creation, an automated "interested" message is sent to the seller on the buyer's behalf.
- Seller has 24 hours to acknowledge; buyer then has 24 hours to engage back.
- Once both parties are actively coordinating toward a meetup, the countdown effectively pauses.
- Seller can manually release after 12 hours of buyer silence; system auto-expires after 24 hours.
- Buyer can cancel their own reservation at any time.
- Bundle packs have a 7-day window.

---

## 8. Reservation_listings

Junction table resolving the many-to-many relationship between reservations and listings. 

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| reservation_id | INT | FK → Reservations(reservation_id), NOT NULL, ON DELETE CASCADE | The reservation. |
| listing_id | INT | FK → Listings(listing_id), NOT NULL, ON DELETE CASCADE | The listing included in the reservation. |

**Notes:**
- Composite primary key on `(reservation_id, listing_id)`.
- A single-item reservation will have exactly one row; a bundle will have multiple rows.

---

## 9. Meetups

Captures the agreed physical meeting details between a buyer and seller. Handles location-based check-in verification to support the no-show detection system.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| meetup_id | SERIAL | PK | Unique identifier for each meetup. |
| reservation_id | INT | FK → Reservations(reservation_id), NOT NULL | The reservation that led to this meetup. |
| agreed_location_name | VARCHAR(150) | NOT NULL | Human-readable name of the agreed meeting location (e.g. "Library, Floor 2"). |
| agreed_latitude | NUMERIC(9,6) | NOT NULL | Latitude of the agreed meeting point. |
| agreed_longitude | NUMERIC(9,6) | NOT NULL | Longitude of the agreed meeting point. |
| agreed_time | TIMESTAMP | NOT NULL | The date and time both parties agreed to meet. |
| buyer_checked_in | BOOLEAN | DEFAULT FALSE | Whether the buyer tapped "I'm here". |
| buyer_checkin_time | TIMESTAMP | | Timestamp of buyer's check-in. |
| buyer_checkin_latitude | NUMERIC(9,6) | | Buyer's verified GPS latitude at check-in. |
| buyer_checkin_longitude | NUMERIC(9,6) | | Buyer's verified GPS longitude at check-in. |
| seller_checked_in | BOOLEAN | DEFAULT FALSE | Whether the seller tapped "I'm here". |
| seller_checkin_time | TIMESTAMP | | Timestamp of seller's check-in. |
| seller_checkin_latitude | NUMERIC(9,6) | | Seller's verified GPS latitude at check-in. |
| seller_checkin_longitude | NUMERIC(9,6) | | Seller's verified GPS longitude at check-in. |
| checkin_window_closes_at | TIMESTAMP | NOT NULL | 30 minutes after `agreed_time`; after this, check-in is no longer possible. |
| status | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `scheduled`, `completed`, `no_show_buyer`, `no_show_seller`. |

**Notes:**
- The "I'm here" button becomes active 15 minutes before `agreed_time`.
- Location is verified within 300m of `agreed_latitude/longitude`. Users who deny location permission waive their right to dispute no-show claims.
- If no PIN is entered within the expected window after check-in, the system logs a no-show.

---

## 10. Transactions

Records a completed payment made at a meetup via Ozow. 

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| transaction_id | SERIAL | PK | Unique identifier for each transaction. |
| meetup_id | INT | FK → Meetups(meetup_id), NOT NULL | The meetup at which this transaction occurred. |
| buyer_id | INT | FK → Users(user_id), NOT NULL | The buyer making the payment. |
| seller_id | INT | FK → Users(user_id), NOT NULL | The seller receiving the payment. |
| amount | NUMERIC(10,2) | NOT NULL, CHECK (> 0) | Total amount paid in ZAR. |
| ozow_transaction_id | VARCHAR(100) | UNIQUE | Transaction reference returned by Ozow's webhook. |
| payment_status | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `pending`, `completed`, `failed`, `cancelled`. |
| pin_hash | VARCHAR(10) | | System-generated PIN hash delivered to the buyer after successful payment. |
| pin_entered_at | TIMESTAMP | | Timestamp when the seller entered the PIN. |
| pin_status | VARCHAR(10) | NOT NULL, DEFAULT 'pending', CHECK constraint | One of: `pending`, `confirmed`. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the transaction record was created. |

**Payment Flow:**
1. Buyer initiates payment → Ozow flow opens.
2. Ozow webhook hits the backend → verified → PIN generated → delivered to buyer.
3. Buyer shows PIN to seller at the meetup.
4. Seller enters PIN in-app → `pin_status` set to `confirmed` → transaction closes.

**Notes:**
- No card or bank details are stored. Ozow handles all payment processing.
- Only `ozow_transaction_id`, `payment_status`, user IDs, item IDs, and timestamps are stored.

---

## 11. Chat_messages

Stores all messages exchanged between a buyer and seller within the context of a reservation. Includes the automated initial "interested" message sent by the system.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| message_id | SERIAL | PK | Unique identifier for each message. |
| reservation_id | INT | FK → Reservations(reservation_id), NOT NULL | The reservation thread this message belongs to. |
| sender_id | INT | FK → Users(user_id), NOT NULL | The user who sent the message. |
| content | TEXT | NOT NULL | The message content. |
| is_automated | BOOLEAN | DEFAULT FALSE | TRUE for system-generated messages (e.g. the initial "interested" notification). |
| sent_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the message was sent. |
| read_at | TIMESTAMP | | Timestamp when the message was read by the recipient. |

**Notes:**
- Chat is only available to fully verified users.
- Chat is scoped to a reservation , there is no free-form messaging outside of a reservation context.

---

## 12. Disputes

Records formal complaints raised by users. Handled by admins for listing-quality complaints and false listing reports. No-shows are handled mechanically by the system.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| dispute_id | SERIAL | PK | Unique identifier for each dispute. |
| raised_by | INT | FK → Users(user_id), NOT NULL | The user who raised the dispute. |
| against_user | INT | FK → Users(user_id), NOT NULL | The user the dispute is filed against. |
| transaction_id | INT | FK → Transactions(transaction_id), nullable | Linked transaction, if applicable. |
| listing_id | INT | FK → Listings(listing_id), nullable | Linked listing, if applicable. |
| dispute_type | VARCHAR(30) | NOT NULL, CHECK constraint | One of: `listing_quality`, `no_show`, `false_listing`. |
| description | TEXT | NOT NULL | The user's description of the issue. |
| status | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `open`, `under_review`, `resolved`, `closed`. |
| assigned_admin_id | INT | FK → Users(user_id), nullable | The admin assigned to handle this dispute. |
| resolution | TEXT | | Admin's final resolution notes. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the dispute was raised. |
| resolved_at | TIMESTAMP | | Timestamp when the dispute was closed. |

**Dispute Types:**
- **Listing quality** , buyer finds item doesn't match the listing at meetup (pre-payment, no refund applicable).
- **No-show** , detected mechanically; repeated no-shows trigger automatic reputation consequences.
- **False listing** , buyer reports a listing as misleading or fraudulent; routes to admin review.

---

## 13. Dispute_evidence

Stores photo or file evidence submitted as part of a dispute. This is a **weak entity** , evidence cannot exist without a parent dispute.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| evidence_id | SERIAL | PK | Unique identifier for each evidence record. |
| dispute_id | INT | FK → Disputes(dispute_id), NOT NULL, ON DELETE CASCADE | The dispute this evidence supports. |
| uploaded_by | INT | FK → Users(user_id), NOT NULL | The user who uploaded the evidence. |
| file_url | TEXT | NOT NULL | Storage URL or path of the evidence file. |
| file_type | VARCHAR(10) | NOT NULL, CHECK constraint | One of: `image`, `pdf`. |
| uploaded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the evidence was uploaded. |

**Notes:**
- Buyers and sellers both agree at registration that buyers may photograph items at the meetup for listing-accuracy verification. This right is baked into platform terms.
- A complaint filed without photos, where no refusal was claimed, cannot be assisted by the platform.

---

## 14. Reviews

Captures post-transaction feedback left by buyers and sellers. Feeds into the platform's reputation scoring system.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| review_id | SERIAL | PK | Unique identifier for each review. |
| transaction_id | INT | FK → Transactions(transaction_id), NOT NULL | The completed transaction this review relates to. |
| reviewer_id | INT | FK → Users(user_id), NOT NULL | The user writing the review. |
| reviewee_id | INT | FK → Users(user_id), NOT NULL | The user being reviewed. |
| rating | INT | NOT NULL, CHECK (1–5) | Numeric rating from 1 (poor) to 5 (excellent). |
| comment | TEXT | | Optional written feedback. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the review was submitted. |

**Notes:**
- Both the buyer and seller can leave a review per transaction (two rows per transaction).
- `reviewer_id ≠ reviewee_id` should be enforced.
- Ratings contribute to the `reputation_score` on the `Users` table and may be used as signals to identify potentially abusive accounts.

---

## 15. Wishlist_items

Allows any verified user to save listings they are interested in for later.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| wishlist_id | SERIAL | PK | Unique identifier for each wishlist entry. |
| user_id | INT | FK → Users(user_id), NOT NULL | The user who added the listing to their wishlist. |
| listing_id | INT | FK → Listings(listing_id), NOT NULL | The listing that was saved. |
| added_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the item was added to the wishlist. |

**Notes:**
- Composite unique constraint on `(user_id, listing_id)` prevents duplicate wishlist entries.

---

## 16. Notifications

Delivers in-app alerts to users for a wide range of system events, including listing status changes, reservation updates, meetup reminders, verification outcomes, and chat activity.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| notification_id | SERIAL | PK | Unique identifier for each notification. |
| user_id | INT | FK → Users(user_id), NOT NULL | The user receiving the notification. |
| type | VARCHAR(30) | NOT NULL, CHECK constraint | One of: `listing_status`, `reservation_update`, `meetup_reminder`, `chat`, `dispute`, `verification`. |
| reference_id | INT | | Polymorphic ID of the related entity (e.g. listing_id, reservation_id). |
| reference_type | VARCHAR(30) | | The entity type the `reference_id` points to (e.g. `Listing`, `Reservation`). |
| message | TEXT | NOT NULL | The notification message content. |
| is_read | BOOLEAN | DEFAULT FALSE | Whether the user has read the notification. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the notification was created. |

**Notes:**
- Notifications are triggered at every state change: listing going live, being held, being rejected, reservation expiry, meetup approaching, etc.
- The `reference_type` + `reference_id` polymorphic pattern allows one table to reference any entity without separate foreign keys for each.

---

## 17. Audit_logs

An append-only log of all significant system and user actions. Used for security, admin oversight, and debugging. Not modelled as a formal EER relationship to other entities , instead uses a polymorphic `entity_type` + `entity_id` pattern to reference any table.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| log_id | SERIAL | PK | Unique identifier for each log entry. |
| actor_id | INT | FK → Users(user_id), nullable | The user who performed the action. NULL for system-triggered events. |
| action | VARCHAR(100) | NOT NULL | Description of the action (e.g. `listing_approved`, `user_verified`, `dispute_resolved`). |
| entity_type | VARCHAR(50) | NOT NULL | The type of entity affected (e.g. `Listing`, `User`, `Dispute`). |
| entity_id | INT | NOT NULL | The primary key of the affected record. |
| old_value | JSONB | | Snapshot of the record's state before the action (nullable). |
| new_value | JSONB | | Snapshot of the record's state after the action (nullable). |
| ip_address | VARCHAR(50) | | IP address of the actor at the time of the action. |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when the action was logged. |

**Notes:**
- This table is append-only , no rows should be updated or deleted.
- `entity_type` + `entity_id` together function as a polymorphic foreign key, allowing the audit log to reference every table without drawing a relationship line to each one in the EER.
- Covers both user-initiated actions (admin decisions, listing submissions) and automated system events (AI scoring, reservation expiry).


---


## 18. Student_profiles

Stores specific details about university students.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| std_id | SERIAL | PK | Unique identifier for each student. |
| user_id | SERIAL | FK → User(user_id), NOT NULL | The students register/login details |
| university_id | INT | FK → University(university_id), NOT NULL | The university the student attends. |
| course_id | INT | FK → Course(course_id), NOT NULL | The student's enrolled degree/course. |
| year_of_study | INT | NOT NULL, CHECK (1–6) | The student's current year of study. |
| verification_status | VARCHAR(20) | NOT NULL, CHECK constraint | One of: `pending`, `partial`, `verified`, `rejected`. |
| reputation_score | NUMERIC(4,2) | DEFAULT 0 | Aggregated trust score derived from reviews and behaviour (viadisputes).It is trigger maintained and should not be written to directly. |

**Notes:**
- `partial` verification status grants limited access: buyers can browse listings only; sellers' listings are saved as drafts.
- `verified` status grants full platform access.
- `reputation_score` is a cached field automatically updated via triggers on the `Reviews` and `Disputes` tables.


---


## 19. Admin_profiles

Stores admins details.

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| admin_id | SERIAL | PK | Unique identifier for each admin. |
| user_id | SERIAL | FK → User(user_id), NOT NULL | The admins register/login details. |
| department | VARCHAR(100) | | The admin's department. |
| access_level | VARCHAR(20) | NOT NULL | One of : `standard`, `senior`. |


---