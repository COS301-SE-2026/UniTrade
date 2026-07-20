namespace Modules.Reservations.StateMachine;

public static class GeoDistance
{
    public const double VerificationRadiusMetres = 1000; // a valid check in is within 1000m of the agreed location, maybe too harsh or  too relaxed, NOTE

    public const double EarthRadiusMetres = 6_371_000;

    // using Haversine distance formula, not so accurate, we could use Vincenty's formula as well
    public static double Between(double lat1, double lng1, double lat2, double lng2)
    {
        double ToRad(double deg) => deg * Math.PI / 180;

        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);

        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRad(lat1))
                * Math.Cos(ToRad(lat2))
                * Math.Sin(dLng / 2)
                * Math.Sin(dLng / 2);

        return EarthRadiusMetres * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    public static bool IsWIthinRadius(
        decimal agreedLat,
        decimal agreedLng,
        decimal actualLat,
        decimal actualLng
    ) =>
        Between((double)agreedLat, (double)agreedLng, (double)actualLat, (double)actualLng)
        <= VerificationRadiusMetres;
}
