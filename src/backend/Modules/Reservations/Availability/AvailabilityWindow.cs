namespace Modules.Reservations.Availability;

public readonly record struct AvailabilityWindow(DateOnly Date, TimeOnly Start, TimeOnly End);
