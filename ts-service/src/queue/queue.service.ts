import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

export interface EnqueuedJob<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  enqueuedAt: string;
  processed?: boolean;
}

@Injectable()
export class QueueService {
  private readonly jobs: EnqueuedJob[] = [];

  enqueue<TPayload>(name: string, payload: TPayload): EnqueuedJob<TPayload> {
    const job: EnqueuedJob<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      enqueuedAt: new Date().toISOString(),
      processed: false,
    };

    this.jobs.push(job);
    console.log(`📥 [QueueService] Job enqueued: ${name} | Total pending jobs: ${this.getQueuedJobs().length}`);
    return job;
  }

  getQueuedJobs(): readonly EnqueuedJob[] {
    return this.jobs;
  }

  markJobProcessed(jobId: string) {
    const jobIndex = this.jobs.findIndex((j) => j.id === jobId);
    
    if (jobIndex > -1) {
      this.jobs.splice(jobIndex, 1);
    }
  }
}
