using System.Net.Mime;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Modules.Reservations.Models;
using Modules.Reservations.Models.Dto;
using Modules.Reservations.Repositories;

namespace Infrastructure.Persistence.Repositories.Reservations;

public class ReservationRepository : IReservationRepository
{
    public async Task<bool> IsUserReservedAsync(string userId, Guid reservationId)
    {
        return true;
    }
}
