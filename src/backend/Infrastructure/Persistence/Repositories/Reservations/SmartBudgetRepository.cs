using Microsoft.EntityFrameworkCore;
using Modules.Reservations;
using Modules.Reservations.Models;Dto;
using Modules.Reservations.Repositories;

namespace Infrastructure.Persistence.Repositories.Reservations;

public class SmartBudgetRepository(AppDBContext db) : ISmartBudgetRepository
{
    public async Task<IReadOnlyList<SmartBudgetCandidate>> GetCandidatesAsync(IReadOnlyCollection<Guid> listingsIds,
        CancellationToken ct = default)
    {
        var ids=listingsIds.Distinct().ToList();
        if(ids.Count==0)
        {
            return Array.Empty<SmartBudgetCandidate>();
        }
        var listings=await db.Listings.AsNoTracking().Where(l=>ids.Contains(l.ListingId)).Select(l=>new{l.ListingId,l.SellerId,l.Price,l.Title, l.ListingStatus}).ToListAsync(ct);
        var sellerIds=listings.Select(l=>l.SellerId).Distinct().ToList();
        var sellers=await db.Users.AsNoTracking().Where(u=>sellerIds.Contains(u.UserId)).Select(u=>new{u.UserId, u.FirstName,u.LastName}).ToDictionaryAsync(u=>u.UserId,ct);

        return listings.Select(l=>
        {
            var found=sellers.TryGetValue(l.SellerId, out var s);
            var initials=found ? $"{First(s!.FirstName)}{First(s.LastName)}" : "";
            return new SmartBudgetCandidate(l.ListingId,l.SellerId,l.Price,l.Title,l.ListingStatus, found, initials);
        }).ToList();
    }

    public async Task<IReadOnlyCollection<Guid,BundleRule>> GetBundleRulesAsync(IReadOnlyCollection<Guid> sellerIds, CancellationToken ct=default)
    {
        var ids=sellerIds.Distinct().ToList();
        var result=new Dictionary<Guid,BundleRule>();
        if(ids.Count==0)
        {
            return result;
        }
        var rows=await db.StudentProfiles.AsNoTracking().Where(p=>ids.Contains(p.StudentId) &&p.BundleMinItems!=null && p.BundleDiscountPercent !=null)
        .Select(p=>new {p.StudentId, Min=p.BundleMinItems!.Value,Pct=p.BundleDiscountPercent!.Value}).ToListAsync(ct);

        foreach(var r in rows)
        {
            if(BundleDiscountRules.IsValid(r.Min,r.Pct))
            {
                result[r.StudentId]=new BundleRule(r.Min,r.Pct);
            }
        }
        return result;
    }

    public async Task<SellerBundleSettings?> GetSettingsAsync(Guid sellerId, CancellationToken ct=default)
    {
        var row=await db.StudentProfiles.AsNoTracking().Where(p=>p.StudentId==sellerId).Select(p=>new{p.BundleMinItems,p.BundleDiscountPercent}).FirstOrDefaultAsync(ct);
        if(row is null)
            return null;
        var rule=row.BundleMinItems is int && row.BundleDiscountPercent is int pct && BundleDiscountRules.IsValid(m,pct): null ;
        return new SellerBundleSettings(rule);
    }

    public async Task<bool> SetRuleAsync(Guid sellerId, BundleRule? rule, CancellationToken ct=default)
    {
        int? minItems=rule?.MinItems;
        int? percent=rule?.Percent;
        var rows=await db.StudentProfiles.Where(p=>p.StudentId==sellerId).ExecuteUpdateAsync(s->s.SetProperty(p=>p.BundleMinItems,minItems).SetProperty(p=>p.BundleDiscountPercent,percent),ct);
        return rows==1;
    }

    private static string First(string? s)=>string.IsNullOrEmpty(s) ? "" : s[0].ToString();
}