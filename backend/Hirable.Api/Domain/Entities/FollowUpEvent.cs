namespace Hirable.Api.Domain.Entities;

public class FollowUpEvent : ApplicationEvent
{
    public string Channel { get; private set; } = string.Empty; // e.g., Email, LinkedIn, Phone

    public FollowUpEvent(
        int jobApplicationId,
        string description,
        DateTime occurredAt,
        string channel)
        : base(jobApplicationId, description, occurredAt)
    {
        Channel = channel;
    }
}
