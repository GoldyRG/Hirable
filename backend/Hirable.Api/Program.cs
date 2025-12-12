using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Hirable.Api.Data;
using Hirable.Api.Domain.Entities;
using Hirable.Api.Dtos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// CORS Policy
var allowedOrigins = new[] { "http://localhost:4200" }; // Add other origins as needed

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Database: PostgreSQL with EF Core
var connectionString = builder.Configuration.GetConnectionString("HirableDatabase");

builder.Services.AddDbContext<HirableDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 1024 * 50; // 50 KB
});

// JWT setup
var jwtKey = builder.Configuration["Jwt:Key"] ?? "this-is-a-very-long-dev-jwt-key-1234567890!!!";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = signingKey,
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

builder.Services.AddAuthorization();

builder.Services.AddOpenApi();

// CORS: allow Angular dev client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Use CORS policy
app.UseCors("FrontendCorsPolicy");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HirableDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors("AllowFrontendDev");
app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// --------- Auth endpoints ----------
var authGroup = app.MapGroup("/api/auth");

authGroup.MapPost("/register", async (RegisterRequest request, HirableDbContext db) =>
{
    var email = request.Email.Trim().ToLowerInvariant();

    var exists = await db.Users.AnyAsync(u => u.Email == email);
    if (exists)
    {
        return Results.Conflict(new { message = "An account with that email already exists." });
    }

    var hasher = new PasswordHasher<string>();
    var passwordHash = hasher.HashPassword(email, request.Password);

    var user = new User
    {
        Email = email,
        PasswordHash = passwordHash
    };

    db.Users.Add(user);
    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
    {
        return Results.Conflict(new { message = "An account with that email already exists." });
    }

    var token = CreateJwt(user);
    return Results.Ok(new AuthResponse { Token = token, Email = user.Email });
});

authGroup.MapPost("/login", async (LoginRequest request, HirableDbContext db) =>
{
    var email = request.Email.Trim().ToLowerInvariant();
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
    if (user is null)
    {
        return Results.BadRequest(new { message = "Invalid credentials." });
    }

    var hasher = new PasswordHasher<string>();
    var result = hasher.VerifyHashedPassword(email, user.PasswordHash, request.Password);
    if (result == PasswordVerificationResult.Failed)
    {
        return Results.BadRequest(new { message = "Invalid credentials." });
    }

    var token = CreateJwt(user);
    return Results.Ok(new AuthResponse { Token = token, Email = user.Email });
});

// --------- Job Applications (auth required) ----------
var jobAppsGroup = app.MapGroup("/api/jobapplications").RequireAuthorization();

jobAppsGroup.MapGet("/", async (ClaimsPrincipal user, HirableDbContext db) =>
{
    var userId = GetUserId(user);
    var apps = await db.JobApplications
        .Where(ja => ja.UserId == userId)
        .OrderByDescending(ja => ja.AppliedOn)
        .Select(ja => new JobApplicationReadDto
        {
            Id = ja.Id,
            CompanyName = ja.CompanyName,
            JobTitle = ja.JobTitle,
            Status = ja.Status,
            AppliedOn = ja.AppliedOn,
            Location = ja.Location,
            MinSalary = ja.MinSalary,
            MaxSalary = ja.MaxSalary,
            Source = ja.Source,
            Notes = ja.Notes
        })
        .ToListAsync();

    return Results.Ok(apps);
});

