--- User and Identity Management
--- 1. University
CREATE TABLE University(
    university_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email_domain VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
);

--- 2. Course/module 
CREATE TABLE Course(
    course_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    university_id INT NOT NULL REFERENCES University(university_id),
    course_code VARCHAR(30) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100)
);

--- 3. Users
CREATE TABLE Users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CONSTRAINT chk_user_role CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

--- 4. Student Profile
CREATE TABLE Student_profiles(
    student_id UUID PRIMARY KEY REFERENCES Users(user_id),
    student_number VARCHAR(50),
    university_id INT NOT NULL REFERENCES University(university_id),
    course_id INT NULL REFERENCES Course(course_id),
    year_of_study INT NOT NULL CONSTRAINT chk_student_year CHECK(
        year_of_study BETWEEN 1
        AND 8
    ),
    verification_status VARCHAR(20) NOT NULL CONSTRAINT chk_student_verification CHECK (
        verification_status IN ('pending', 'partial', 'verified', 'rejected')
    ),
    reputation_score NUMERIC(4, 2) DEFAULT 0
);

---5. Admin Profiles
CREATE TABLE Admin_profiles(
    admin_id UUID PRIMARY KEY REFERENCES Users(user_id),
    university_id INT NOT NULL REFERENCES University(university_id)
);

--- 6. Verification Requests
CREATE TABLE Verification_requests(
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id),
    attempt_number INT NOT NULL DEFAULT 0,
    total_attempt_count INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    otp_code_hash VARCHAR(255),
    otp_verified_at TIMESTAMPTZ,
    otp_sent_at TIMESTAMPTZ,
    otp_resend_count INT NOT NULL DEFAULT 0,
    otp_expires_at TIMESTAMPTZ NOT NULL,
    por_file_path TEXT,
    ai_confidence_score NUMERIC(5, 2),
    ai_decision VARCHAR(20) CONSTRAINT chk_vr_ai_decision CHECK (ai_decision IN ('auto_approved', 'escalated')),
    admin_id UUID REFERENCES Users(user_id),
    admin_decision VARCHAR(20) CONSTRAINT chk_vr_admin_decision CHECK (
        admin_decision IN ('approved', 'rejected', 'resubmission')
    ),
    rejection_reason TEXT,
    status VARCHAR(20) NOT NULL CONSTRAINT chk_vr_status CHECK (
        status IN (
            'otp_pending',
            'por_pending',
            'under_review',
            'approved',
            'rejected'
        )
    ),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    decided_at TIMESTAMPTZ,
);

---7. Listings
CREATE TABLE Listings (
    listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CONSTRAINT chk_listing_price CHECK (price > 0),
    condition VARCHAR(5) NOT NULL CONSTRAINT chk_listing_condition CHECK(
        condition IN ('new', 'good', 'fair', 'poor')
    ),
    course_id INT NULL,
    metadata JSONB NULL,
    listing_status VARCHAR(20) NOT NULL CONSTRAINT chk_listing_status CHECK (
        listing_status IN (
            'draft',
            'pending',
            'live',
            'reserved'
            'low_visibility',
            'rejected',
            'sold',
            'removed'
        )
    ),
    -- AI Mod (nullable; not implemented in MVP)
    ai_risk_score NUMERIC(5, 2) NULL,
    ai_risk_level VARCHAR(10) NULL CONSTRAINT chk_listing_risk CHECK (ai_risk_level IN ('low', 'medium', 'high')),
    visibility_score INT NULL DEFAULT 100,
    is_bundle BOOLEAN NULL DEFAULT FALSE,
    rejection_reason TEXT NULL,
    view_count INT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_listings_category FOREIGN KEY (category_id) REFERENCES Listing_category(category_id),
    CONSTRAINT fk_listings_users FOREIGN KEY (seller_id) REFERENCES Users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_listings_course FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE NO ACTION
);

