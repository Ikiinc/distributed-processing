# Distributed Processing

## Components
This distributed processing solution has following components

API Server 
  - REST microservice to process the incoming job
  - `Post /jobs `
    - Saves the job in mongodb
    - Publishes the job to kafka topic according to type
  - `Get /jobs/:id `
    - Fetches job details of given id
  - `Patch /jobs/:id `
    - Updates job status and job result  
  
Worker Service
  - Consumer microservice which subscribes to `jobs.compute` topic
  - Computes sha256 hash of the payload input string.
  - This compute processing is just an example, likewise we can extend the worker service to consume from different topics for different job types.
  - When receiving the job from kafka topic, it calls `api-server` Patch endpoint to update status to `processing`
  - After compute processing, it calls `api-server` Patch endpoint to update status to `completed` and `result` with computed hash.
  - Manually commits the offset for fault tolerance, in case `worker-service` crashes it will be reprocessed.
  - `Post /start` starts the consumer service in case it was stopped
  - `Post /stop` stops the consumer service

Kafka Job Queue
  - Distributed job queue
  - `jobs.compute` topic for `compute` type processing
  - `jobs.file` topic for `file` type processing
  - `jobs.blockchain` topic for `blockchain` type processing
  - `jobs.data` topic for `data` type processing

Mongo DB
  - Persistent data store for jobs and status tracking
  - Job schema
     ```
      id: uuid
      type: string
      status: string
      payload: object
      result: object 
     ```
     
## Architecture Diagram
![dist_processing](https://github.com/user-attachments/assets/382e4948-173f-4dc2-bc10-ac44726be838)

