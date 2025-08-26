using FluentValidation;
using Qivr.Api.Controllers; // DTO lives in same namespace as controller

namespace Qivr.Api.Validators;

public sealed class IntakeSubmissionRequestValidator : AbstractValidator<IntakeSubmissionRequest>
{
    public IntakeSubmissionRequestValidator()
    {
        RuleFor(x => x.PersonalInfo.FirstName).NotEmpty();
        RuleFor(x => x.PersonalInfo.LastName).NotEmpty();
        RuleFor(x => x.ContactInfo.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.PainLevel).InclusiveBetween(0, 10);
        RuleFor(x => x.ChiefComplaint).NotEmpty();
    }
}
