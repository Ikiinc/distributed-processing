const express = require('express');
const router = express.Router();
const { createJob, updateJobStatus, getJobStatus } = require('../services/job.service');

//creates the new job
router.post('/', createJob);

//Fetches the job status (queued, processing, completed, failed)
router.get('/:id', getJobStatus);

//Updates the job status and job result
router.patch('/:id', updateJobStatus);

module.exports = router;