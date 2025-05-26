export async function getImagesFromFolder(folderName) {
    try {
        const response = await fetch(`/api/images/${folderName}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}