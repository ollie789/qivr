/**
 * Webpack Plugin for Image Optimization
 * Automatically optimizes images during build
 */

const path = require('path');
const { processImage, generateImageComponent } = require('../scripts/optimize-images');

class ImageOptimizationPlugin {
  constructor(options = {}) {
    this.options = {
      formats: ['webp', 'avif'],
      sizes: [320, 640, 768, 1024, 1280, 1536, 1920, 2560],
      quality: {
        jpeg: 85,
        webp: 85,
        avif: 80
      },
      ...options
    };
    
    this.processedImages = new Map();
  }

  apply(compiler) {
    // Hook into asset emission
    compiler.hooks.emit.tapAsync('ImageOptimizationPlugin', async (compilation, callback) => {
      const imageAssets = Object.keys(compilation.assets).filter(asset => 
        /\.(jpg|jpeg|png|gif)$/i.test(asset)
      );

      console.log(`Found ${imageAssets.length} images to optimize`);

      for (const asset of imageAssets) {
        try {
          await this.optimizeAsset(compilation, asset);
        } catch (error) {
          console.error(`Failed to optimize ${asset}:`, error);
        }
      }

      // Generate metadata file
      if (this.processedImages.size > 0) {
        const metadata = Object.fromEntries(this.processedImages);
        const metadataJson = JSON.stringify(metadata, null, 2);
        
        compilation.assets['image-metadata.json'] = {
          source: () => metadataJson,
          size: () => metadataJson.length
        };
      }

      callback();
    });

    // Hook into HTML generation to inject preload hints
    compiler.hooks.compilation.tap('ImageOptimizationPlugin', (compilation) => {
      const HtmlWebpackPlugin = require('html-webpack-plugin');
      
      if (!HtmlWebpackPlugin) return;

      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(
        'ImageOptimizationPlugin',
        (data, callback) => {
          // Add preload hints for critical images
          const criticalImages = this.getCriticalImages(data.assetTags.scripts);
          
          criticalImages.forEach(image => {
            data.assetTags.meta.push({
              tagName: 'link',
              voidTag: true,
              attributes: {
                rel: 'preload',
                as: 'image',
                href: image.href,
                imagesrcset: image.srcset,
                imagesizes: image.sizes
              }
            });
          });

          callback(null, data);
        }
      );
    });
  }

  async optimizeAsset(compilation, assetName) {
    const asset = compilation.assets[assetName];
    const source = asset.source();
    
    // Skip if already processed
    if (this.processedImages.has(assetName)) {
      return;
    }

    const buffer = Buffer.isBuffer(source) ? source : Buffer.from(source);
    const outputPath = path.dirname(assetName);
    const filename = path.basename(assetName, path.extname(assetName));
    
    const metadata = {
      original: assetName,
      formats: {},
      sizes: {}
    };

    // Process different formats and sizes
    for (const format of this.options.formats) {
      for (const size of this.options.sizes) {
        const optimizedName = `${outputPath}/${filename}-${size}.${format}`;
        const optimizedBuffer = await this.processBuffer(buffer, format, size);
        
        if (optimizedBuffer) {
          compilation.assets[optimizedName] = {
            source: () => optimizedBuffer,
            size: () => optimizedBuffer.length
          };
          
          if (!metadata.sizes[size]) {
            metadata.sizes[size] = {};
          }
          metadata.sizes[size][format] = optimizedName;
        }
      }
    }

    this.processedImages.set(assetName, metadata);
  }

  async processBuffer(buffer, format, width) {
    const sharp = require('sharp');
    
    try {
      let pipeline = sharp(buffer).resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      });

      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({ quality: this.options.quality.webp });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality: this.options.quality.avif });
          break;
        default:
          pipeline = pipeline.jpeg({ quality: this.options.quality.jpeg });
      }

      return await pipeline.toBuffer();
    } catch (error) {
      console.error(`Failed to process image to ${format} at ${width}px:`, error);
      return null;
    }
  }

  getCriticalImages(scripts) {
    // Identify critical images based on route chunks
    const criticalImages = [];
    
    // Look for main/index chunks which likely contain hero images
    const mainChunks = scripts.filter(script => 
      /main|index|app/i.test(script.attributes.src)
    );

    // Add preload hints for likely critical images
    if (mainChunks.length > 0) {
      // This would be populated based on your specific needs
      // For now, returning empty array
    }

    return criticalImages;
  }
}

module.exports = ImageOptimizationPlugin;
