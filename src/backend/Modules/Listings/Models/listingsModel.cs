/*
    CREATE TABLE Listings (
    listing_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
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
        CONSTRAINT chk_listing_status CHECK ( listing_status IN ('draft', 'pending', 'live', 'low_visibility', 'rejected', 'sold', 'removed')),
    ai_risk_score NUMERIC(5,2),
    ai_risk_level NVARCHAR(10) CONSTRAINT chk_listing_risk CHECK (ai_risk_level IN ('low', 'medium', 'high')),
    visibility_score INT NOT NULL DEFAULT 100,
    is_bundle BIT NOT NULL DEFAULT 0,
    rejection_reason NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    
);
*/
using Modules.Listings.Model;

namespace Modules.Listings.Model
{
    public class Listings
    {
        public Guid Listing_id{get;set;}
        public Guid Seller_id{get;set;}
        public int Course_id{get;set;}
        public string Title{get;set;}
        public string Description{get;set;}
        public NUMERIC Price{get;set;}
        public string Condition{get;set;}
        public string Listing_status{get;set;}
        public NUMERIC Ai_risk_score{get;set;}
        public string Ai_risk_level{get;set;}
        public int Visibility_score{get;set;}
        public bool Is_bundle{get;set;}
        public string Rejection_reason{get;set;}
        public DateTime Created_at{get;set;}
        public DateTime Updated_at{get;set;}
    }
}