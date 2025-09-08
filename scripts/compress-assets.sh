#!/bin/bash

# Pre-compress assets for nginx to serve with gzip_static and brotli_static
# This reduces CPU usage on the server by serving pre-compressed files

set -e

echo "🗜️  Pre-compressing assets for optimal delivery..."
echo "============================================"

# Function to compress files in a directory
compress_directory() {
    local dir=$1
    local app_name=$2
    
    echo ""
    echo "📦 Processing $app_name..."
    echo "-------------------------------------------"
    
    if [ ! -d "$dir" ]; then
        echo "❌ Directory $dir not found. Skipping..."
        return
    fi
    
    # Count files
    local total_files=$(find "$dir" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.svg" -o -name "*.xml" \) | wc -l)
    echo "Found $total_files files to compress"
    
    # Compress with gzip
    echo "Creating gzip versions..."
    find "$dir" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.svg" -o -name "*.xml" \) -exec sh -c '
        for file; do
            if [ ! -f "$file.gz" ] || [ "$file" -nt "$file.gz" ]; then
                gzip -9 -k -f "$file"
                echo "  ✓ $(basename "$file")"
            fi
        done
    ' sh {} +
    
    # Compress with brotli (if available)
    if command -v brotli &> /dev/null; then
        echo "Creating brotli versions..."
        find "$dir" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.svg" -o -name "*.xml" \) -exec sh -c '
            for file; do
                if [ ! -f "$file.br" ] || [ "$file" -nt "$file.br" ]; then
                    brotli -9 -k -f "$file"
                    echo "  ✓ $(basename "$file")"
                fi
            done
        ' sh {} +
    else
        echo "⚠️  Brotli not installed. Install with: brew install brotli"
    fi
    
    # Report compression savings
    echo ""
    echo "Compression results:"
    
    # Calculate sizes
    local original_size=$(find "$dir" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec du -ch {} + | grep total | awk '{print $1}')
    local gzip_size=$(find "$dir" -type f -name "*.gz" -exec du -ch {} + | grep total | awk '{print $1}' 2>/dev/null || echo "0")
    local brotli_size=$(find "$dir" -type f -name "*.br" -exec du -ch {} + | grep total | awk '{print $1}' 2>/dev/null || echo "0")
    
    echo "  Original: $original_size"
    echo "  Gzipped:  $gzip_size"
    if [ "$brotli_size" != "0" ]; then
        echo "  Brotli:   $brotli_size"
    fi
}

# Change to project root
cd /Users/oliver/Projects/qivr

# Compress each app's dist folder
compress_directory "apps/patient-portal/dist" "Patient Portal"
compress_directory "apps/clinic-dashboard/dist" "Clinic Dashboard"
compress_directory "apps/widget/dist" "Widget"

echo ""
echo "============================================"
echo "✅ Asset compression complete!"
echo ""
echo "Benefits of pre-compression:"
echo "  • Reduced server CPU usage"
echo "  • Faster content delivery"
echo "  • Lower bandwidth costs"
echo "  • Better user experience"
echo ""
echo "Note: Nginx will automatically serve .gz and .br files"
echo "when gzip_static and brotli_static are enabled."
