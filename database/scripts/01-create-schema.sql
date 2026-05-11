IF DB_ID('$(DB_NAME)') IS NULL
    CREATE DATABASE [$(DB_NAME)];
GO

USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = '$(USER_ID)')
BEGIN
    CREATE LOGIN [$(USER_ID)]
    WITH PASSWORD = '$(APP_USER_PASSWORD)',
        CHECK_POLICY = ON,
        CHECK_EXPIRATION = OFF;
END
GO



USE [$(DB_NAME)];
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '$(USER_ID)')
BEGIN
    CREATE USER [$(USER_ID)] FOR LOGIN [$(USER_ID)];
  
END
GO

ALTER ROLE db_datareader ADD MEMBER [$(USER_ID)];
ALTER ROLE db_datawriter ADD MEMBER [$(USER_ID)];

GO

--- User and Identity Management

--- 1. University
CREATE TABLE University(
    university_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL, 
    email_domain NVARCHAR(100) NOT NULL UNIQUE,
    -- city NVARCHAR(100) NOT NULL,
    is_active BIT DEFAULT 1
)

--- 2. Course/module 

CREATE TABLE Course(
    course_id INT IDENTITY(1,1) PRIMARY KEY,
    university_id INT NOT NULL REFERENCES University(university_id),
    course_id NVARCHAR(30) NOT NULL UNIQUE,
    course_name NVARCHAR(100) NOT NULL,
    faculty NVARCHAR(100)
);

--- 3. Users


CREATE TABLE Users(
    user_id UNIQUEIDENTIFIER IDENTITY(1,1) PRIMARY KEY,
    first_name NVARCHAR(50) NOT NULL,
    last_name NVARCHAR(50) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(MAX) NOT NULL,
    role NVARCHAR(10) NOT NULL 
                    CONSTRAINT chk_user_role CHECK (role IN ('student', 'admin')),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
);

--- 4. Student Profile
CREATE TABLE Student_profiles(
    student_id INT PRIMARY REFERENCES Users(user_id),
    university_id INT NOT NULL REFERENCES University(university_id),
    course_id NVARCHAR(30) NOT NULL REFERENCES Course(course_id),
    year_of_study INT NOT NULL
                        CONSTRAINT chk_student_year CHECK(  year_of_study BETWEEN 1 AND 8),
    verfication_status NVARCHAR(20) NOT NULL 
                        CONSTRAINT chk_student_verfication CHECK (
                            verfication_status IN ('pending', 'partial', 'verified', 'rejected')
                        ),
    reputation_score NUMERIC(4, 2) DEFAULT 0
);

---5. Admin Profiles
CREATE TABLE Admin_profiles(
    admin_id UNIQUEIDENTIFIER PRIMARY KEY REFERENCES Users(user_id),
    university_id INT NOT NULL REFERENCES University(university_id)
);

--- 6. Verification Requests

CREATE TABLE Verification_requests(
    verification_id UNIQUEIDENTIFIER IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    attempt_number INT NOT NULL DEFAULT 1,
    is_current BIT NOT NULL DEFAULT 1,
    otp_code_hash NVARCHAR(10),
    otp_verified_at DATETIME2, 
    otp_expires_at DATETIME2 NOT NULL,
    por_file_path NVARCHAR(MAX),
    ai_confidence_score NUMERIC(5,2),
    ai_decision NVARCHAR(20)
                CONSTRAINT chk_vr_ai_decision CHECK (ai_decision IN ('auto_approved', 'escalated')),
    admin_id UNIQUEIDENTIFIER REFERENCES Users(user_id),
    admin_decision NVARCHAR(20)
        CONSTRAINT chk_vr_admin_decision CHECK (admin_decision IN ('approved', 'rejected', 'resubmission')),
    rejection_reason NVARCHAR(MAX),
    status NVARCHAR(20) NOT NULL 
            CONSTRAINT chk_vr_status CHECK (status IN ('otp_pending', 'por_pending', 'under_review', 'approved', 'rejected')),
    submitted_at DATETIME2 DEFAULT SYSDATETIME(),
    decided_at DATETIME2,

    CONSTRAINT vr_user_attempt UNIQUE (user_id, attempt_number)
);


