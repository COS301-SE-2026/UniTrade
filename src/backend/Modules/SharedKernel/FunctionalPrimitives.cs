namespace Modules.SharedKernel;

// representing a void value, for when a result needs to return 'nothing' on success
public sealed record Unit
{
    public static readonly Unit Value = new(); // singleton instance, since only one ever be one value of unit can ever exist

}

public static class Result
{
    public static Result<Unit> Success() => Result<Unit>.Success(Unit.Value);
    public static Result<Unit> Failure(string code, Dictionary<string, object?>? metadata = null) => Result<Unit>.Failure(code, metadata); // failed result with error code and optionally, metadata
}
