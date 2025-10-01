#!/bin/bash

# Controllers to update
controllers=(
    "NotificationsController"
    "MedicalRecordsController"
    "PromsController"
    "ProfileController"
)

for controller in "${controllers[@]}"; do
    file="Qivr.Api/Controllers/${controller}.cs"
    echo "Updating $controller..."
    
    # Change inheritance from ControllerBase to BaseApiController
    sed -i '' "s/public class ${controller} : ControllerBase/public class ${controller} : BaseApiController/g" "$file"
    
    # Replace GetTenantId() with CurrentTenantId
    sed -i '' 's/GetTenantId()/CurrentTenantId/g' "$file"
    
    # Replace GetUserId() with CurrentUserId  
    sed -i '' 's/GetUserId()/CurrentUserId/g' "$file"
    
    # Comment out the GetTenantId and GetUserId methods
    sed -i '' '/private Guid GetTenantId()/,/^    }$/s/^/\/\/ /' "$file"
    sed -i '' '/private Guid GetUserId()/,/^    }$/s/^/\/\/ /' "$file"
    
    echo "  - Replaced inheritance and method calls"
done

echo "All controllers updated!"