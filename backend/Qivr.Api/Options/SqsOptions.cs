namespace Qivr.Api.Options;

public sealed class SqsOptions
{
    public string? QueueUrl { get; set; }
    public string? Region { get; set; } = "ap-southeast-2";
    public int MaxNumberOfMessages { get; set; } = 10;
    public int WaitTimeSeconds { get; set; } = 20;
    public int VisibilityTimeout { get; set; } = 300;
}
