using System;

namespace Modules.SavedSearches.Models
{
    public class SavedSearch
    {
        public Guid SearchId { get; set; }
        public Guid BuyerId { get; set; }
        public string Query { get; set; }
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public Guid? CourseId { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
    }
}
