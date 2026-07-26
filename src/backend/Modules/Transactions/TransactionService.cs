using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Modules.Identity.Models.Dto;
using Modules.Reservations;
using Modules.Reservations.Repositories;
using Modules.Reservations.StateMachine;
using Modules.Transactions.Models;
using Modules.Transactions.Models.Dto;
using Modules.Transactions.Repositories;

namespace Modules.Transactions;

public class TransactionService : ITransactionsService
{
    private readonly IReservationRepository _reservations;
    private readonly ITransactionRepository _transactions;
    private readonly IBroadCastService _broadcast;
    private readonly IPaymentGateway _paymentGateway;

    public TransactionService(
        IReservationRepository reservations,
        IPaymentGateway paymentGateway,
        IBroadCastService broadcast,
        ITransactionRepository transactions
    )
    {
        _reservations = reservations;
        _transactions = transactions;
        _broadcast = broadcast;
        _paymentGateway=paymentGateway;
    }

    public async Task<TransactionRequestDto> CreatesTransactionReq(
        Guid reservationId,
        Guid buyerId,
        CancellationToken ct = default
    )
    {
        var reservation =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);
        if (reservation.BuyerId != buyerId)
        {
            throw new TransactionException(TransactionErrors.NotBuyer);
        }

        if (reservation.ReservationStatus != ReservationState.Active)
        {
            throw new TransactionException(TransactionErrors.InvalidStatus);
        }

        var listing = reservation.ReservationListings.First().Listing;
        var buyer = reservation.Buyer ?? throw new TransactionException(TransactionErrors.ReservationNotFound);

        return _paymentGateway.CreatePaymentRequest(reservation.ReservationId,listing.Title,listing.Price,buyer.FirstName ?? "",buyer.Email ?? "");

    }

    public bool VerifySignature(Dictionary<string, string> itnFields, string receivedSign) => _paymentGateway.VerifySignature(itnFields,receivedSign);
        
    public async Task ConfirmTransactionAsync(
        Guid reservationId,
        string payfastTransactionId,
        CancellationToken ct = default
    )
    {
        var reservation =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);

        var existing = await _transactions.GetByReservationIdTrackedAsync(reservationId, ct);

        if (existing is not null && existing.TransactionStatus == "completed")
        {
            return;
        }

        var pin = GeneratePin();
        var pinHash = HashPin(pin);
        var listing = reservation.ReservationListings.First().Listing;

        if (existing is null)
        {
            existing = new Transaction
            {
                ReservationId = reservationId,
                BuyerId = reservation.BuyerId,
                SellerId = reservation.SellerId,
                Amount = listing.Price,
            };

            await _transactions.AddAsync(existing, ct);
        }

        existing.PayFastTransactionId = payfastTransactionId;
        existing.TransactionStatus = "completed";
        existing.PinHash = pinHash;
        existing.PinStatus = "pending";

        await _transactions.SaveAsync(ct);
        await _broadcast.SendToUserAsync(
            reservation.BuyerId,
            "pin_generated",
            new { reservationId, pin }
        );

        await _broadcast.SendToUserAsync(
            reservation.SellerId,
            "payment_completed",
            new {reservationId}
        );
    }

    public async Task VerifyPinAsync(
        Guid reservationId,
        Guid sellerId,
        string pin,
        CancellationToken ct = default
    )
    {
        var tx =
            await _transactions.GetByReservationIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException("transaction_not_found");
        if (tx.SellerId != sellerId)
        {
            throw new TransactionException("not_seller");
        }

        if (tx.PinStatus == "confirmed")
        {
            return;
        }

        if (tx.PinAttempts >= 5)
        {
            throw new TransactionException("too_many_attempts");
        }

        if (HashPin(pin) != tx.PinHash)
        {
            tx.PinAttempts += 1;
            await _transactions.SaveAsync(ct);
            throw new TransactionException("invalid_pin");
        }

        tx.PinStatus = "confirmed";
        tx.PinEnteredAt = DateTime.UtcNow;

        var reservation =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);
        reservation.ReservationStatus = ReservationState.Completed;

        var listing = reservation.ReservationListings.First().Listing;
        listing.ListingStatus = "sold";

        await _transactions.SaveAsync(ct);
        await _reservations.SaveAsync(ct);
    }

    private static string GeneratePin() =>
        RandomNumberGenerator.GetInt32(100000, 999999).ToString();

    private static string HashPin(string pin)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(pin));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
