#!/bin/bash

echo "============================================"
echo "Qivr Bundle Size Analysis"
echo "============================================"
echo ""

# Function to analyze a single app
analyze_app() {
    local app_name=$1
    local app_path=$2
    
    echo "📦 $app_name"
    echo "-------------------------------------------"
    
    if [ -d "$app_path/dist" ]; then
        # Get total size
        total_size=$(du -sh "$app_path/dist" 2>/dev/null | cut -f1)
        echo "Total dist size: $total_size"
        
        # Count JS files
        js_count=$(find "$app_path/dist" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
        echo "JavaScript chunks: $js_count files"
        
        # Get largest files
        echo ""
        echo "Largest chunks (top 5):"
        find "$app_path/dist" -name "*.js" -exec ls -lh {} \; 2>/dev/null | \
            sort -k5 -hr | head -5 | \
            awk '{print "  - " $9 ": " $5}'
        
        # Calculate gzipped total
        if command -v gzip &> /dev/null; then
            echo ""
            echo "Estimated gzipped sizes:"
            total_gzip=0
            for file in $(find "$app_path/dist" -name "*.js" 2>/dev/null); do
                gzip_size=$(gzip -c "$file" 2>/dev/null | wc -c)
                total_gzip=$((total_gzip + gzip_size))
            done
            echo "  Total gzipped JS: $(echo "scale=2; $total_gzip / 1024" | bc) KB"
        fi
    else
        echo "❌ No dist folder found. Run 'npm run build' first."
    fi
    
    echo ""
}

# Analyze each app
cd /Users/oliver/Projects/qivr

echo "🚀 Analyzing Patient Portal..."
analyze_app "Patient Portal" "apps/patient-portal"

echo "🏥 Analyzing Clinic Dashboard..."
analyze_app "Clinic Dashboard" "apps/clinic-dashboard"

echo "🔧 Analyzing Widget..."
analyze_app "Widget" "apps/widget"

echo "============================================"
echo "Optimization Summary"
echo "============================================"
echo ""
echo "✅ Applied optimizations:"
echo "  - Code splitting with lazy loading"
echo "  - Manual vendor chunks for better caching"
echo "  - Tree shaking with ES2020 target"
echo "  - Terser minification with console removal"
echo "  - Development-only dependencies excluded"
echo "  - React Query DevTools only in dev mode"
echo ""
echo "📈 Benefits:"
echo "  - Faster initial page load"
echo "  - Better browser caching"
echo "  - Reduced memory usage"
echo "  - Improved Core Web Vitals"
echo ""
echo "💡 Next steps for further optimization:"
echo "  - Enable compression on server (gzip/brotli)"
echo "  - Implement service workers for offline caching"
echo "  - Use CDN for static assets"
echo "  - Consider SSR/SSG for public pages"
echo "  - Optimize images with next-gen formats (WebP/AVIF)"
