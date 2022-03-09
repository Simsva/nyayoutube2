const config = require("./config.json")

const express = require('express');
const fs = require('fs');
const app = express();
const PORT = config.port;

const routes = require('./routes/routes.js');

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.use('/', routes);
