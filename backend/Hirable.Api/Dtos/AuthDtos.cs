using System.ComponentModel.DataAnnotations;

namespace Hirable.Api.Dtos;

public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(200)]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required, EmailAddress, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(200)]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
