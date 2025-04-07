const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const winston = require('winston');
const workerRouter = require('./routes/worker.route');
const logger = require('./utils/logger');
const { startConsumer } = require('./services/consumer.service');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(morgan('combined'));

app.use('/', workerRouter);

app.listen(PORT, async () => {
  logger.info(`Worker service listening on port ${PORT}`);
  //10 secs wait simulation
  await new Promise((r) => setTimeout(r, 10000));
  await startConsumer();
});