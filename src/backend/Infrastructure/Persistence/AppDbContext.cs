using Microsoft.EntityFrameworkCore;
using API.Modules.Identity.Models; 

namespace API.Infrastructure.Persistence{

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options):base(options) {}
        public DbSet<User> Users { get; set; };
        public DbSet<StudentProf>StudentProfiles{get;set;};
        public DbSet<AdminProf>AdminProfiles{get;set;};
    }
}