jobAppsGroup.MapGet("/search", async (
    ClaimsPrincipal user,
    string? query,
    ApplicationStatus? status,
    string? location,
    HirableDbContext db) =>
{
    var userId = GetUserId(user);
    var jobAppsQuery = db.JobApplications
        .Where(ja => ja.UserId == userId)
        .AsQueryable();

    if (!string.IsNullOrWhiteSpace(query))
    {
        jobAppsQuery = jobAppsQuery.Where(ja =>
            ja.CompanyName.Contains(query) ||
            ja.JobTitle.Contains(query));
    }

    if (status.HasValue)
    {
        jobAppsQuery = jobAppsQuery.Where(ja => ja.Status == status.Value);
    }

    if (!string.IsNullOrWhiteSpace(location))
    {
        jobAppsQuery = jobAppsQuery.Where(ja => ja.Location.Contains(location));
    }

    var results = await jobAppsQuery
        .OrderByDescending(ja => ja.AppliedOn)
        .Select(ja => new JobApplicationReadDto
        {
            Id = ja.Id,
            CompanyName = ja.CompanyName,
            JobTitle = ja.JobTitle,
            Status = ja.Status,
            AppliedOn = ja.AppliedOn,
            Location = ja.Location,
            MinSalary = ja.MinSalary,
            MaxSalary = ja.MaxSalary,
            Source = ja.Source,
            Notes = ja.Notes
        })
        .ToListAsync();

    return Results.Ok(results);
});

jobAppsGroup.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, HirableDbContext db) =>
{
    var userId = GetUserId(user);
    var appEntity = await db.JobApplications.FirstOrDefaultAsync(ja => ja.Id == id && ja.UserId == userId);
    if (appEntity == null)
    {
        return Results.NotFound();
    }
    var dto = new JobApplicationReadDto
    {
        Id = appEntity.Id,
        CompanyName = appEntity.CompanyName,
        JobTitle = appEntity.JobTitle,
        Status = appEntity.Status,
        AppliedOn = appEntity.AppliedOn,
        Location = appEntity.Location,
        MinSalary = appEntity.MinSalary,
        MaxSalary = appEntity.MaxSalary,
        Source = appEntity.Source,
        Notes = appEntity.Notes
    };
    return Results.Ok(dto);
});

jobAppsGroup.MapPost("/", async (ClaimsPrincipal user, JobApplicationCreateDto dto, HirableDbContext db) =>
{
    // -------------------- VALIDATION RULES --------------------
    if (string.IsNullOrWhiteSpace(dto.CompanyName) || string.IsNullOrWhiteSpace(dto.JobTitle))
    {
        return Results.BadRequest("CompanyName and JobTitle are required.");
    }

    if (dto.MinSalary.HasValue && dto.MaxSalary.HasValue &&
        dto.MinSalary.Value > dto.MaxSalary.Value)
    {
        return Results.BadRequest("MinSalary cannot be greater than MaxSalary.");
    }

    var today = DateTime.UtcNow.Date;
    if (dto.AppliedOn.Date > today.AddDays(7))
    {
        return Results.BadRequest("AppliedOn cannot be more than 7 days in the future.");
    }

    if (!string.IsNullOrEmpty(dto.Notes) && dto.Notes.Length > 2000)
    {
        return Results.BadRequest("Notes cannot exceed 2000 characters.");
    }

    if (!string.IsNullOrEmpty(dto.Location) && dto.Location.Length > 200)
    {
        return Results.BadRequest("Location cannot exceed 200 characters.");
    }

    if (!string.IsNullOrEmpty(dto.Source) && dto.Source.Length > 200)
    {
        return Results.BadRequest("Source cannot exceed 200 characters.");
    }

    // -----------------------------------------------------------
    var userId = GetUserId(user);

    var entity = new JobApplication(
        dto.CompanyName,
        dto.JobTitle,
        dto.Status,
        dto.AppliedOn,
        dto.Location,
        dto.Source,
        userId,
        dto.MinSalary,
        dto.MaxSalary,
        dto.Notes
    );

    db.JobApplications.Add(entity);
    await db.SaveChangesAsync();

    var readDto = new JobApplicationReadDto
    {
        Id = entity.Id,
        CompanyName = entity.CompanyName,
        JobTitle = entity.JobTitle,
        Status = entity.Status,
        AppliedOn = entity.AppliedOn,
        Location = entity.Location,
        MinSalary = entity.MinSalary,
        MaxSalary = entity.MaxSalary,
        Source = entity.Source,
        Notes = entity.Notes
    };

    return Results.Created($"/api/jobapplications/{entity.Id}", readDto);
});

