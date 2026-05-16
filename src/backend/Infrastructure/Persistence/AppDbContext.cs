using Microsoft.EntityFrameworkCore;
using Modules.Identity.Models; 

namespace Infrastructure.Persistence{

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options):base(options) {}
        public DbSet<User> Users { get; set; };
        public DbSet<StudentProf>StudentProfiles{get;set;};
        public DbSet<AdminProf>AdminProfiles{get;set;};
        public DbSet<University>Universities{get;set;};
    }
}