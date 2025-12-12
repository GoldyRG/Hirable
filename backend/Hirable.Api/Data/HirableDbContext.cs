using Hirable.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hirable.Api.Data;

public class HirableDbContext : DbContext
{
    public HirableDbContext(DbContextOptions<HirableDbContext> options)
        : base(options)
    {
    }

    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<JobApplication>()
            .HasOne(ja => ja.User)
            .WithMany(u => u.JobApplications)
            .HasForeignKey(ja => ja.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
