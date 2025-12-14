const vision = require('@google-cloud/vision');
require('dotenv').config();

// Initialize Google Cloud Vision client
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

/**
 * Analyze image and extract tags relevant for gifting
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} - Extracted tags and metadata
 */
async function analyzeImage(imagePath) {
  try {
    // Perform multiple detection types
    const [labelResult] = await client.labelDetection(imagePath);
    const [objectResult] = await client.objectLocalization(imagePath);
    const [textResult] = await client.textDetection(imagePath);
    const [propertiesResult] = await client.imageProperties(imagePath);

    const labels = labelResult.labelAnnotations || [];
    const objects = objectResult.localizedObjectAnnotations || [];
    const texts = textResult.textAnnotations || [];
    const colors = propertiesResult.imagePropertiesAnnotation?.dominantColors?.colors || [];

    // Extract relevant information
    const keywords = new Set();
    const confidenceScores = {};

    // Add labels as keywords
    labels.forEach((label) => {
      if (label.score > 0.6) {
        keywords.add(label.description.toLowerCase());
        confidenceScores[label.description.toLowerCase()] = label.score;
      }
    });

    // Add object names as keywords
    objects.forEach((object) => {
      if (object.score > 0.6) {
        keywords.add(object.name.toLowerCase());
        confidenceScores[object.name.toLowerCase()] = object.score;
      }
    });

    // Extract text (for brand names, book titles, etc.)
    const detectedText = texts.length > 0 ? texts[0].description : '';

    // Extract dominant colors
    const dominantColors = colors
      .slice(0, 3)
      .map((color) => {
        const { red, green, blue } = color.color;
        return rgbToColorName(red, green, blue);
      });

    dominantColors.forEach((color) => keywords.add(color));

    // Generate a comprehensive description
    const description = generateDescription(labels, objects);

    // Auto-categorize
    const category = categorizeItem(Array.from(keywords));

    // Estimate age range
    const ageRanges = estimateAgeRange(Array.from(keywords));

    // Detect themes
    const themes = detectThemes(Array.from(keywords));

    return {
      category,
      ageRanges,
      keywords: Array.from(keywords),
      themes,
      description,
      detectedText,
      dominantColors,
      confidenceScores,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image with Vision API');
  }
}

/**
 * Generate a natural language description from labels and objects
 */
function generateDescription(labels, objects) {
  const primaryLabels = labels.slice(0, 3).map((l) => l.description);
  const primaryObjects = objects.slice(0, 2).map((o) => o.name);

  const combined = [...new Set([...primaryObjects, ...primaryLabels])];
  return combined.join(', ');
}

/**
 * Categorize item based on detected keywords
 */
function categorizeItem(keywords) {
  const categoryMap = {
    toys: ['toy', 'doll', 'action figure', 'stuffed animal', 'plush', 'lego', 'building blocks', 'plaything'],
    'games-puzzles': ['game', 'puzzle', 'board game', 'card game', 'jigsaw'],
    books: ['book', 'novel', 'magazine', 'comic', 'textbook'],
    kitchen: ['pot', 'pan', 'utensil', 'kitchenware', 'cookware', 'bakeware', 'knife', 'spatula', 'bowl', 'plate', 'cup', 'mug'],
    'home-decor': ['vase', 'picture frame', 'candle', 'decoration', 'ornament', 'sculpture', 'figurine', 'lamp'],
    electronics: ['electronic', 'gadget', 'device', 'computer', 'phone', 'tablet', 'speaker', 'headphones'],
    'clothing-accessories': ['clothing', 'shirt', 'pants', 'dress', 'hat', 'scarf', 'jewelry', 'watch', 'bag', 'purse'],
    'stationery-craft': ['pen', 'pencil', 'notebook', 'paper', 'craft', 'art supply', 'marker', 'crayon'],
    'sports-outdoors': ['ball', 'sports equipment', 'bicycle', 'outdoor', 'camping', 'hiking'],
    collectibles: ['collectible', 'antique', 'vintage', 'memorabilia'],
    'wellness-beauty': ['cosmetic', 'skincare', 'beauty', 'perfume', 'wellness'],
  };

  for (const [category, terms] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => terms.some((term) => keyword.includes(term) || term.includes(keyword)))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Estimate appropriate age range based on detected content
 */
function estimateAgeRange(keywords) {
  const ageRanges = [];

  const babyKeywords = ['baby', 'infant', 'rattle', 'pacifier', 'bottle', 'crib'];
  const youngChildKeywords = ['toddler', 'preschool', 'stuffed animal', 'plush', 'simple toy', 'building blocks'];
  const olderChildKeywords = ['toy', 'game', 'puzzle', 'lego', 'action figure', 'doll'];
  const teenKeywords = ['electronics', 'gadget', 'sports', 'fashion', 'tech'];
  const adultKeywords = ['wine', 'coffee', 'kitchen', 'home decor', 'book', 'tool'];

  if (keywords.some((k) => babyKeywords.some((bk) => k.includes(bk)))) {
    ageRanges.push('baby');
  }
  if (keywords.some((k) => youngChildKeywords.some((yk) => k.includes(yk)))) {
    ageRanges.push('young-child');
  }
  if (keywords.some((k) => olderChildKeywords.some((ok) => k.includes(ok)))) {
    ageRanges.push('older-child');
  }
  if (keywords.some((k) => teenKeywords.some((tk) => k.includes(tk)))) {
    ageRanges.push('teen');
  }
  if (keywords.some((k) => adultKeywords.some((ak) => k.includes(ak)))) {
    ageRanges.push('adult');
  }

  // If no specific age detected, mark as any-age
  if (ageRanges.length === 0) {
    ageRanges.push('any-age');
  }

  return ageRanges;
}

/**
 * Detect themes/interests from keywords
 */
function detectThemes(keywords) {
  const themes = [];

  const themeMap = {
    educational: ['educational', 'learning', 'school', 'teach', 'science', 'math'],
    creative: ['art', 'craft', 'creative', 'drawing', 'painting', 'music'],
    outdoor: ['outdoor', 'nature', 'camping', 'hiking', 'sports'],
    indoor: ['indoor', 'board game', 'puzzle', 'reading'],
    tech: ['electronic', 'tech', 'digital', 'computer', 'gadget'],
    cooking: ['cooking', 'kitchen', 'baking', 'food'],
    reading: ['book', 'novel', 'reading', 'magazine'],
    animals: ['animal', 'pet', 'dog', 'cat', 'wildlife'],
    vehicles: ['car', 'truck', 'vehicle', 'train', 'airplane'],
  };

  for (const [theme, terms] of Object.entries(themeMap)) {
    if (keywords.some((keyword) => terms.some((term) => keyword.includes(term) || term.includes(keyword)))) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Convert RGB to approximate color name
 */
function rgbToColorName(r, g, b) {
  const colors = [
    { name: 'red', rgb: [255, 0, 0] },
    { name: 'blue', rgb: [0, 0, 255] },
    { name: 'green', rgb: [0, 255, 0] },
    { name: 'yellow', rgb: [255, 255, 0] },
    { name: 'orange', rgb: [255, 165, 0] },
    { name: 'purple', rgb: [128, 0, 128] },
    { name: 'pink', rgb: [255, 192, 203] },
    { name: 'brown', rgb: [165, 42, 42] },
    { name: 'black', rgb: [0, 0, 0] },
    { name: 'white', rgb: [255, 255, 255] },
    { name: 'gray', rgb: [128, 128, 128] },
  ];

  let minDistance = Infinity;
  let closestColor = 'unknown';

  colors.forEach((color) => {
    const distance = Math.sqrt(
      Math.pow(r - color.rgb[0], 2) +
      Math.pow(g - color.rgb[1], 2) +
      Math.pow(b - color.rgb[2], 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  });

  return closestColor;
}

module.exports = {
  analyzeImage,
};
