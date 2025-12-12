namespace Hirable.Api.Domain.Entities;

public class InterviewEvent : ApplicationEvent
{
    public string InterviewType { get; private set; } = string.Empty; // e.g., Phone, Zoom, Onsite
    public string Interviewer { get; private set; } = string.Empty;

    public InterviewEvent(
        int jobApplicationId,
        string description,
        DateTime occurredAt,
        string interviewType,
        string interviewer)
        : base(jobApplicationId, description, occurredAt)
    {
        InterviewType = interviewType;
        Interviewer = interviewer;
    }
}
