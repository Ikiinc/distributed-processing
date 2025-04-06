const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const logger = require('./utils/logger');
const jobRouter = require('./routes/job.route');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/jobs', jobRouter);

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  logger.info('MongoDB connected');
  app.listen(PORT, () => {
    logger.info(`api-server running on port ${PORT}`);
  });
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
});