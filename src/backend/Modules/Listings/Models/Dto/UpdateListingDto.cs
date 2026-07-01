namespace Modules.Listings.Models.Dto;

using System.Text.Json;
using System.Collections.Generic;

public class UpdateListingDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;

    public string CategoryName{get;set;}="";
    public int? CourseId{get;set;}
    public JsonElement? Metadata {get;set;}

    public BookDetailsDto? BookDetails{get;set;}

    public List<int>? RemovedImageIds{get; set;}

    public bool? IsBundle {get;set;}

    public List<CreateListingImageDto> Images { get; set; } 

}
