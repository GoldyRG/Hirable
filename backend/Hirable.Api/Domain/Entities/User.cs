using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace Hirable.Api.Domain.Entities;

public class User : BaseEntity
{
    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    // Navigation
    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();

    public static string HashPassword(string email, string password)
    {
        var hasher = new PasswordHasher<string>();
        return hasher.HashPassword(email, password);
    }
}
