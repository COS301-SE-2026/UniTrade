namespace Modules.SharedKernel;

public record PagedResult<T>(IReadOnlyList<T> Items, int Total);