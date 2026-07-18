namespace Modules.Transactions.Models.Dto;

public record TransactionRequestDto(string ProcessUrl, IReadOnlyDictionary<string, string> Fields);
