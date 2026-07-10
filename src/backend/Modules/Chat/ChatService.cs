namespace Modules.Chat;

public class ChatService: IChatService
{
    private readonly IReservationService _reservationService;
    private readonly AppDbContext _context; ///swap out for repo

    public ChatService(AppDbContext context, IReservationService reservationSerice)
    {
        _context=context;
        _reservationService=reservationSerice;
    }
}