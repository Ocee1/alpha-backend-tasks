import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { SampleController } from './sample.controller';
import { SampleService } from './sample.service';
import { CandidateSummary } from 'src/entities/candidateSummary.entity';
import { CandidateDocument } from 'src/entities/candidateDocument.entity';
import { QueueService } from 'src/queue/queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SampleWorkspace,
      SampleCandidate, 
      CandidateSummary, 
      CandidateDocument
    ]),
  ],
  controllers: [SampleController],
  providers: [
    SampleService, 
  ],
  exports: [SampleService],
})
export class SampleModule {}
