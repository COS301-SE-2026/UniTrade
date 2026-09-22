namespace Modules.Reservations;

public sealed record BundleRule(int MinItems, int Percent);

public static class BundleDiscountRules
{
    public const int MinItemsFloor = 3;
    public const int MinItemsCeiling = 10;
    public const int MinPercent = 1;
    public const int MaxPercent = 30;

    public static bool IsValid(int? minItems, int? percent) =>
        (minItems is null && percent is null)
        || (
            minItems is >= MinItemsFloor and <= MinItemsCeiling
            && percent is >= MinPercent and <= MaxPercent
        );
}

public static class BundlePricing
{
    public static long ToCents(decimal amount) =>
        (long)Math.Round(amount * 100m, 0, MidpointRounding.AwayFromZero);

    public static decimal FromCents(long cents) => cents / 100m;

    public static long DiscountCents(long subtotalCents, int percent) =>
        (subtotalCents * percent + 50) / 100;

    public static int? AppliedPercent(int itemCount, BundleRule? rule) =>
        rule is not null && itemCount >= rule.MinItems ? rule.Percent : null;

    public static long TotalCents(long subtotalCents, int itemCount, BundleRule? rule) =>
        AppliedPercent(itemCount, rule) is int p
            ? subtotalCents - DiscountCents(subtotalCents, p)
            : subtotalCents;
}
