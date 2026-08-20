// using System;
// using System.Collection.Generic;
using Modules.Reservation.Models;

namespace Modules.Listing.Models
{
    public class ListingSnapshot
    {
        public Guid ReservationId{get;set;}
        public Guid ListingId{get;set;}
        public string Title {get;set;}=null!;
        public decimal Price {get;set;}
        public string Condition{ get;set;}
        public List<string>? PhotoRefs{get;set;}
        public List<string>? CourseTags{get;set;}
        public DateTime CapturedAt{get;set;}
        public Reservation reservation {get;set;}=null!;
        public Listing listing {get;set;}=null!;
    }
}