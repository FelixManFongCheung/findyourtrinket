import './styles.css'
import { getImagesFromFolder } from './image';
import { Vibrant } from "node-vibrant/browser";

let imageData = new Map(); // Stores all image data

document.querySelector('#app').innerHTML = `
<div class="flex justify-center items-center w-screen h-screen">
    <div id="image-container" class="flex flex-wrap">
    </div>
</div>
`

async function loadImages() {
  try {
    const images = await getImagesFromFolder('Italia');

    // Store images in Map
    for (const image of images) {
      imageData.set(image.public_id, {
        url: image.secure_url,
        filename: image.display_name,
      });
    }

    // Extract colors and sort images
    await extractAndSortColors();
  } catch (error) {
    console.error('Error loading images:', error);
  }
}

async function extractAndSortColors() {
  try {
    const colorPromises = Array.from(imageData.entries()).map(async ([id, data]) => {
      try {
        const palette = await Vibrant.from(data.url).getPalette();
        return {
          id,
          data,
          colors: palette
        };
      } catch (err) {
        console.error(`Error processing image ${id}:`, err);
        return null;
      }
    });

    const imageColors = (await Promise.all(colorPromises)).filter(Boolean);
    const sortedImages = sortByColorPalette(imageColors);
    console.log(sortedImages[0]);

    // Create new Map with sorted images
    imageData = new Map(
      sortedImages.map(({ id, data }) => [id, data])
    );

    renderImages();
  } catch (error) {
    console.error('Error sorting by color:', error);
    renderImages(); // Fallback to unsorted render
  }
}

function sortByColorPalette(imageColors) {
  return imageColors.sort((a, b) => {
    try {
      // Get the Vibrant swatch from each palette
      const colorA = a.colors.Vibrant || { hsl: [0, 0, 0] };
      const colorB = b.colors.Vibrant || { hsl: [0, 0, 0] };

      // Compare by hue first
      if (colorA.hsl[0] !== colorB.hsl[0]) {
        return colorA.hsl[0] - colorB.hsl[0];
      }
      // Then by saturation
      if (colorA.hsl[1] !== colorB.hsl[1]) {
        return colorB.hsl[1] - colorA.hsl[1];
      }
      // Finally by lightness
      return colorB.hsl[2] - colorA.hsl[2];
    } catch (error) {
      console.error('Error comparing colors:', error);
      return 0;
    }
  });
}

function renderImages() {
  const container = document.getElementById('image-container');
  if (!container) return;

  container.innerHTML = '';
  const imageCount = imageData.size;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let renderTime = 0;

  // Calculate aspect ratio considering viewport orientation
  const viewportRatio = viewportHeight / viewportWidth;
  const optimalCols = Math.sqrt(imageCount / viewportRatio);
  const optimalRows = Math.ceil(imageCount / Math.floor(optimalCols));
  const cols = Math.floor(optimalCols);

  // Calculate exact image dimensions
  const imageWidth = Math.floor(viewportWidth / cols);
  const imageHeight = Math.floor(viewportHeight / optimalRows);

  // Set container to full viewport size
  container.style.width = `${viewportWidth}px`;
  container.style.height = `${viewportHeight}px`;

  for (const [id, data] of imageData) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = `object-cover opacity-0 block transition-all duration-${renderTime}ms`;

    const img = document.createElement('img');
    img.src = data.url;
    img.alt = 'Gallery image';
    img.className = 'w-full h-full object-cover';
    img.crossOrigin = 'anonymous'; // Required for Vibrant.js

    imageWrapper.appendChild(img);
    container.appendChild(imageWrapper);

    imageWrapper.style.width = `${imageWidth}px`;
    imageWrapper.style.height = `${imageHeight}px`;
    imageWrapper.style.opacity = '0';
    imageWrapper.style.transition = `opacity ${renderTime}ms ease-in-out`;

    imageWrapper.offsetHeight;

    requestAnimationFrame(() => {
      imageWrapper.style.opacity = '1';
    });

    renderTime += 50;
  }
}

// Add window resize handler
window.addEventListener('resize', () => {
  renderImages();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadImages);
} else {
  loadImages();
}