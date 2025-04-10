const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({ clientId: 'api-server', brokers: ['kafka:9092'] });
const producer = kafka.producer();

//publishes the message to kafka topic, topic is autocreated if not exists
async function publishToKafka(topic, message) {
  try {
  
    await producer.connect();
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    
    logger.info('Message sent to Kafka', { topic, jobId: message._id });
    await producer.disconnect();
  
  } catch (error) {
    logger.error('Error sending message to Kafka:', error);
    throw error;
  }
}

module.exports = { publishToKafka };