---7. Listings

CREATE TABLE Listings (
    listing_id UNIQUEIDENTIFIER IDENTITY(1,1) PRIMARY KEY,
    seller_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    course_id INT NOT NULL REFERENCES Course(course_id),
    title NVARCHAR(150) NOT NULL ,
    description NVARCHAR(MAX) NOT NULL,
    price NUMERIC(10, 2) NOT NULL 
                CONSTRAINT chk_listing_price CHECK (price>0),
    
    condition NVARCHAR(5) NOT NULL 
        CONSTRAINT chk_listing_condition CHECK(
            condition IN ('new', 'good', 'fair','poor')
        ),
    listing_status NVARCHAR(20) NOT NULL 
        CONSTRAINT chk_listing_status CHECK ( listing_status IN ('draft', 'pending', 'live', 'low_visivility', 'rejected', 'sold', 'removed')),
    ai_risk_score NUMERIC(5,2),
    ai_risk_level NVARCHAR(10) CONSTRAINT chk_lisitng_risk CHECK (ai_risk_level IN ('draft', 'pending_review', 'live', 'low_visibilty', 'rejected', 'sold')),
    visibilty_score INT NOT NULL DEFAULT 100,
    is_bundle BIT NOT NULL DEFAULT 0,
    rejection_reason NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    
);

