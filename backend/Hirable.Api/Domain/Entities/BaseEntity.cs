namespace Hirable.Api.Domain.Entities;

public abstract class BaseEntity
{
    public int Id { get; protected set; }
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    public void MarkUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
