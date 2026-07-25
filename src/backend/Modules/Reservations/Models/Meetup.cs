namespace Modules.Reservations.Models;

public class Meetup
{
    public int MeetupId { get; set; }
    public Guid ReservationId { get; set; }

    public string AgreedLocationName { get; set; } = string.Empty;

    public decimal AgreedLatitude { get; set; }
    public decimal AgreedLongitude { get; set; }

    public DateTime AgreedTime { get; set; }

    public bool BuyerCheckedIn { get; set; }
    public DateTime? BuyerCheckinTime { get; set; }
    public decimal? BuyerCheckinLatitude { get; set; }
    public decimal? BuyerCheckinLongitude { get; set; }
    public DateTime CheckinWindowClosesAt { get; set; }

    public bool SellerCheckedIn { get; set; }
    public DateTime? SellerCheckinTime { get; set; }
    public decimal? SellerCheckinLatitude { get; set; }
    public decimal? SellerCheckinLongitude { get; set; }

    public string Status { get; set; } = "scheduled";
    public Reservation Reservation { get; set; } = null!;

    public DateTime? BuyerCheckedInAt { get; set; }
    public DateTime? SellerCheckedInAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
