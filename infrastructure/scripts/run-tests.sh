#!/bin/bash

# Test Runner Script for Qivr
# Runs all unit and integration tests with coverage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
TEST_PROJECT="$BACKEND_DIR/Qivr.Tests/Qivr.Tests.csproj"
RESULTS_DIR="$SCRIPT_DIR/test-results"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Qivr Test Suite Runner${NC}"
echo -e "${BLUE}==================================${NC}"

# Check if .NET SDK is installed
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}.NET SDK is not installed. Please install .NET SDK first.${NC}"
    exit 1
fi

# Clean previous test results
echo -e "\n${YELLOW}Cleaning previous test results...${NC}"
rm -rf "$RESULTS_DIR"/*

# Build the test project
echo -e "\n${YELLOW}Building test project...${NC}"
dotnet build "$TEST_PROJECT" --configuration Release

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Run tests with coverage
echo -e "\n${YELLOW}Running tests with coverage...${NC}"

dotnet test "$TEST_PROJECT" \
    --configuration Release \
    --no-build \
    --logger "trx;LogFileName=$RESULTS_DIR/test-results.trx" \
    --logger "html;LogFileName=$RESULTS_DIR/test-results.html" \
    --collect:"XPlat Code Coverage" \
    --results-directory "$RESULTS_DIR" \
    -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=cobertura

TEST_EXIT_CODE=$?

# Check test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
else
    echo -e "\n${RED}❌ Some tests failed!${NC}"
fi

# Find coverage report
COVERAGE_FILE=$(find "$RESULTS_DIR" -name "coverage.cobertura.xml" -type f | head -1)

if [ -n "$COVERAGE_FILE" ]; then
    echo -e "\n${YELLOW}Coverage report generated:${NC}"
    echo -e "  ${COVERAGE_FILE}"
    
    # Parse coverage percentage (basic parsing)
    if command -v python3 &> /dev/null; then
        COVERAGE_PCT=$(python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('$COVERAGE_FILE')
root = tree.getroot()
line_rate = float(root.get('line-rate', 0))
branch_rate = float(root.get('branch-rate', 0))
coverage = ((line_rate + branch_rate) / 2) * 100
print(f'{coverage:.2f}')
" 2>/dev/null || echo "N/A")
        
        echo -e "${BLUE}Overall coverage: ${COVERAGE_PCT}%${NC}"
        
        # Check coverage threshold
        THRESHOLD=80
        if [ "$COVERAGE_PCT" != "N/A" ]; then
            if (( $(echo "$COVERAGE_PCT >= $THRESHOLD" | bc -l) )); then
                echo -e "${GREEN}✓ Coverage meets threshold (${THRESHOLD}%)${NC}"
            else
                echo -e "${YELLOW}⚠ Coverage below threshold (${THRESHOLD}%)${NC}"
            fi
        fi
    fi
fi

# Generate summary report
SUMMARY_FILE="$RESULTS_DIR/test-summary.txt"
echo -e "\n${YELLOW}Generating test summary...${NC}"

cat > "$SUMMARY_FILE" << EOF
===========================================
Qivr Test Execution Summary
===========================================
Date: $(date)
Configuration: Release

Test Results: $([ $TEST_EXIT_CODE -eq 0 ] && echo "PASSED" || echo "FAILED")
Coverage: ${COVERAGE_PCT}%

Test Output Files:
- TRX Report: $RESULTS_DIR/test-results.trx
- HTML Report: $RESULTS_DIR/test-results.html
- Coverage Report: $COVERAGE_FILE

===========================================
EOF

echo -e "${GREEN}✓ Summary saved to: $SUMMARY_FILE${NC}"

# Open HTML report if available
if [ -f "$RESULTS_DIR/test-results.html" ] && [ "$(uname)" == "Darwin" ]; then
    echo -e "\n${YELLOW}Opening test results in browser...${NC}"
    open "$RESULTS_DIR/test-results.html"
fi

# Exit with test exit code
exit $TEST_EXIT_CODE
