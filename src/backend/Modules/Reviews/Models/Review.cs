using Modules.Identity.Models;
using Modules.Transactions.Models;

namespace Modules.Reviews.Models;

public class Review
{
    public int ReviewId { get; set; }
    public Guid TransactionId { get; set; }
    public Guid ReviewerId { get; set; }
    public Guid RevieweeId { get; set; }
    public int Rating { get; set; }

    public string Comment { get; set; } = null!;
    public string ReviewType { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public Transaction? Transaction { get; set; } = null!;
}
