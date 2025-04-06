const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { publishToKafka } = require('./kafka.service');


const JobSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    default: uuidv4 
  },
  type: { 
    type: String, 
    default: 'compute' 
  },
  status: { 
    type: String, 
    default: 'queued' 
  },
  payload: { 
    type: mongoose.Schema.Types.Mixed 
  },
  result: { 
    type: mongoose.Schema.Types.Mixed 
  }
}, { timestamps: true });

const Job = mongoose.model('Job', JobSchema);


exports.createJob = async (req, res) => {
  try {
    const job = new Job({
      type: req.body.type,
      payload: req.body.payload,
    });

    await job.save();
    logger.info('Job created', { jobId: job._id });

    await publishToKafka('jobs.compute', job);
    
    res.status(201).json({jobId: job._id});

  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const update = {
      status: req.body.status,
    };
  
    if (req.body.result) 
      update.result = req.body.result;
      
    const job = await Job.findByIdAndUpdate(req.params.id, update, { new: true });
  
    if (!job) {
      logger.warn('Job not found', { jobId: req.params.id });
      return res.status(404).json({ error: 'Job not found' });
    }
  
    logger.info('Job updated', { jobId: job._id });
    res.json(job);
  
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

exports.getJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
  
    if (!job) {
      logger.warn('Job not found', { jobId: req.params.id });
      return res.status(404).json({ error: 'Job not found' });
    }
  
    res.json(job);
  
  } catch (error) {
    logger.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};