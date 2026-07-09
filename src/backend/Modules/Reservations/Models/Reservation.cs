using Modules.Identity.Models;
using Modules.Chat.Models;
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

    public User? Buyer { get; set; }
    public User? Seller { get; set; }

    public ICollection<ReservationListing> ReservationListings { get; set; } =
        new List<ReservationListing>();

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
