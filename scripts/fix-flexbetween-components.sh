#!/bin/bash

# Fix FlexBetween in component files
cd /Users/oliver/Projects/qivr/apps/clinic-dashboard/src/components

files=(
  "shared/TenantSelector.tsx"
  "shared/NotificationBell.tsx"
  "dialogs/IntakeDetailsDialog.tsx"
  "documents/FileUpload.tsx"
  "messaging/PromPreview.tsx"
  "messaging/MessageComposer.tsx"
  "messaging/SendPromDialog.tsx"
  "messaging/PROMSender.tsx"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Add Box to imports if not present
  if ! grep -q "import.*Box.*from '@mui/material'" "$file"; then
    # Find the MUI import line and add Box
    sed -i '' '/from .@mui\/material/s/} from/,\n  Box\n} from/' "$file"
  fi
  
  # Remove FlexBetween from imports
  sed -i '' 's/, FlexBetween//g' "$file"
  sed -i '' 's/FlexBetween, //g' "$file"
  sed -i '' '/import.*FlexBetween.*from.*@qivr\/design-system/d' "$file"
  
  # Replace FlexBetween with Box (simple cases first)
  sed -i '' 's/<FlexBetween>/<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>/g' "$file"
  sed -i '' 's/<\/FlexBetween>/<\/Box>/g' "$file"
  
  # Replace FlexBetween with sx props
  sed -i '' 's/<FlexBetween sx={{ gap: 1 }}>/<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>/g' "$file"
  sed -i '' 's/<FlexBetween sx={{ gap: 2 }}>/<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>/g' "$file"
  sed -i '' 's/<FlexBetween sx={{ mt: 2, gap: 1, flexWrap: .wrap. }}>/<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, gap: 1, flexWrap: "wrap" }}>/g' "$file"
  sed -i '' 's/<FlexBetween sx={{ mt: 3 }}>/<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>/g' "$file"
  sed -i '' 's/<FlexBetween sx={{ mt: 4 }}>/<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 4 }}>/g' "$file"
  sed -i '' 's/<FlexBetween component="span" sx={{ gap: 0.5 }}>/<Box component="span" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.5 }}>/g' "$file"
  
  echo "  ✓ Done"
done

echo "All files processed!"
