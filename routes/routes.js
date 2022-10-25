const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const router = express();

router.use(express.json());

router.use(fileUpload());

async function readJsonFromFile(file) {
    return JSON.parse(fs.readFileSync(file));
}

async function writeJsonToFile(json, file) {
    fs.writeFileSync(file, JSON.stringify(json));
}

router.get('/list-videos', async (req, res) => {
    const fpath = path.join(__dirname, '/../videos');
    console.log(fpath);
    fs.readdir(fpath, async(err, files) => {
        if(err) {
            return console.log('Unable to scan directory: ' + err);
            res.status(500).send();
        } 
        files_data = []
        const data_fname = path.join(__dirname, '/../data/data.json');
        let data = await readJsonFromFile(data_fname);
        files.forEach((file) => {
            try {
                const video = data["videos"].find(video => video.title == file.split('.')[0])
                const loves = video["loves"];
                const hates = video["hates"];
                const comments = video["comments"];
                obj = { title: file.split('.')[0], loves: loves, hates: hates, comments: comments };
            } catch(e) {
                console.log(e);
                obj = { title: file.split('.')[0], loves: 0, hates: 0, comments: []};
            }
            files_data.push(obj);
        });
        res.send(files_data);
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

router.post('/react', async(req, res) => {
    const data_fname = path.join(__dirname, '/../data/data.json');
    let data = await readJsonFromFile(data_fname);
    try {
        let video = data["videos"].find(video => video.title == req.body.title);
        switch(req.body.reaction) {
            case 'loves':
                video['loves'] = video['loves']+1;
            break;
            case 'hates':
                video['hates'] = video['hates']+1;
            break;
            case 'comment':
                video['comments'].push(req.body.comment);
            break;
        }
        data["videos"][data["videos"].indexOf(data["videos"].find(video => video.title == req.body.title))] = video;
    } catch(err) {
        return res.status(418).send("Bad request");
    }
    await writeJsonToFile(data, data_fname);
    res.redirect(req.body.redir);
});

router.get('/sync', async(req, res) => {
    const fpath = path.join(__dirname, '/../videos');
    fs.readdir(fpath, async(err, files) => {
        if(err) {
            return console.log('Unable to scan directory: ' + err);
            res.status(500).send();
        } 
        files_data = []
        const data_fname = path.join(__dirname, '/../data/data.json');
        let data = await readJsonFromFile(data_fname);
        files.forEach(async(file) => {
            const data_fname = path.join(__dirname, '/../data/data.json');
            let data = await readJsonFromFile(data_fname);
            let obj = {title: file.split('.')[0], loves: 0, hates: 0, comments: []};
            data["videos"].push(obj);
            await writeJsonToFile(data, data_fname);
        });
        res.send(files_data);
    });
});

router.post('/upload', async (req, res) => {
    var bytes;
    try {
        bytes = req.files.file.data;
    } catch(err) {
        if(err) {
            return res.status(400).send("No file sent");
        }
    }
    const data_fname = path.join(__dirname, '/../data/data.json');
    let data = await readJsonFromFile(data_fname);
    const extension = req.body.extension;
    const title = (req.body.title).replace('/', '').replace('<', '').replace('>', '')
    let obj = {title: title, loves: 0, hates: 0, comments: []};
    data["videos"].push(obj);
    await writeJsonToFile(data, data_fname);
    const fname = title + extension;
    const fpath = path.join(__dirname, `/../videos/${fname}`);
    try {
        await fs.writeFileSync(fpath, bytes, 'binary',  (err)=> {
            if (err) {
                console.log("There was an error writing the image")
            }
            else {
                console.log("Written File :" + filePath)
            }
        });
    } catch(err) {
        if(err) {
            return res.status(418).send("Bad request");
        }
    }
    console.log("file uploaded");
    res.send(`Successfully uploaded video ${title}`)
});



module.exports = router;