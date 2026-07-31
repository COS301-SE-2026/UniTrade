namespace Modules.Reservations.Models.Dto;

public record CheckInResult(
    int MeetupId,
    bool CheckedIn,
    bool LocationVerified,
    DateTime CheckInAt,
    bool PaymentUnlocked,
    string Message
);

public record MeetupStatusDto(
    int MeetupId,
    string AgreedLocationName,
    decimal AgreedLatitude,
    decimal AgreedLongitude,
    DateTime AgreedTime,
    DateTime CreatedAt,
    DateTime CheckinWindowClosesAt,
    DateTime CheckinWindowOpensAt,
    bool CheckInWindowOpen,
    bool BuyerCheckedIn,
    DateTime? BuyerCheckedInAt,
    bool SellerCheckedIn,
    DateTime? SellerCheckedInAt,
    bool PaymentUnlocked,
    string Status
);
