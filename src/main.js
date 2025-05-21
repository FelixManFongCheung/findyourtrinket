import './styles.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { getImagesFromFolder } from './image';

let imageData = new Map(); // Stores all image data
let selectedYear = ''; // Tracks selected year filter

document.querySelector('#app').innerHTML = `
<header class="fixed w-full top-0 left-0 h-16 z-50">
  <nav class="flex items-center justify-center w-full h-full">
    <ul class="flex flex-row justify-between items-center w-[80%] h-full border-b border-gray-200">
      <li>ITALIA</li>
      <li>Archive</li>
      <li><a href="#filter-container">Filter</a></li>
    </ul>
  </nav>
</header>
<div class="p-18">
  <div id="filter-container" class="flex flex-row justify-between items-center w-full h-0 overflow-hidden transition-all duration-300">
    <div id="year-filters" class="p-4 flex flex-wrap gap-2">
        <button 
            class="year-filter px-3 py-1 rounded border ${selectedYear === '' ? 'bg-black text-white' : 'bg-white'}"
            data-year="">
            All Years
        </button>
    </div>
  </div>
  <div class="flex align-items justify-center w-full">
    <div id="image-container" class="w-full max-w-7xl h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
    </div>
  </div>
</div>
`

document.querySelector('a[href="#filter-container"]')?.addEventListener('click', function (e) {
  e.preventDefault();
  const container = document.getElementById('filter-container');
  container?.classList.toggle('h-0');
  container?.classList.toggle('h-auto');
});

async function loadImages() {
  const container = document.getElementById('image-container');
  if (!container) return;

  try {
    const images = await getImagesFromFolder('Italia');

    // Clear existing data
    imageData.clear();

    // Store images in Map
    images.forEach(image => {
      imageData.set(image.public_id, {
        url: image.secure_url,
        filename: image.display_name,
        year: image.display_name.split(',')[1],
        // Add any other metadata you want to store
      });
    });

    renderYearFilters(); // Add year filter buttons
    renderImages(); // Initial render of all images
  } catch (error) {
    console.error('Error loading images:', error);
  }
}

function renderYearFilters() {
  const yearFiltersContainer = document.getElementById('year-filters');
  if (!yearFiltersContainer) return;

  // Clear existing year buttons except "All Years"
  const allYearsButton = yearFiltersContainer.firstElementChild;
  yearFiltersContainer.innerHTML = '';
  yearFiltersContainer.appendChild(allYearsButton);

  // Get unique years from imageData
  const years = new Set();
  for (const [_, data] of imageData) {
    if (data.year) years.add(data.year);
  }

  // Add year filter buttons
  Array.from(years).sort().forEach(year => {
    const button = document.createElement('button');
    button.className = `year-filter px-3 py-1 rounded border hover:bg-black hover:text-white ${selectedYear === year ? 'bg-black text-white' : 'bg-white'}`;
    button.dataset.year = year;
    button.textContent = year;
    button.addEventListener('click', () => {
      selectedYear = selectedYear === year ? '' : year;
      renderYearFilters(); // Update button styles
      renderImages(); // Re-render images
    });
    yearFiltersContainer.appendChild(button);
  });
}

function renderImages() {
  const container = document.getElementById('image-container');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  // Filter and render images
  for (const [id, data] of imageData) {
    // Check year filter
    if (selectedYear === '' || data.year === selectedYear) {
      const textWrapper = document.createElement('p');
      const imageWrapper = document.createElement('div');

      imageWrapper.className = 'aspect-[16/9] w-[300px] px-4 mx-auto';
      textWrapper.className = 'text-center';
      textWrapper.textContent = data.filename;

      const img = document.createElement('img');
      img.src = data.url;
      img.alt = 'Gallery image';
      img.className = 'w-full h-auto object-cover';

      imageWrapper.appendChild(img);
      imageWrapper.appendChild(textWrapper);
      container.appendChild(imageWrapper);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadImages);
} else {
  loadImages();
}