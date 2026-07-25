namespace Modules.SharedKernel;

public enum ReservationStatusMessage{
    Allowed,
    ReservationCancelled,
    BuyerWaitingForSellerAck,
}
public interface IReservationMembership
{
    Task<bool> IsPartyToAsync(Guid reservationId, Guid userId, CancellationToken ct = default);
    Task<ReservationStatusMessage> CheckMessagingAllowedAsync(Guid reservationId,Guid senderId, CancellationToken);

}