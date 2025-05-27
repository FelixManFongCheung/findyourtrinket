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
    const categorizedImages = await getImagesFromFolder('Italia');

    // Convert the categorizedImages object into the format your code expects
    imageData = Object.entries(categorizedImages).reduce((acc, [folder, images]) => {
      acc[folder] = images.map(image => ({
        url: image.secure_url,
        category: folder
      }));
      return acc;
    }, {});

    // Extract colors and sort images
    await extractAndSortColors();
  } catch (error) {
    console.error('Error loading images:', error);
  }
}

async function extractAndSortColors() {
  try {
    const colorPromises = Object.entries(imageData).flatMap(([category, images]) =>
      images.map(async (imageData) => {
        try {
          const palette = await Vibrant.from(imageData.url).getPalette();
          return {
            data: imageData,
            colors: palette
          };
        } catch (err) {
          console.error(`Error processing image ${imageData.url}:`, err);
          return null;
        }
      })
    );

    const imageColors = (await Promise.all(colorPromises)).filter(Boolean);
    const sortedImages = sortByColorPalette(imageColors);

    // Store sorted images back in the structure
    imageData = {
      Italia: sortedImages.map(({ data }) => data)
    };

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
  const imageCount = Object.values(imageData).reduce((count, images) => count + images.length, 0);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let renderTime = 0;

  let bestLayout = null;
  let smallestError = Infinity;

  // Start with a more flexible range of aspect ratios and smaller steps
  for (let aspectRatio = 1.1; aspectRatio <= 2.5; aspectRatio += 0.05) {
    // From the equation: width = sqrt((windowWidth * windowHeight * aspectRatio) / imageCount)
    const theoreticalWidth = Math.sqrt((viewportWidth * viewportHeight * aspectRatio) / imageCount);

    // Calculate columns and rows
    const cols = Math.max(1, Math.floor(viewportWidth / theoreticalWidth));
    const rows = Math.ceil(imageCount / cols);

    // Calculate actual dimensions
    const actualWidth = viewportWidth / cols;
    const actualHeight = actualWidth / aspectRatio;

    const totalArea = cols * rows * (actualWidth * actualHeight);
    const targetArea = viewportWidth * viewportHeight;
    const error = Math.abs(totalArea - targetArea);

    // Relaxed validation criteria
    const isValidLayout =
      actualWidth > 0 &&
      actualHeight > 0 &&
      rows * actualHeight <= viewportHeight * 1.2; // Allow slight overflow

    if (isValidLayout && (bestLayout === null || error < smallestError)) {
      smallestError = error;
      bestLayout = {
        cols,
        rows,
        width: actualWidth,
        height: actualHeight
      };
    }
  }

  // Fallback layout if no optimal solution found
  if (!bestLayout) {
    const cols = Math.max(1, Math.floor(Math.sqrt(imageCount)));
    bestLayout = {
      cols,
      rows: Math.ceil(imageCount / cols),
      width: viewportWidth / cols,
      height: (viewportWidth / cols) / 1.5 // Default 1.5 aspect ratio
    };
  }

  // Use the best layout found
  const { width: imageWidth, height: imageHeight } = bestLayout;

  // Set container styles
  container.style.width = `${viewportWidth}px`;
  container.style.height = `${viewportHeight}px`;
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.alignContent = 'flex-start';
  container.style.gap = '0';
  container.style.justifyContent = 'flex-start';

  // Render images with the calculated dimensions
  Object.values(imageData).forEach(images => {
    images.forEach(data => {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = `object-cover opacity-0 block transition-all duration-${renderTime}ms`;

      const img = document.createElement('img');
      img.src = data.url;
      img.alt = 'Gallery image';
      img.className = 'w-full h-full object-cover';
      img.crossOrigin = 'anonymous';

      imageWrapper.appendChild(img);
      container.appendChild(imageWrapper);

      imageWrapper.style.width = `${imageWidth}px`;
      imageWrapper.style.height = `${imageHeight}px`;
      imageWrapper.style.opacity = '0';
      imageWrapper.style.transition = `opacity ${renderTime}ms ease-in-out`;
      imageWrapper.style.flexGrow = '0';
      imageWrapper.style.flexShrink = '0';
      imageWrapper.style.margin = '0';

      imageWrapper.offsetHeight;

      requestAnimationFrame(() => {
        imageWrapper.style.opacity = '1';
      });

      renderTime += 50;
    });
  });
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