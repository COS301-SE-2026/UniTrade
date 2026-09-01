using System;

namespace Modules.SavedSearches.Models.Dto;


public class CreateSavedSearchDto
{
    public string Query {get;set;}
    public int? CategoryId {get;set;}
    public decimal? MinPrice {get;set;}
    public decimal? MaxPrice {get;set;}
    public Guid? CourseId {get;set;}
}