jobAppsGroup.MapPut("/{id:int}", async (int id, ClaimsPrincipal user, JobApplicationUpdateDto dto, HirableDbContext db) =>
{
    var userId = GetUserId(user);
    var entity = await db.JobApplications.FirstOrDefaultAsync(ja => ja.Id == id && ja.UserId == userId);
    if (entity is null)
    {
        return Results.NotFound();
    }
    var dateOnly = dto.AppliedOn.Date;
    var middayUtc = DateTime.SpecifyKind(dateOnly.AddHours(12), DateTimeKind.Utc);

    // -------------------- VALIDATION RULES --------------------
    if (string.IsNullOrWhiteSpace(dto.CompanyName) || string.IsNullOrWhiteSpace(dto.JobTitle))
    {
        return Results.BadRequest("CompanyName and JobTitle are required.");
    }

    if (dto.MinSalary.HasValue && dto.MaxSalary.HasValue && dto.MinSalary.Value > dto.MaxSalary.Value)
    {
        return Results.BadRequest("MinSalary cannot be greater than MaxSalary.");
    }

    var today = DateTime.UtcNow.Date;
    if (dto.AppliedOn.Date > today.AddDays(7))
    {
        return Results.BadRequest("AppliedOn cannot be more than 7 days in the future.");
    }

    if (!Enum.IsDefined(typeof(ApplicationStatus), dto.Status))
    {
        return Results.BadRequest("Invalid application status.");
    }

    if (!string.IsNullOrEmpty(dto.Notes) && dto.Notes.Length > 2000)
    {
        return Results.BadRequest("Notes cannot exceed 2000 characters.");
    }

    if (!string.IsNullOrEmpty(dto.Location) && dto.Location.Length > 200)
    {
        return Results.BadRequest("Location cannot exceed 200 characters.");
    }

    if (!string.IsNullOrEmpty(dto.Source) && dto.Source.Length > 200)
    {
        return Results.BadRequest("Source cannot exceed 200 characters.");
    }

    // -----------------------------------------------------------

    entity.CompanyName = dto.CompanyName;
    entity.JobTitle = dto.JobTitle;
    entity.Status = dto.Status;
    entity.AppliedOn = middayUtc;
    entity.Location = dto.Location;
    entity.MinSalary = dto.MinSalary;
    entity.MaxSalary = dto.MaxSalary;
    entity.Source = dto.Source;
    entity.Notes = dto.Notes ?? string.Empty;

    await db.SaveChangesAsync();

    return Results.NoContent();
});

jobAppsGroup.MapDelete("/{id:int}", async (int id, ClaimsPrincipal user, HirableDbContext db) =>
{
    var userId = GetUserId(user);
    var entity = await db.JobApplications.FirstOrDefaultAsync(ja => ja.Id == id && ja.UserId == userId);
    if (entity is null)
    {
        return Results.NotFound();
    }

    db.JobApplications.Remove(entity);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

jobAppsGroup.MapGet("/report/summary", async (ClaimsPrincipal user, HirableDbContext db) =>
{
    var userId = GetUserId(user);
    var rows = await db.JobApplications
        .AsNoTracking()
        .Where(ja => ja.UserId == userId)
        .OrderByDescending(ja => ja.AppliedOn)
        .Select(ja => new ApplicationsReportRowDto
        {
            CompanyName = ja.CompanyName,
            JobTitle = ja.JobTitle,
            Status = ja.Status,
            AppliedOn = ja.AppliedOn,
            Location = ja.Location
        })
        .ToListAsync();

    var report = new ApplicationsReportDto
    {
        Title = "Job Applications Summary",
        GeneratedAt = DateTime.UtcNow,
        Rows = rows
    };

    return Results.Ok(report);
});

app.Run();

string CreateJwt(User user)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email)
    };

    var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddDays(1),
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
}

int GetUserId(ClaimsPrincipal user)
{
    var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
    return int.TryParse(id, out var parsed) ? parsed : 0;
}
