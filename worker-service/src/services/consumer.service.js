const { Kafka } = require('kafkajs');
const axios = require('axios');
const winston = require('winston');
const logger = require('../utils/logger');
const crypto = require('crypto');

const kafka = new Kafka({
  clientId: 'worker-node',
  brokers: [process.env.KAFKA_BROKER],
});

//consumer group
const consumer = kafka.consumer({ 
  groupId: 'job-workers'
});

let isRunning = false;

//calculate hash
function hashString(text) {

  return crypto.createHash('sha256').update(text).digest('hex');
}

// starts kafka consumer loop by subscribing to jobs.compute topic
// we can extend the the consumer by subscribing to other topics as well.
async function startConsumer() {
  if (isRunning) return;

  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');

    await consumer.subscribe({ topic: 'jobs.compute', fromBeginning: false });
    logger.info('Subscribed to topic: jobs.compute');

    await consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const job = JSON.parse(message.value.toString());
          logger.info('Received job', { jobId: job._id });

          //update job status to processing
          await axios.patch(`http://api-server:3000/jobs/${job._id}`, {
            status: 'processing',
          });

          // Simulate failure for specific job
          const ageInSeconds = (Date.now() - new Date(job.createdAt)) / 1000;

          if (job.payload?.simulateCrash && ageInSeconds < 3 ) {
            logger.warn('crash simulation before job completion...');
            process.exit(1); 
          }

          //2 secs wait simulation
          await new Promise((r) => setTimeout(r, 2000));

          const hash = hashString(job.payload.input || '');
          
          //update job status to completed
          await axios.patch(`http://api-server:3000/jobs/${job._id}`, {
            status: 'completed',
            result: { message: 'Success', value: hash },
          });

          logger.info('Job completed', { jobId: job._id });

          //commit offset
          const offsetToCommit = (Number(message.offset) + 1).toString();
          await consumer.commitOffsets([
            { topic, partition, offset: offsetToCommit },
          ]);

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

//stops kafka consumer
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