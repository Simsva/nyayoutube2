const express = require('express');
const fs = require('fs');
const app = express();
const config = require("./config.json")

const routes = require('./routes/routes.js');

app.listen(config.PORT, () => console.log(`Listening on port ${config.PORT}`));

app.use('/', routes);
