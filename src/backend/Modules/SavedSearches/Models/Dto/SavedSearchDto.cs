using System;

namespace Modules.SavedSearches.Models.Dto;

public class SavedSearchDto
{
    public Guid SearchId { get; set; }
    public string Query { get; set; } = null!;
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public Guid? CourseId { get; set; }
    public bool IsActive { get; set; }
}
