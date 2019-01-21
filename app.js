const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const sourceDir = 'dist';

const port = process.env.PORT || 8082;

app.use(express.static(sourceDir));
app.use(cors());

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api', require('./src/server/routes/graph'));

app.listen(port, () => {
    console.log(`Express web server started: http://localhost:${port}`);
    console.log(`Serving content from /${sourceDir}/`);
});
