using Modules.Identity.Models;
using Modules.Listings.Models;
using Modules.Reservations.Models;

namespace Modules.Chat.Models;

public class ChatMessage
{
    public int MessageId { get; set; }
    public Guid ReservationId { get; set; }

    public Guid? SenderId { get; set; } // this will be null for system messages
    public string MessageType { get; set; } = "text";

    public string Content { get; set; } = string.Empty;
    public string? Payload { get; set; } // this is only for the meeting proposals/responses

    public DateTime SentAt { get; set; }
    public DateTime? ReadAt { get; set; }

    public Reservation Reservation { get; set; } = null!;
    public User? Sender { get; set; } = null!;
    public string? ClientKey { get; set; }
}