-- 7.1 Listing category
CREATE TABLE Listing_category(
    category_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    -- root_category_id INT NULL REFERENCES Listing_category(category_id), IN CASE WE WANT TO HAVE A HIERARCHY OF CATEGORIES IN THE FUTURE
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7.2 Book details
CREATE TABLE Book_details(
    listing_id UUID PRIMARY KEY,
    isbn VARCHAR(13) NULL CONSTRAINT chk_isbn_validity CHECK (
        isbn IS NULL
        OR length(isbn) IN (10, 13)
    ),
    author VARCHAR(120) NULL,
    edition VARCHAR(50) NULL,
    CONSTRAINT fk_book_details_listing FOREIGN KEY (listing_id) REFERENCES Listings(listing_id) ON DELETE CASCADE
);

INSERT INTO
    Listing_category (name)
VALUES
    ('book'),
    ('electronics'),
    ('stationery'),
    ('clothing'),
    ('furniture'),
    ('other');

-- 8. Listing Images
CREATE TABLE Listing_images(
    image_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    listing_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_listing_images_listings FOREIGN KEY (listing_id) REFERENCES Listings(listing_id) ON DELETE CASCADE
);

--9. Reservations
CREATE TABLE Reservations(
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES Users(user_id),
    seller_id UUID NOT NULL REFERENCES Users(user_id),
    is_bundle BOOLEAN NOT NULL DEFAULT FALSE,
    reservation_status VARCHAR(20) NOT NULL CONSTRAINT chk_res_status CHECK (
        reservation_status IN ('active', 'expired', 'cancelled', 'completed')
    ),
    seller_acknowledged_at TIMESTAMPTZ,
    buyer_responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Reservation Listings
CREATE TABLE Reservation_listings(
    reservation_id UUID NOT NULL REFERENCES Reservations(reservation_id),
    listing_id UUID NOT NULL REFERENCES Listings(listing_id),
    CONSTRAINT pk_reservation_listings PRIMARY KEY (reservation_id, listing_id)
);

CREATE TABLE Meetups (
    meetup_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES Reservations(reservation_id),
    agreed_location_name VARCHAR(150) NOT NULL,
    agreed_latitude NUMERIC(9, 6) NOT NULL,
    agreed_longitude NUMERIC(9, 6) NOT NULL,
    agreed_time TIMESTAMPTZ NOT NULL,
    buyer_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    buyer_checkin_time TIMESTAMPTZ,
    buyer_checkin_latitude NUMERIC(9, 6),
    buyer_checkin_longitude NUMERIC(9, 6),
    seller_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    seller_checkin_time TIMESTAMPTZ,
    seller_checkin_latitude NUMERIC(9, 6),
    seller_checkin_longitude NUMERIC(9, 6),
    checkin_window_closes_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT chk_meeting_status CHECK (
        status IN (
            'scheduled',
            'completed',
            'no_show_buyer',
            'no_show_seller'
        )
    )
);

-- 12. Transactions
CREATE TABLE Transactions(
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meetup_id INT NOT NULL REFERENCES Meetups(meetup_id),
    buyer_id UUID NOT NULL REFERENCES Users(user_id),
    seller_id UUID NOT NULL REFERENCES Users(user_id),
    amount NUMERIC(10, 2) NOT NULL CONSTRAINT chk_txn_amount CHECK (amount > 0),
    ozow_transaction_id VARCHAR(100) UNIQUE,
    payment_status VARCHAR(20) NOT NULL CONSTRAINT chk_payment_status CHECK (
        payment_status IN ('pending', 'completed', 'failed', 'cancelled')
    ),
    pin_hash TEXT,
    pin_entered_at TIMESTAMPTZ,
    pin_status VARCHAR(10) NOT NULL DEFAULT 'pending' CONSTRAINT chk_txn_pin_status CHECK (pin_status IN ('pending', 'confirmed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--13. Chat messages
CREATE TABLE Chat_messages(
    message_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES Reservations(reservation_id),
    sender_id UUID NULL REFERENCES Users(user_id),
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CONSTRAINT chk_message_type CHECK (
        message_type IN (
            'text',
            'system',
            'meetup_proposal',
            'meetup_response'
        )
    ),
    content TEXT NOT NULL,
    payload JSONB NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    CONSTRAINT chk_system_sender CHECK (
        (
            message_type = 'system'
            AND sender_id IS NULL
        )
        OR (
            message_type <> 'system'
            AND sender_id IS NOT NULL
        )
    ),
    CONSTRAINT chk_payload_type CHECK (
        (
            (
                message_type IN ('meetup_proposal', 'meetup_response')
                AND payload IS NOT NULL
            )
            OR(
                message_type IN ('text', 'system')
                AND payload IS NULL
            )
        )
    )
);

--14. Disputes 
CREATE TABLE Disputes(
    dispute_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raised_by UUID NOT NULL REFERENCES Users(user_id),
    against_user UUID NOT NULL REFERENCES Users(user_id),
    transaction_id UUID REFERENCES Transactions(transaction_id),
    listing_id UUID NOT NULL REFERENCES Listings(listing_id),
    dispute_type VARCHAR(30) NOT NULL CONSTRAINT chk_dispute_type CHECK (
        dispute_type IN ('listing_quality', 'no_show', 'false_listing')
    ),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT chk_dispute_status CHECK (
        status IN ('open', 'under_review', 'resolved', 'closed')
    ),
    assigned_admin_id UUID REFERENCES Users(user_id),
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

--15. Dispute evidence
CREATE TABLE Dispute_Evidence(
    evidence_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dispute_id UUID NOT NULL REFERENCES Disputes(dispute_id),
    uploaded_by UUID NOT NULL REFERENCES Users(user_id),
    file_url TEXT NOT NULL,
    file_type VARCHAR(10) NOT NULL CONSTRAINT chk_evidence_type CHECK (file_type IN ('pdf')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--16. Reviews
CREATE TABLE Reviews(
    review_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES Transactions(transaction_id),
    reviewer_id UUID NOT NULL REFERENCES Users(user_id),
    reviewee_id UUID NOT NULL REFERENCES Users(user_id),
    rating INT CONSTRAINT chk_rating CHECK (
        rating BETWEEN 1
        AND 5
    ),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT review_per_transaction UNIQUE (transaction_id, reviewer_id),
    CONSTRAINT chk_review_self CHECK (reviewer_id <> reviewee_id)
);

-- 17. Wishlist 
CREATE TABLE Wishlist_Items(
    wishlist_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES Student_profiles(student_id),
    listing_id UUID NOT NULL REFERENCES Listings(listing_id),
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT wishlist_entry UNIQUE (student_id, listing_id)
);

--18. Notifications
CREATE TABLE Notifications(
    notification_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES Users(user_id),
    type VARCHAR(30) NOT NULL CONSTRAINT chk_notif_type CHECK (
        type IN (
            'listing_status',
            'reservation_status',
            'meetup_reminder',
            'chat',
            'dispute',
            'verification'
        )
    ),
    --reference_id INT, 
    --reference_type VARCHAR(30),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--19.. Audit Logs
CREATE TABLE Audit_logs(
    log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id UUID REFERENCES Users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
--Users 
CREATE INDEX ix_users_email ON Users(email);

CREATE INDEX ix_users_role ON Users(role);

--Students
CREATE INDEX ix_student_university ON Student_profiles(university_id);

CREATE INDEX ix_student_course ON Student_profiles(course_id);

CREATE INDEX ix_student_status ON Student_profiles(verification_status);

--VR'S 
CREATE UNIQUE INDEX uix_vr_current ON Verification_requests (user_id)
WHERE
    is_current = TRUE;

CREATE INDEX ix_vr_user ON Verification_requests(user_id);

CREATE INDEX ix_vr_status ON Verification_requests(status);

--Listings 
CREATE INDEX ix_listings_seller ON Listings(seller_id);

CREATE INDEX ix_listings_course ON Listings(course_id);

CREATE INDEX ix_listing_images_listing ON Listing_images(listing_id);

CREATE INDEX ix_listings_category ON Listings(category_id);

CREATE INDEX ix_listings_course_browse ON Listings (course_id, listing_status, created_at DESC) INCLUDE (title, price, seller_id, category_id)
WHERE
    listing_status = 'live';

CREATE INDEX ix_listings_feed ON Listings (
    listing_status,
    visibility_score DESC,
    created_at DESC
)
WHERE
    listing_status = 'live';

CREATE INDEX ix_listings_category_browse ON Listings (category_id, listing_status, created_at DESC) INCLUDE (title, price, seller_id)
WHERE
    listing_status = 'live';

--Reservations
CREATE INDEX ix_res_buyer ON Reservations(buyer_id);

CREATE INDEX ix_res_seller ON Reservations(seller_id);

CREATE INDEX ix_res_status ON Reservations(reservation_status);

CREATE INDEX ix_res_expires ON Reservations(expires_at)
WHERE
    reservation_status = 'active';

-- only activated when the reservation is active
-- chat messages
CREATE INDEX ix_chat_reservation ON Chat_messages(reservation_id, sent_at);

CREATE INDEX ix_chat_unread ON Chat_messages(reservation_id, read_at)
WHERE
    read_at IS NULL;

-- Transactions 
CREATE INDEX ix_txn_meetup ON Transactions (meetup_id);

CREATE INDEX ix_txn_buyer ON Transactions(buyer_id);

CREATE INDEX ix_txn_seller ON Transactions(seller_id);

CREATE INDEX ix_txn_status ON Transactions(payment_status);

-- Disputes 
CREATE INDEX ix_dispute_raised_by ON Disputes(raised_by);

CREATE INDEX ix_dispute_against ON Disputes(against_user);

CREATE INDEX ix_dispute_status ON Disputes(status);

--Reviews 
CREATE INDEX ix_review_reviewee ON Reviews(reviewee_id);

-- Notifications
CREATE INDEX ix_notif_user_unread ON Notifications (user_id, is_read)
WHERE
    is_read = FALSE;

--Audit logs
CREATE INDEX ix_audit_entity ON Audit_logs(entity_type, entity_id);

CREATE INDEX ix_audit_actor ON Audit_logs(actor_id);

CREATE INDEX ix_audit_created ON Audit_logs(created_at DESC);

-- Triggers
-- for user updating info
CREATE
OR REPLACE FUNCTION fn_set_updated_at() RETURNS trigger AS $ $ BEGIN NEW.updated_at := now();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at BEFORE
UPDATE
    ON Users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

--listing updates 
CREATE TRIGGER tr_listings_updated_at BEFORE
UPDATE
    ON Listings FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- recalculating the rep score after a review
CREATE
OR REPLACE FUNCTION fn_reputation_on_review() RETURNS trigger AS $ $ BEGIN
UPDATE
    Student_profiles
SET
    reputation_score = (
        SELECT
            AVG(r.rating :: NUMERIC(4, 2))
        FROM
            Reviews r
        WHERE
            r.reviewee_id = NEW.reviewee_id
    )
WHERE
    student_id = NEW.reviewee_id;

RETURN NULL;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER tr_reputation_on_review
AFTER
INSERT
    ON Reviews FOR EACH ROW EXECUTE FUNCTION fn_reputation_on_review();

-- verification resubmission
-- when a new verification is created, invalidate all the previous ones
CREATE
OR REPLACE FUNCTION fn_verification_set_current() RETURNS trigger AS $ $ BEGIN
UPDATE
    Verification_requests
SET
    is_current = FALSE
WHERE
    user_id = NEW.user_id
    AND verification_id <> NEW.verification_id;

RETURN NULL;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER tr_verification_set_current
AFTER
INSERT
    ON Verification_requests FOR EACH ROW EXECUTE FUNCTION fn_verification_set_current();

-- audit log for listing status update
CREATE
OR REPLACE FUNCTION fn_audit_listing_status() RETURNS trigger AS $ $ BEGIN IF NEW.listing_status <> OLD.listing_status THEN
INSERT INTO
    Audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        old_value,
        new_value
    )
VALUES
    (
        NEW.seller_id,
        'listing_status_changed',
        'Listing',
        NEW.listing_id :: TEXT,
        OLD.listing_status,
        NEW.listing_status
    );

END IF;

RETURN NULL;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER tr_audit_listing_status
AFTER
UPDATE
    ON Listings FOR EACH ROW EXECUTE FUNCTION fn_audit_listing_status();

-- audit for verification decisions
CREATE
OR REPLACE FUNCTION fn_audit_verification_decision() RETURNS trigger AS $ $ BEGIN IF NEW.status <> OLD.status THEN
INSERT INTO
    Audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        old_value,
        new_value
    )
VALUES
    (
        NEW.admin_id,
        'verification_decision',
        'Verification_request',
        NEW.verification_id :: TEXT,
        OLD.status,
        NEW.status
    );

END IF;

RETURN NULL;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER tr_audit_verification_decision
AFTER
UPDATE
    ON Verification_requests FOR EACH ROW EXECUTE FUNCTION fn_audit_verification_decision();