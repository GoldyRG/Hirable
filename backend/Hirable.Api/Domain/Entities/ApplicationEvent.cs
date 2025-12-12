namespace Hirable.Api.Domain.Entities;

public class ApplicationEvent : BaseEntity
{
    public int JobApplicationId { get; protected set; }
    public string Description { get; protected set; } = string.Empty;
    public DateTime OccurredAt { get; protected set; }

    protected ApplicationEvent(int jobApplicationId, string description, DateTime occurredAt)
    {
        JobApplicationId = jobApplicationId;
        Description = description;
        OccurredAt = occurredAt;
    }
}
