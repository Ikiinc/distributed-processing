const axios = require('axios');
const { execSync } = require('child_process');

const API_SERVER_URL = 'http://localhost:3000/jobs';

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// As of now worker-service will process type: compute
const jobs = [
  { type: 'compute', payload: { input : "To be hashed first job 1" } },
  { type: 'compute', payload: { input: "To be hashed second job 2", simulateCrash: true } }, // This will crash the worker
  { type: 'compute', payload: { input : "To be hashed final job 3" } },
];

async function submitJob(job) {
  try {
    const result = await axios.post(API_SERVER_URL, job);
    console.log(`Submitted job: ${result.data.jobId}`);
    return result.data.jobId;
  } catch (err) {
    console.error('Failed to submit job:', err.message);
  }
}

async function checkJobStatus(jobId) {
  try {
    const result = await axios.get(`${API_SERVER_URL}/${jobId}`);
    console.log("Job status: ", result.data);
  } catch (err) {
    console.error(`Failed to get status for job ${jobId}:`, err.message);
  }
}

function dockerCompose(cmd) {
  try {
    console.log(`Running: docker compose ${cmd}`);
    execSync(`docker compose ${cmd}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to run docker compose ${cmd}`);
  }
}

async function runDemo() {
  console.log('\n--- Distributed Processing System Demo ---\n\n');
  console.log('\nPls ensure all services are running..\n');
  console.log('\nYou can follow live logs using another terminal:\n');
  console.log('docker compose logs -f worker-service\n');

  console.log('Step 1: Submit first normal job...');
  const jobId1 = await submitJob(jobs[0]);
  await sleep(3000);
  await checkJobStatus(jobId1);

  console.log('\nStep 2: Submit job that crashes worker...');
  const jobId2 = await submitJob(jobs[1]);
  console.log('Waiting for crash to occur...');
  await sleep(3000);
  

  await checkJobStatus(jobId2);
  console.log('\nStep 3: Restart worker-service to recover and reprocess (wait 30 secs)...');
  dockerCompose('restart worker-service');
  await sleep(30000);
  await checkJobStatus(jobId2);

  console.log('\nStep 4: Submit one final job...');
  const jobId3 = await submitJob(jobs[2]);
  await sleep(3000);
  await checkJobStatus(jobId3);

  console.log('\nDemo complete');
}

runDemo();
