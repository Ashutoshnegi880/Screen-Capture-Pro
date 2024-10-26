const express = require('express');
const multer = require('multer');
const path = require('path');
const handbrake = require('handbrake-js');
const app = express();
const PORT = 5500;

// Define the destination path for saving videos
const savePath = path.join('C:', 'Users', 'NEGI', 'Videos', 'Captures');
app.use(express.static(path.join(__dirname, "public")));

// Configure multer to save files to the specified path
const storage = multer.diskStorage({
    destination: savePath,
    filename: (req, file, cb) => {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        cb(null, `screen_${timestamp}.mp4`);
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    const filePath = path.resolve(__dirname+"/public", 'index.html');
    res.sendFile(filePath);
});
app.post('/upload', upload.single('video'), (req, res) => {
    const uploadedFilePath = path.join(savePath, req.file.filename);
    const outputFilePath = path.join(savePath, `encoded_${req.file.filename}`);

    // Re-encode the video using Handbrake
    handbrake
        .spawn({
            input: uploadedFilePath,
            output: outputFilePath,
            preset: 'Fast 1080p30', // Use appropriate Handbrake preset
            format: 'mp4' // Ensure output format is MP4
        })
        .on('error', err => {
            console.error('Error encoding video:', err);
            res.status(500).send({ error: 'Error encoding video' });
        })
        .on('progress', progress => {
            console.log(
              'Percent complete: %s, ETA: %s',
              progress.percentComplete,
              progress.eta
            )
          })
        .on('end', () => {
            console.log('Video encoded successfully');
            res.send({ status: 'File saved and encoded successfully!' });
        });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
