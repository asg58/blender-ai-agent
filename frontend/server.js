const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Mime types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create a simple HTTP server
const server = http.createServer((req, res) => {
    console.log(`Request for ${req.url}`);
    
    // Normalize the URL (remove query parameters)
    let url = req.url.split('?')[0];
    
    // If the URL is just '/', serve index.html
    if (url === '/') {
        url = '/index.html';
    }
    
    // Get the file path
    const filePath = path.join(__dirname, url);
    
    // Get the file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    
    // Get the content type based on the file extension
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found, serve a 404
                fs.readFile(path.join(__dirname, '/index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(`Error loading index.html: ${err.code}`);
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop the server`);
}); 