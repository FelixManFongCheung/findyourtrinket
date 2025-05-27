import './styles.css'
import { getImagesFromFolder } from './image';
import { Vibrant } from "node-vibrant/browser";

let imageData = new Map(); // Stores all image data
let colorFilter = [];
let originalImageData = null; // Store original image data

document.querySelector('#app').innerHTML = `
<div class="flex justify-center items-center w-screen h-screen">
    <div class="absolute top-0 left-0 w-full h-full z-10">
      <div id="color-buttons-container" class="h-full w-full grid grid-cols-3 grid-rows-3">
        <button id="red-btn" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        </button>
        <button id="blue-btn" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        </button>
        <button id="green-btn" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        </button>
        <button id="yellow-btn" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        </button>
        <button id="all" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center">
            <!-- Text will be dynamically inserted here -->
          </div>
        </button>
        <button id="purple-btn" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        </button>
        <button id="orange-btn" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        </button>
        <button id="cyan-btn" class="cursor-pointer w-full h-full opacity-0 backdrop-filter backdrop-blur-sm hover:opacity-40 transition-all duration-300 ease-in-out group">
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        </button>
      </div>
    </div>
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
          const hsl = palette.Vibrant?.hsl || [0, 0, 0];

          // Normalize hue to 0-360 range and debug
          const normalizedHue = hsl[0] * 360; // Convert from 0-1 to 0-360

          // Determine the predominant color name based on normalized HSL
          const predominantColor = getColorName(normalizedHue);

          return {
            data: {
              ...imageData,
              predominantColor,
              hsl // store original HSL for debugging
            },
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

    // Store sorted images and keep a copy of original data
    imageData = {
      Italia: sortedImages.map(({ data }) => data)
    };
    originalImageData = { ...imageData }; // Keep a copy of all images

    renderImages();
  } catch (error) {
    console.error('Error sorting by color:', error);
    renderImages();
  }
}

// Helper function to convert HSL hue to color name
function getColorName(hue) {
  // Hue is in degrees (0-360)
  let color;
  if (hue === undefined) {
    color = 'grey';
  } else {
    // Make sure hue is within 0-360 range
    hue = ((hue % 360) + 360) % 360;

    if (hue >= 0 && hue < 30) color = 'red';
    else if (hue >= 30 && hue < 60) color = 'orange';
    else if (hue >= 60 && hue < 90) color = 'yellow';
    else if (hue >= 90 && hue < 150) color = 'green';
    else if (hue >= 150 && hue < 210) color = 'cyan';
    else if (hue >= 210 && hue < 270) color = 'blue';
    else if (hue >= 270 && hue < 330) color = 'purple';
    else color = 'red';
  }

  if (!colorFilter.includes(color)) {
    colorFilter.push(color);
  }
  return color;
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

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('#color-buttons-container button');

  // Function to update button states
  const updateButtonStates = (activeButton) => {
    buttons.forEach(btn => {
      if (btn.id === 'all') {
        btn.innerHTML = `
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center">
            ${activeButton !== 'all' ? '<span class="text-black opacity-50 text-8xl font-semibold font-inter">All</span>' : ''}
          </div>
        `;
      } else {
        btn.disabled = (activeButton !== 'all');
        btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
        btn.innerHTML = `
          <div class="w-full h-full group-hover:backdrop-blur-md flex items-center justify-center"></div>
        `;
      }
    });
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const color = button.id.replace('-btn', '');

      if (color === 'all') {
        // Reset to original data
        imageData = { ...originalImageData };
        updateButtonStates('all');
      } else {
        // Filter by color
        const filteredImageData = {};
        Object.entries(originalImageData).forEach(([category, images]) => {
          filteredImageData[category] = images.filter(image => image.predominantColor === color);
        });
        imageData = filteredImageData;
        updateButtonStates(button.id);
      }

      renderImages();
    });
  });

  // Initialize button states
  updateButtonStates('all');
});