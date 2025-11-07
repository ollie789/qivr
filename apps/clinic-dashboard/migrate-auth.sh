#!/bin/bash

# Find all files with useQuery, useMutation, or useInfiniteQuery
echo "🔍 Finding files with React Query hooks..."

# Search for files containing React Query hooks
grep -r -l "useQuery\|useMutation\|useInfiniteQuery" src/ --include="*.ts" --include="*.tsx" | while read file; do
  echo "📝 Processing: $file"
  
  # Check if file already imports useAuthGuard
  if ! grep -q "useAuthGuard" "$file"; then
    echo "  ⚠️  Missing useAuthGuard import"
    echo "  Add: import { useAuthGuard } from '../hooks/useAuthGuard';"
    echo "  Add: const { canMakeApiCalls } = useAuthGuard();"
  fi
  
  # Check for useQuery without enabled: canMakeApiCalls
  if grep -q "useQuery(" "$file" && ! grep -q "enabled.*canMakeApiCalls" "$file"; then
    echo "  ⚠️  useQuery missing auth protection"
    echo "  Add: enabled: canMakeApiCalls"
  fi
  
  echo ""
done

echo "✅ Migration check complete!"
echo ""
echo "📋 Manual steps needed:"
echo "1. Add useAuthGuard import to each file"
echo "2. Add const { canMakeApiCalls } = useAuthGuard() to each component"
echo "3. Add enabled: canMakeApiCalls to each useQuery/useInfiniteQuery"
echo "4. Or use the new useProtectedQuery hooks instead"
