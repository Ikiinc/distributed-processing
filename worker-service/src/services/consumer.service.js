const { Kafka } = require('kafkajs');
const axios = require('axios');
const winston = require('winston');
const logger = require('../utils/logger');
const crypto = require('crypto');

const kafka = new Kafka({
  clientId: 'worker-node',
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'job-workers' });
let isRunning = false;

//calculate hash
function hashString(text) {

  return crypto.createHash('sha256').update(text).digest('hex');
}

async function startConsumer() {
  if (isRunning) return;

  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');

    await consumer.subscribe({ topic: 'jobs.compute', fromBeginning: false });
    logger.info('Subscribed to topic: jobs.compute');

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const job = JSON.parse(message.value.toString());
          logger.info('Received job', { jobId: job._id });

          await axios.patch(`http://api-server:3000/jobs/${job._id}`, {
            status: 'processing',
          });

          //2 secs wait simulation
          await new Promise((r) => setTimeout(r, 2000));

          const hash = hashString(job.payload.input || '');
          

          await axios.patch(`http://api-server:3000/jobs/${job._id}`, {
            status: 'completed',
            result: { message: 'Success', value: hash },
          });

          logger.info('Job completed', { jobId: job._id });
        } catch (err) {
          logger.error('Error processing message:', err);
        }
      },
    });

    isRunning = true;
  } catch (error) {
    logger.error('Error starting Kafka consumer:', error);
    throw error;
  }
}

async function stopConsumer() {
  if (!isRunning) return;
  
  try {
    
    await consumer.disconnect();
    isRunning = false;

    logger.info('Kafka consumer disconnected');

  } catch (error) {
    logger.error('Error stopping Kafka consumer:', error);
    throw error;
  }
}

module.exports = { startConsumer, stopConsumer };   