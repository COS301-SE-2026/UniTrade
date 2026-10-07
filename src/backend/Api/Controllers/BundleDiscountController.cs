using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Modules.Reservations;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/bundle-discount")]
[Authorize]
public class BundleDiscountController : ControllerBase
{
    private readonly ISmartBudgetService _bundleDiscounts;
    public record BundleDiscountRequest(int? MinItems, int? Percent);

    public BundleDiscountController(ISmartBudgetService bundleDiscounts) =>
        _bundleDiscounts = bundleDiscounts;

    private Guid CallerId
    {
        get
        {
            var value =
                User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (value is null || !Guid.TryParse(value, out var id))
            {
                throw new InvalidOperationException(
                    "Authenticated request is missing a valid user id."
                );
            }
            return id;
        }
    }

    private static object ToResponse(BundleRule? rule) =>
        new
        {
            minItems = rule?.MinItems,
            percent = rule?.Percent,
            limits = new
            {
                minItemsFloor = BundleDiscountRules.MinItemsFloor,
                minItemsCeiling = BundleDiscountRules.MinItemsCeiling,
                minPercent = BundleDiscountRules.MinPercent,
                maxPercent = BundleDiscountRules.MaxPercent,
            },
        };

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var settings = await _bundleDiscounts.GetBundleDiscountAsync(CallerId, ct);
        return settings is null
            ? NotFound(new { error = "not_found" })
            : Ok(ToResponse(settings.Rule));
    }

    [HttpPut]
    public async Task<IActionResult> Put(
        [FromBody] BundleDiscountRequest body,
        CancellationToken ct
    )
    {
        if (!BundleDiscountRules.IsValid(body.MinItems, body.Percent))
        {
            return BadRequest(new { error = "invalid_bundle_rule" });
        }
        BundleRule? rule =
            body.MinItems is int m && body.Percent is int p ? new BundleRule(m, p) : null;

        var settings = await _bundleDiscounts.SetBundleDiscountAsync(CallerId, rule, ct);

        return settings is null
            ? NotFound(new { error = "not_found" })
            : Ok(ToResponse(settings.Rule));
    }
}
