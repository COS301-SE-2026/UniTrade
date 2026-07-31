namespace Modules.SharedKernel;

public enum ReservationStatusMessage
{
    Allowed,
    ReservationCancelled,
    BuyerWaitingForSellerAck,
}

public readonly record struct ReservationParties(Guid BuyerId, Guid SellerId);

public interface IReservationMembership
{
    Task<bool> IsPartyToAsync(Guid reservationId, Guid userId, CancellationToken ct = default);
    Task<ReservationStatusMessage> CheckMessagingAllowedAsync(
        Guid reservationId,
        Guid senderId,
        CancellationToken ct = default
    );
    Task<ReservationParties> GetReservationPartiesAsync(
        Guid reservationId,
        CancellationToken ct = default
    );
}
