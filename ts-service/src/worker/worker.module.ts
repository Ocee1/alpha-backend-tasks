import { Module } from '@nestjs/common';
import { QueueModule } from 'src/queue/queue.module';
import { SummaryWorker } from './summary.worker';
import { LlmModule } from 'src/llm/llm.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateDocument } from 'src/entities/candidateDocument.entity';
import { CandidateSummary } from 'src/entities/candidateSummary.entity';
import { SampleCandidate } from 'src/entities/sample-candidate.entity';

@Module({
  imports: [
    LlmModule, 
    TypeOrmModule.forFeature([
      CandidateDocument,
      CandidateSummary,
      SampleCandidate
    ]),
  ],
  providers: [SummaryWorker],
})
export class WorkerModule {}
