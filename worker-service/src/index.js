const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const winston = require('winston');
const workerRouter = require('./routes/worker.route');
const logger = require('./utils/logger');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(morgan('combined'));

app.use('/', workerRouter);

app.listen(PORT, () => {
  logger.info(`Worker service listening on port ${PORT}`);
});