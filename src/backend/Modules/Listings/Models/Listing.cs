using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection.Metadata;

namespace Modules.Listings.Models;

/*
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
    root_category_id INT NULL REFERENCES Listing_category(category_id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

*/

public class Listing
{
    public Guid ListingId { get; set; }
    public Guid SellerId { get; set; }

    public User? Seller{get;set;}
    //introducing category concept (replces listingType)
    public int CategoryId{get;set;}
    public ListingCategory? Category{get;set;}
    
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Condition { get; set; } = "good";

    public int? CourseId { get; set; }
    public Course? Course{get;set;}
    public string? Metadata{get;set;}

    public BookDetails? BookDetails{get;set;}
    
    public string ListingStatus { get; set; } ="";

    // not in MVP
    public decimal? AiRiskScore { get; set; }
    public string? AiRiskLevel { get; set; }
    public int? VisibilityScore { get; set; }
    public bool? isBundle { get; set; }
    public string? RejectionReason { get; set; }
    public int? ViewCount { get; set; }
    //===========

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    [NotMapped]
    //public SellerInfo? Seller { get; set; }
    public ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();

}