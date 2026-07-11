namespace Modules.SharedKernel;

public interface IReservationMembership
{
    Task<bool> IsPartyToAsync(Guid reservationId, Guid userId, CancellationToken ct = default);
}