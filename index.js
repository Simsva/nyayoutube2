const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 5000;

const routes = require('./routes/routes.js');

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.use('/', routes);