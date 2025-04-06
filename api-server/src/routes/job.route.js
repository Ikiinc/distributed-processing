const express = require('express');
const router = express.Router();
const { createJob, updateJobStatus, getJobStatus } = require('../services/job.service');

router.post('/', createJob);
router.get('/:id', getJobStatus);
router.patch('/:id', updateJobStatus);

module.exports = router;