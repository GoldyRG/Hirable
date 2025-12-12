namespace Hirable.Api.Domain.Entities;

public class JobApplication : BaseEntity
{
    // EF Core requires a parameterless constructor
    public JobApplication() { }

    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; }
    public DateTime AppliedOn { get; set; }
    public string Location { get; set; } = string.Empty;
    public int UserId { get; set; }
    public User? User { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;

    public ICollection<ApplicationEvent> Events { get; set; } = new List<ApplicationEvent>();

    public JobApplication(
        string companyName,
        string jobTitle,
        ApplicationStatus status,
        DateTime appliedOn,
        string location,
        string source,
        int userId,
        decimal? minSalary = null,
        decimal? maxSalary = null,
        string? notes = null)
    {
        CompanyName = companyName;
        JobTitle = jobTitle;
        Status = status;

        var dateOnly = appliedOn.Date;                    // drop any time portion
        var middayUtc = DateTime.SpecifyKind(
            dateOnly.AddHours(12),                        // 12:00:00
            DateTimeKind.Utc);

        AppliedOn = middayUtc;
        Location = location;
        Source = source;
        UserId = userId;
        MinSalary = minSalary;
        MaxSalary = maxSalary;
        Notes = notes ?? string.Empty;
    }
}
