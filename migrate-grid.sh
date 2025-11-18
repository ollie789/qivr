#!/bin/bash

# Migrate Grid to Grid2 for MUI v7
FILES=$(find apps/clinic-dashboard/src apps/patient-portal/src packages/design-system/src -name "*.tsx" -o -name "*.ts")

for file in $FILES; do
  # Replace Grid import with Grid2
  sed -i '' 's/import { Grid/import { Grid2/g' "$file"
  sed -i '' 's/import {Grid/import {Grid2/g' "$file"
  sed -i '' "s/import { \(.*\), Grid\(.*\)}/import { \1, Grid2\2}/g" "$file"
  sed -i '' "s/import { Grid, \(.*\)}/import { Grid2, \1}/g" "$file"
  
  # Replace Grid usage with Grid2
  sed -i '' 's/<Grid /<Grid2 /g' "$file"
  sed -i '' 's/<\/Grid>/<\/Grid2>/g' "$file"
  
  # Remove item prop (no longer needed in Grid2)
  sed -i '' 's/ item / /g' "$file"
  sed -i '' 's/ item=/ /g' "$file"
  
  # Convert container to container prop
  sed -i '' 's/ container / container /g' "$file"
done

echo "Migration complete!"
