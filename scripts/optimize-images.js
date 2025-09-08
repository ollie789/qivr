#!/usr/bin/env node

/**
 * Image Optimization Script
 * Generates WebP and AVIF versions of images
 * Creates responsive sizes
 * Generates blur placeholders
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');
const crypto = require('crypto');

// Configuration
const IMAGE_SIZES = [320, 640, 768, 1024, 1280, 1536, 1920, 2560];
const IMAGE_QUALITY = {
  jpeg: 85,
  webp: 85,
  avif: 80
};
const BLUR_SIZE = 20;

// Directories
const INPUT_DIRS = [
  'apps/patient-portal/public/images',
  'apps/clinic-dashboard/public/images',
  'apps/widget/public/images'
];

const OUTPUT_DIR = 'public/optimized';

// File to store image metadata
const METADATA_FILE = 'public/image-metadata.json';

/**
 * Process a single image
 */
async function processImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const ext = path.extname(inputPath).toLowerCase();
  
  // Skip if not an image
  if (!['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)) {
    return null;
  }

  console.log(`Processing: ${inputPath}`);

  const metadata = {
    original: inputPath,
    formats: {},
    sizes: {},
    placeholder: null,
    hash: null
  };

  try {
    // Read original image
    const image = sharp(inputPath);
    const imageMetadata = await image.metadata();
    const { width, height } = imageMetadata;

    // Generate hash for cache busting
    const fileBuffer = await fs.readFile(inputPath);
    metadata.hash = crypto.createHash('md5').update(fileBuffer).digest('hex').slice(0, 8);

    // Generate blur placeholder
    const blurBuffer = await image
      .resize(BLUR_SIZE, BLUR_SIZE, { fit: 'inside' })
      .blur()
      .toBuffer();
    metadata.placeholder = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;

    // Process each size
    for (const targetWidth of IMAGE_SIZES) {
      if (targetWidth > width) continue; // Skip sizes larger than original

      const sizeDir = path.join(outputDir, targetWidth.toString());
      await fs.mkdir(sizeDir, { recursive: true });

      // Calculate height maintaining aspect ratio
      const targetHeight = Math.round((height / width) * targetWidth);

      // Original format (optimized)
      const originalOutput = path.join(sizeDir, `${filename}-${metadata.hash}${ext}`);
      await image
        .resize(targetWidth, targetHeight, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: IMAGE_QUALITY.jpeg, progressive: true })
        .toFile(originalOutput);

      if (!metadata.sizes[targetWidth]) {
        metadata.sizes[targetWidth] = {};
      }
      metadata.sizes[targetWidth].original = originalOutput;

      // WebP format
      const webpOutput = path.join(sizeDir, `${filename}-${metadata.hash}.webp`);
      await image
        .resize(targetWidth, targetHeight, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: IMAGE_QUALITY.webp })
        .toFile(webpOutput);
      metadata.sizes[targetWidth].webp = webpOutput;

      // AVIF format
      const avifOutput = path.join(sizeDir, `${filename}-${metadata.hash}.avif`);
      await image
        .resize(targetWidth, targetHeight, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .avif({ quality: IMAGE_QUALITY.avif })
        .toFile(avifOutput);
      metadata.sizes[targetWidth].avif = avifOutput;

      // Log sizes for comparison
      const originalStat = await fs.stat(originalOutput);
      const webpStat = await fs.stat(webpOutput);
      const avifStat = await fs.stat(avifOutput);

      console.log(`  ${targetWidth}px:`);
      console.log(`    Original: ${(originalStat.size / 1024).toFixed(2)}KB`);
      console.log(`    WebP: ${(webpStat.size / 1024).toFixed(2)}KB (${Math.round(100 - (webpStat.size / originalStat.size) * 100)}% smaller)`);
      console.log(`    AVIF: ${(avifStat.size / 1024).toFixed(2)}KB (${Math.round(100 - (avifStat.size / originalStat.size) * 100)}% smaller)`);
    }

    return metadata;
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
    return null;
  }
}

/**
 * Generate React component with image metadata
 */
async function generateImageComponent(metadata) {
  const componentContent = `// Auto-generated image metadata
// Do not edit manually

export const imageMetadata = ${JSON.stringify(metadata, null, 2)};

export function getImageSrc(imageName, size = 'original', format = 'original') {
  const image = imageMetadata[imageName];
  if (!image) return null;
  
  // Find closest size
  const availableSizes = Object.keys(image.sizes).map(Number).sort((a, b) => a - b);
  const targetSize = size === 'original' ? Math.max(...availableSizes) : size;
  const closestSize = availableSizes.reduce((prev, curr) => 
    Math.abs(curr - targetSize) < Math.abs(prev - targetSize) ? curr : prev
  );
  
  return image.sizes[closestSize]?.[format] || image.sizes[closestSize]?.original;
}

export function getBlurPlaceholder(imageName) {
  return imageMetadata[imageName]?.placeholder;
}

export function getImageSrcSet(imageName, format = 'original') {
  const image = imageMetadata[imageName];
  if (!image) return '';
  
  return Object.entries(image.sizes)
    .map(([size, formats]) => \`\${formats[format] || formats.original} \${size}w\`)
    .join(', ');
}
`;

  await fs.writeFile('packages/ui-components/src/imageMetadata.ts', componentContent);
  console.log('Generated image metadata component');
}

/**
 * Main function
 */
async function main() {
  console.log('🖼️  Starting image optimization...');
  console.log('=====================================\n');

  const allMetadata = {};
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  // Check if sharp is installed
  try {
    require('sharp');
  } catch (error) {
    console.error('Sharp is not installed. Installing...');
    require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
  }

  // Process images from each directory
  for (const inputDir of INPUT_DIRS) {
    const pattern = path.join(inputDir, '**/*.{jpg,jpeg,png,gif}');
    const files = glob.sync(pattern);

    if (files.length === 0) {
      console.log(`No images found in ${inputDir}`);
      continue;
    }

    console.log(`Found ${files.length} images in ${inputDir}`);

    for (const file of files) {
      const relativePath = path.relative(inputDir, file);
      const outputDir = path.join(OUTPUT_DIR, path.dirname(relativePath));
      
      const metadata = await processImage(file, outputDir);
      if (metadata) {
        const key = path.basename(file, path.extname(file));
        allMetadata[key] = metadata;

        // Calculate size savings
        const originalStat = await fs.stat(file);
        totalOriginalSize += originalStat.size;

        // Add optimized sizes
        for (const size of Object.values(metadata.sizes)) {
          if (size.avif) {
            const avifStat = await fs.stat(size.avif);
            totalOptimizedSize += avifStat.size;
          }
        }
      }
    }
  }

  // Save metadata
  await fs.mkdir(path.dirname(METADATA_FILE), { recursive: true });
  await fs.writeFile(METADATA_FILE, JSON.stringify(allMetadata, null, 2));

  // Generate React component
  await generateImageComponent(allMetadata);

  // Print summary
  console.log('\n=====================================');
  console.log('✅ Image optimization complete!\n');
  console.log(`Original total size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Optimized size (AVIF): ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Size reduction: ${Math.round(100 - (totalOptimizedSize / totalOriginalSize) * 100)}%`);
  console.log(`\nMetadata saved to: ${METADATA_FILE}`);
  console.log('Component generated: packages/ui-components/src/imageMetadata.ts');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processImage, generateImageComponent };
