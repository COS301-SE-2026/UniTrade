namespace Modules.Payments.Models.Dto;

public record PaymentRequestDto(string ProcessUrl, IReadOnlyDictionary<string, string> Fields);
