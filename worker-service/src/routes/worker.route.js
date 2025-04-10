const express = require('express');
const router = express.Router();
const { startConsumer, stopConsumer } = require('../services/consumer.service');
const winston = require('winston');
const logger = require('../utils/logger');

//health endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

//Helper to start kafka consumer
router.post('/start', async (req, res) => {

  try {
    await startConsumer();

    logger.info('Consumer started');
    res.json({ status: 'consumer started' });

  } catch (error) {
    logger.error('Failed to start consumer:', error);
    res.status(500).json({ error: 'Failed to start consumer' });
  }

});

//Helper to stop kafka consumer
router.post('/stop', async (req, res) => {
  try {
    await stopConsumer();

    logger.info('Consumer stopped');
    res.json({ status: 'consumer stopped' });
  
  } catch (error) {
    logger.error('Failed to stop consumer:', error);
    res.status(500).json({ error: 'Failed to stop consumer' });
  }

});

module.exports = router;