-- 8. Listing Images
CREATE TABLE Listing_images(
    image_id INT IDENTITY(1,1) PRIMARY KEY, 
    listing_id UNIQUEIDENTIFIER NOT NULL REFERENCES Listings(listing_id),
    image_url NVARCHAR(MAX) NOT NULL, 
    is_primary BIT NOT NULL DEFAULT 0,
    uploaded_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

--9. Reservations

CREATE TABLE Reservations(
    reservation_id UNIQUEIDENTIFIER IDENTITY(1,1) PRIMARY KEY,
    buyer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    seller_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    is_bundle BIT NOT NULL DEFAULT 0,
    reservation_status NVARCHAR(20) NOT NULL    
        CONSTRAINT chk_res_status CHECK (reservation_status IN ('active', 'expired', 'cancelled', 'completed')),
    seller_acknowledged_at DATETIME2,
    buyer_responded_at DATETIME2,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL
);

-- 10. eservation Listings
CREATE TABLE Reservation_listings(
    reservation_id UNIQUEIDENTIFIER NOT NULL REFERENCES Reservations(reservation_id),
    listing_id INT NOT NULL REFERENCES Listings(listing_id),

    CONSTRAINT pk_reservation_listings PRIMARY KEY (reservation_id, listing_id)
);

CREATE TABLE Meetups (
    meetup_id INT IDENTITY(1,1) PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES Reservations(reservation_id),
    agreed_location_name NVARCHAR(150) NOT NULL, 
    agreed_latitude NUMERIC(9, 6) NOT NULL,
    agreed_longitude NUMERIC(9, 6) NOT NULL,
    agreed_time DATETIME2 NOT NULL,

    buyer_checked_in BIT NOT NULL DEFAULT 0,
    buyer_checkin_time DATETIME2,
    buyer_checkin_latitude  NUMERIC(9, 6),
    buyer_checkin_longitude  NUMERIC(9, 6),

    seller_checked_in BIT NOT NULL DEFAULT 0,
    seller_checkin_time DATETIME2,
    seller_checkin_latitude  NUMERIC(9, 6),
    seller_checkin_longitude  NUMERIC(9, 6),


    checkin_window_closes_at DATETIME2 NOT NULL, 
    status NVARCHAR(20) NOT NULL
        CONSTRAINT chk_eeting_status CHECK (
            status IN ('scheduled', 'completed', 'no_show_buyer', 'no_show_seller')
        )
);


-- 12. Transactions
CREATE TABLE Transactions(
    transaction_id UNIQUEIDENTIFIER IDENTITY(1,1) PRIMARY KEY, 
    meetup_id INT NOT NULL REFERENCES Meetups(meetup_id), 
    buyer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    seller_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    amount NUMERIC(10, 2) NOT NULL CONSTRAINT chk_txn_amount CHECK (amount>0),
    ozow_transaction_id NVARCHAR(100) UNIQUE,
    payment_status NVARCHAR(20) NOT NULL 
        CONSTRAINT chk_payment_status CHECK (
            payment_status IN ('pending', 'completed', 'failed', 'cancelled')
        ),
    
    pin_hash NVARCHAR(MAX),
    pin_entered_at DATETIME2,
    pin_status NVARCHAR(10) NOT NULL DEFAULT 'pending'
        CONSTRAINT chk_txn_pin_status CHECK (pin_status IN ('pending', 'confirmed')),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()

);

--13. Chat messages

CREATE TABLE Chat_messages(
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    reservation_id UNIQUEIDENTIFIER NOT NULL REFERENCES Reservations(reservation_id),
    sender_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    content NVARCHAR(MAX) NOT NULL,
    is_automated BIT NOT NULL DEFAULT 0,
    sent_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    read_at DATETIME2
);

--14. Disputes 
CREATE TABLE Disputes(
    dispute_id UNIQUEIDENTIFIER IDENTITY(1,1) PRIMARY KEY,
    raised_by UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    against_user UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(user_id),
    transaction_id UNIQUEIDENTIFIER  REFERENCES Transactions(transaction_id),
    listing_id UNIQUEIDENTIFIER NOT NULL REFERENCES Listings(listing_id),
    dispute_type NVARCHAR(30) NOT NULL
        CONSTRAINT chk_dispute_type CHECK (dispute_type IN ('listing_quality', 'no_show', 'false_listing')),;
    description NVARCHAR(MAX) NOT NULL, 
    status NVARCHAR(20) NOT NULL 
        CONSTRAINT chk_dispute_status CHECK ( status IN ('open', 'under_review','resolved','closed')),
    assigned_admin_id UNIQUEIDENTIFIER REFERENCES Users(user_id),
    resolution NVARCHAR(MAX),

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    resolved_at DATETIME2 
);

--15. Dispute evidence
CREATE TABLE Dispute_Evidence(
    evidence_id INT IDENTITY(1,1) PRIMARY KEY,
    dispute_id UNIQUEIDENTIFIER NOT NULL REFERENCES Disputes(dispute_id),
    uploaded_by UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    file_url NVARCHAR(MAX) NOT NULL,
    file_type NVARCHAR(10) NOT NULL
        CONSTRAINT chk_evidence_type CHECK (file_type IN ('pdf'))
        ,
    uploaded_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

--16. Reviews
CREATE TABLE Reviews(
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    transaction_id UNIQUEIDENTIFIER NOT NULL REFERENCES Transactions(transaction_id),
    reviewer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    reviewee_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    rating INT 
        CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    comment NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()

    CONSTRAINT review_per_transaction UNIQUE (transaction_id, review_id),
    CONSTRAINT chk_review_self CHECK (review_id <> reviewee_id)
);

-- 17. Wishlist 
CREATE TABLE Wishlst_Items(
    wishlist_id INT IDENTITY(1,1) PRIMARY KEY,
    student_id UNIQUEIDENTIFIER NOT NULL REFERENCES Student_profiles(student_id),
    listing_id UNIQUEIDENTIFIER NOT NULL REFERENCES Listings(listing_id),
    added_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT wishlist_entry UNIQUE (user_id, listing_id)

);

--18. Notifications

CREATE TABLE Notifications(
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES Users(user_id),
    type NVARCHAR(30) NOT NULL 
        CONSTRAINT chk_notif_type CHECK (type IN ('listing_status', 'reservation_status','meetup_reminder', 'chat', 'dispute', 'verification')),
    --reference_id INT, 
    --reference_type NVARCHAR(30),
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

--19.. Audit LOgs
CREATE TABLE Audit_logs(
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    actor_id UNIQUEIDENTIFIER REFERENCES Users(user_id),
    action NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(50) NOT NULL, 
    entity_id INT NOT NULL,
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    ip_address NVARCHAR(50),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);