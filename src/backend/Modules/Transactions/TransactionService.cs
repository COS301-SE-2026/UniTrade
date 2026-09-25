using System.Security.Cryptography;
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
        _paymentGateway = paymentGateway;
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

        if (reservation.TotalAmount <= 0m)
        {
            throw new TransactionException("invalid_amount");
        }
        var buyer = reservation.Buyer ?? throw new TransactionException(TransactionErrors.ReservationNotFound);

        var listings = reservation.ReservationListings.Select(rl => rl.Listing).ToList();
        var itemName = listings.Count switch
        {
            0 => "UniTrade reservation",
            1 => listings[0].Title,
            _ => reservation.BundleDiscountPercent is int pct ? "${listings.Count} items ({pct}% bundle discount)" : $"{listings.Count} items",
        };

        return _paymentGateway.CreatePaymentRequest(
            reservation.ReservationId,
            itemName,
            reservation.TotalAmount,
            buyer.FirstName ?? "",
            buyer.Email ?? ""
        );
    }

    public bool VerifySignature(string rawBody, string receivedSign) =>
        _paymentGateway.VerifySignature(rawBody, receivedSign);

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

        if (existing is null)
        {
            existing = new Transaction
            {
                ReservationId = reservationId,
                BuyerId = reservation.BuyerId,
                SellerId = reservation.SellerId,
                Amount = reservation.TotalAmount,
            };

            await _transactions.AddAsync(existing, ct);
        }

        existing.PayFastTransactionId = payfastTransactionId;
        existing.TransactionStatus = "completed";
        existing.Pin = pin;
        existing.PinStatus = "pending";

        await _transactions.SaveAsync(ct);

        await _broadcast.SendToUserAsync(
            reservation.SellerId,
            "pin_generated",
            new { reservationId, pin }
        );
        await _broadcast.SendToUserAsync(
            reservation.BuyerId,
            "payment_completed",
            new { reservationId }
        );
    }

    public async Task<string> GetPendingPinAsync(
        Guid reservationId,
        Guid sellerId,
        CancellationToken ct = default
    )
    {
        var reservation =
            await _reservations.GetByIdAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);

        if (reservation.SellerId != sellerId)
        {
            throw new TransactionException(TransactionErrors.NotBuyer);
        }

        var tx =
            await _transactions.GetByReservationIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException("transaction_not_found");

        if (tx.PinStatus != "pending")
        {
            throw new TransactionException("pin_not_pending");
        }

        return tx.Pin!;
    }

    public async Task VerifyPinAsync(
        Guid reservationId,
        Guid buyerId,
        string pin,
        CancellationToken ct = default
    )
    {
        var tx =
            await _transactions.GetByReservationIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException("transaction_not_found");
        if (tx.BuyerId != buyerId)
        {
            throw new TransactionException("not_buyer");
        }

        if (tx.PinStatus == "confirmed")
        {
            return;
        }

        if (tx.PinAttempts >= 5)
        {
            throw new TransactionException("too_many_attempts");
        }

        if (pin != tx.Pin)
        {
            tx.PinAttempts += 1;
            await _transactions.SaveAsync(ct);
            throw new TransactionException("invalid_pin");
        }

        tx.PinStatus = "confirmed";
        tx.PinEnteredAt = DateTime.UtcNow;
        tx.Pin = null;

        var reservation =
            await _reservations.GetByIdTrackedAsync(reservationId, ct)
            ?? throw new TransactionException(TransactionErrors.ReservationNotFound);
        reservation.ReservationStatus = ReservationState.Completed;

        foreach (var r1 in reservation.ReservationListings)
        {
            r1.Listing.ListingStatus = "sold";
        }

        await _transactions.SaveAsync(ct);
        await _reservations.SaveAsync(ct);

        await _broadcast.SendToUserAsync(tx.SellerId, "pin_confirmed", new { reservationId });
    }

    private static string GeneratePin() =>
        RandomNumberGenerator.GetInt32(100000, 999999).ToString();
}
