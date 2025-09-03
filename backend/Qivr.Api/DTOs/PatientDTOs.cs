// Patient DTOs have been moved to Qivr.Core.DTOs for shared use between API and Services projects
// This prevents circular dependencies and ensures DTOs are accessible to all layers

using Qivr.Core.DTOs;

namespace Qivr.Api.DTOs
{
    // Re-export Core DTOs for backward compatibility if needed
    // Controllers can use either Qivr.Api.DTOs or Qivr.Core.DTOs namespace
}
