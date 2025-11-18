#!/bin/bash

# Find all TypeScript/TSX files
FILES=$(find apps/clinic-dashboard/src apps/patient-portal/src packages/design-system/src -name "*.tsx" -o -name "*.ts")

for file in $FILES; do
  # 1. Replace Grid imports with Grid2 from Unstable
  if grep -q "import.*Grid" "$file"; then
    # Add Grid2 import if Grid is imported
    sed -i '' "s/import { \(.*\)Grid\(.*\) } from '@mui\/material'/import { \1\2 } from '@mui\/material'\\
import Grid2 from '@mui\/material\/Unstable_Grid2'/g" "$file"
    
    # Replace <Grid with <Grid2
    sed -i '' 's/<Grid /<Grid2 /g' "$file"
    sed -i '' 's/<\/Grid>/<\/Grid2>/g' "$file"
    
    # Remove item prop
    sed -i '' 's/ item=/ /g' "$file"
    sed -i '' 's/ item / /g' "$file"
  fi
  
  # 2. Replace ListItem button prop with ListItemButton
  if grep -q "ListItem.*button" "$file"; then
    # Add ListItemButton to imports if not present
    if ! grep -q "ListItemButton" "$file"; then
      sed -i '' "s/import { \(.*\)ListItem\(.*\) } from '@mui\/material'/import { \1ListItem, ListItemButton\2 } from '@mui\/material'/g" "$file"
    fi
    
    # Replace <ListItem button with <ListItemButton
    sed -i '' 's/<ListItem button/<ListItemButton/g' "$file"
    sed -i '' 's/<\/ListItem>/<\/ListItemButton>/g' "$file"
  fi
  
  # 3. Remove Hidden component imports
  sed -i '' 's/, Hidden//g' "$file"
  sed -i '' 's/Hidden, //g' "$file"
  
done

echo "Migration complete!"
