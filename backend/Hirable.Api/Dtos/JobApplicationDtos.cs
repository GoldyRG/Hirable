using System.ComponentModel.DataAnnotations;
using Hirable.Api.Domain.Entities;

namespace Hirable.Api.Dtos;

public interface IApplicationsReportRow
{
    string CompanyName { get; }
    string JobTitle { get; }
    ApplicationStatus Status { get; }
    DateTime AppliedOn { get; }
    string Location { get; }
}

public class JobApplicationCreateDto
{
    [Required, MaxLength(100)]
    public string CompanyName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string JobTitle { get; set; } = string.Empty;

    [Required]
    public ApplicationStatus Status { get; set; }

    [Required]
    public DateTime AppliedOn { get; set; }

    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }

    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

public class JobApplicationUpdateDto
{
    [Required, MaxLength(100)]
    public string CompanyName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string JobTitle { get; set; } = string.Empty;

    [Required]
    public ApplicationStatus Status { get; set; }

    [Required]
    public DateTime AppliedOn { get; set; }

    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }

    [MaxLength(100)]
    public string Source { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

public class JobApplicationReadDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; }
    public DateTime AppliedOn { get; set; }
    public string Location { get; set; } = string.Empty;
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

// A single row in the report
public class ApplicationsReportRowDto : IApplicationsReportRow
{
    public string CompanyName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; }
    public DateTime AppliedOn { get; set; }
    public string Location { get; set; } = string.Empty;
}

// The full report
public class ApplicationsReportDto
{
    public string Title { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public List<ApplicationsReportRowDto> Rows { get; set; } = new();
}
