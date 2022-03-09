const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const router = express();

router.use(express.json());

router.use(fileUpload());

router.get('/list-videos', (req, res) => {
    const fpath = path.join(__dirname, '/../videos');
    console.log(fpath);
    fs.readdir(fpath, (err, files) => {
        if(err) {
            return console.log('Unable to scan directory: ' + err);
            res.status(500).send();
        } 
        files.forEach((file) => {
            files[files.indexOf(file)] = file.split('.')[0];
        });
        res.send(files);
    });
});

router.get('/videos/:video', (req, res) => {
    res.sendFile(path.join(__dirname, '/../pages/video.html'));
});

router.get('/', (req, res) => {
    res.redirect('/nyayoutube/browse');
});

router.get('/browse', (req, res) => {
    res.sendFile(path.join(__dirname, '/../pages/browse.html'));
});
router.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '/../graphics/favicon.png'));
});

router.get('/videos/stream/:video', (req, res) => {
    const fpath = path.join(__dirname, `/../videos/${req.params.video}.mp4`);
    if(!fs.existsSync(fpath)) {
        res.status(404).send("Video does not exist");
        return;
    }
    const stat = fs.statSync(fpath)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] 
        ? parseInt(parts[1], 10)
        : fileSize-1
        const chunksize = (end-start)+1
        const file = fs.createReadStream(fpath, {start, end})
        const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        }
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head)
        fs.createReadStream(fpath).pipe(res)
    }
});

router.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname + '/../pages/upload.html'));
});

router.post('/upload', async (req, res) => {
    try {
        const bytes = req.files.file.data;
    } catch(err) {
        if(err) {
            return res.status(400).send("No file sent");
        }
    }
    const extension = req.body.extension;
    const fname = req.body.title + extension;
    const fpath = path.join(__dirname, `/../videos/${fname}`);
    await fs.writeFileSync(fpath, bytes, 'binary',  (err)=> {
        if (err) {
            console.log("There was an error writing the image")
        }
        else {
            console.log("Written File :" + filePath)
        }
    });
    console.log("file uploaded");
    res.send(`Successfully uploaded video ${req.body.title}`)
});



module.exports = router;