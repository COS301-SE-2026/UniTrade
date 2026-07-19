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
    DateTime CheckinWindowClosesAt,
    bool CheckInWindowOpen,
    bool BuyerCheckedIn,
    bool SellerCheckedIn,
    bool PaymentUnlocked,
    string Status
);
