import express from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for development
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
    app.use(cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// API routes
app.get('/api/images/:folder', async (req, res) => {
    try {
        const result = await cloudinary.search
            .expression(`folder:${req.params.folder}/*`)
            .sort_by('public_id', 'desc')
            .max_results(500)
            .execute();
        res.json(result.resources);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files in production
if (!isDev) {
    app.use(express.static(path.join(__dirname, 'dist')));

    // Handle client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${isDev ? 'development' : 'production'} mode on port ${PORT}`);
}).on('error', (error) => {
    console.error('Error starting server:', error);
    process.exit(1);
});