using System.Text.Json.Serialization;

namespace Modules.Reservations.Availability;

public sealed record AvailabilityResponseDto(
    string Status,
    IReadOnlyList<AvailabilitySlotDto> Slots,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        string? MissingParty = null
);

public sealed record AvailabilitySlotDto(string Date, int DayOfWeek, string Start, string End);
