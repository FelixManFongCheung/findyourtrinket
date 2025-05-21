export async function getImagesFromFolder(folderName) {
    try {
        const response = await fetch(`http://localhost:3000/api/images/${folderName}`);
        const data = await response.json();
        console.log(data);

        return data;
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}

// Usage example
export async function loadImages() {
    const container = document.getElementById('image-container');
    if (!container) return;

    const images = await getImagesFromFolder('your-folder-name');

    images.forEach(image => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col';

        const img = document.createElement('img');
        img.src = image.secure_url; // Cloudinary provides secure_url
        img.alt = image.public_id;
        img.className = 'w-full h-auto object-cover';

        wrapper.appendChild(img);
        container.appendChild(wrapper);
    });
}

getImagesFromFolder('Italia')