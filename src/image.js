// This uses Vite's glob import feature to load all images
const imageModules = import.meta.glob('../archives/**/*.{jpg,jpeg,png,gif,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
});

export async function getImagesFromFolder(folderName) {
    const categorizedImages = {};
    // Convert the folder name to lowercase for case-insensitive matching
    const lowerFolderName = folderName.toLowerCase();

    // Group images by their immediate parent folder
    Object.entries(imageModules).forEach(([path, url]) => {
        // Extract the folder name from the path
        const match = path.match(/\/archives\/([^/]+)\//);
        if (!match) return;

        const folder = match[1].toLowerCase();
        if (!categorizedImages[folder]) {
            categorizedImages[folder] = [];
        }

        // Create an object that matches your current data structure
        categorizedImages[folder].push({
            secure_url: url,
            display_name: path.split('/').pop(),
            public_id: path.replace('/archives/', '')
        });
    });

    // Sort images by filename
    Object.values(categorizedImages).forEach(images => {
        images.sort((a, b) => b.display_name.localeCompare(a.display_name));
    });

    return categorizedImages;
}