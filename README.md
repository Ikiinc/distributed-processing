# Distributed Processing

## Components
This distributed processing solution has following components

#### API Server 
  - REST microservice to process the incoming job
  - `Post /jobs `
    - Saves the job in mongodb
    - Publishes the job to kafka topic according to type
  - `Get /jobs/:id `
    - Fetches job details of given id
  - `Patch /jobs/:id `
    - Updates job status and job result  
  
#### Worker Service
  - Consumer microservice which subscribes to `jobs.compute` topic
  - Computes sha256 hash of the payload input string.
  - This compute processing is just an example, likewise we can extend the worker service to consume from different topics for different job types.
  - When receiving the job from kafka topic, it calls `api-server` Patch endpoint to update status to `processing`
  - After compute processing, it calls `api-server` Patch endpoint to update status to `completed` and `result` with computed hash.
  - Manually commits the offset for fault tolerance, in case `worker-service` crashes it will be reprocessed.
  - `Post /start` starts the consumer service in case it was stopped
  - `Post /stop` stops the consumer service

#### Kafka Job Queue
  - Distributed job queue
  - `jobs.compute` topic for `compute` type processing
  - `jobs.file` topic for `file` type processing
  - `jobs.blockchain` topic for `blockchain` type processing
  - `jobs.data` topic for `data` type processing

#### Mongo DB
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

- For `decentalized processing` - `worker-service` instances deployed in decentralized worker nodes.
- For `distributed processing`   - All services are connected in a single or multiple peered networks.
   
![dist_processing](https://github.com/user-attachments/assets/382e4948-173f-4dc2-bc10-ac44726be838)

## Design Decisions
In this repo for ease of prototyping, all services are defined in `docker-compose.yaml` file. 
Using one `kafka` partition and one `worker-service` to demo the system. 
In real world, we define the same as kubernetes services.

#### Scalability and Fault Tolerance
- All the services can be defined as kubernetes services to be horizontally scalable.
- `api-server` is defined as micro service hence we can scale as per demand.
- `kafka` serves as distributed job queue and we can define the number of partitions and replication factor through env variables, hence any number of consumers we can scale. Also we can post different categories of jobs in different topics. so that as per consumer capacity we can configure to consume from the different topics.
- `worker-service` is defined as kafka consumer micro service hence we can scale as per job load. If any worker node fails, it will not commit the offset and that job will be reprocessed later by another worker node which comes online.

#### Persistence
- Job details and status tracking is enabled using mongo db. Data will be persisted to enquire about the job details/status.

#### Decentralization
- For decentralized processing, ideally `api-server`, `mongodb`, `kafka` services are placed under a centralized kubernetes network and `worker-service` instances are deployed in decentralized network.
- `worker-service` nodes should connect to `kafka` and `api-server` over the internet with proper authentication. 


## Running the repo

Prerequisite: Docker desktop or Docker compose installed
```
clone the repo
cd distributed-processing
docker compose up -d
```
This will start 5 containers `api-server`, `worker-service`, `mongo`, `zookeeper`, `kafka` using the `distributed-processing_default` bridge network.
Also following ports exposed for local testing purpose
```
api-server: 3000
worker-service: 4000
kafka: 9093
```

To stop the containers
```
docker compose down
```
## Run Demo Script
Note: 
- Please ensure that all services are running.
- Sample output `demo-output.log` attached in repo.

```
npm install axios
node run-demo.js
```
If Demo script output is having job status `queued`, pls check logs and try increasing wait times.

