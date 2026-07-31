using Modules.Chat.Models;
using Modules.Identity.Models;

namespace Modules.Reservations.Models;

public class Reservation
{
    public Guid ReservationId { get; set; }
    public Guid BuyerId { get; set; }
    public Guid SellerId { get; set; }
    public bool IsBundle { get; set; }

    public string ReservationStatus { get; set; } = "active";

    public DateTime? SellerAcknowledgedAt { get; set; }
    public DateTime? BuyerRespondedAt { get; set; }

    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? TwoHourWarningSentAt { get; set; }
    public User? Buyer { get; set; }
    public User? Seller { get; set; }
    public ICollection<ReservationListing> ReservationListings { get; set; } =
        new List<ReservationListing>();

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    public DateTime? MeetupConfirmedAt { get; set; }
    public ICollection<Meetup> Meetups { get; set; } = new List<Meetup>();

    public DateTime? HandoverConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
