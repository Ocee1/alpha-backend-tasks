import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { QueueService, EnqueuedJob } from '../queue/queue.service';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CandidateSummary } from '../entities/candidateSummary.entity';
import { CandidateDocument } from '../entities/candidateDocument.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity'; // <-- Ensure this path is correct
import {
  SummarizationProvider,
  SUMMARIZATION_PROVIDER,
  CandidateSummaryInput,
} from '../llm/summarization-provider.interface';

@Injectable()
export class SummaryWorker implements OnModuleInit {
  private readonly logger = new Logger(SummaryWorker.name);
  private isPolling = false;

  constructor(
    private readonly queueService: QueueService,

    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,

    @InjectRepository(CandidateDocument)
    private readonly candidateDocumentRepo: Repository<CandidateDocument>,

    @InjectRepository(CandidateSummary)
    private readonly candidateSummaryRepo: Repository<CandidateSummary>,

    @InjectRepository(SampleCandidate)
    private readonly candidateRepo: Repository<SampleCandidate>,
  ) { }

  onModuleInit() {
    this.startWorker();
  }

  startWorker() {
    setInterval(async () => {
      if (this.isPolling) return; 
      this.isPolling = true;

      try {
        await this.processJobs();
      } finally {
        this.isPolling = false; 
      }
    }, 5000);
  }

  private async processJobs() {
    const jobs = this.queueService.getQueuedJobs();

    for (const job of jobs) {
      if (job.name === 'generate_candidate_summary' && !job.processed) {
        // 🔹 Expect summaryId in the payload
        const payload = job.payload as { candidateId: string; summaryId: string };
        const { candidateId, summaryId } = payload;

				this.logger.log(`[WORKER] Picked up job ${job.id} for candidate ${candidateId}`);

        try {
          // get candidate to get their name
          const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
          const candidateName = candidate ? (candidate as any).fullName : 'the candidate';

          const documents = await this.candidateDocumentRepo.find({
            where: { candidateId: candidateId },
          });


          // concatenate the raw text
          const combinedText = documents
            .map((d, index) => `--- Document ${index + 1} ---\n${d.rawText}`)
            .join('\n\n');

          const customPrompt = `Here is a resume and a cover letter for ${candidateName}. Provide a structured summary including their top skills, years of experience, and a sentiment analysis of their cover letter.\n\n${combinedText}`;

          // Pass the customized string as the document input
          const input: CandidateSummaryInput = {
            candidateId: candidateId,
            documents: [customPrompt], 
          };

					this.logger.log(`🤖 [WORKER] Sending request to Gemini...`);


          const result = await this.summarizationProvider.generateCandidateSummary(input);
          const existingSummary = await this.candidateSummaryRepo.findOne({ where: { id: summaryId } });
          
          if (existingSummary) {
            existingSummary.status = 'completed';
            existingSummary.score = result.score;
            existingSummary.strengths = result.strengths;
            existingSummary.concerns = result.concerns;
            existingSummary.summary = result.summary;
            existingSummary.recommendedDecision = result.recommendedDecision;
            
            await this.candidateSummaryRepo.save(existingSummary);
          }

          this.logger.log(`✅[WORKER] Completed job ${job.id} for candidate ${candidateId}`);
          this.queueService.markJobProcessed(job.id);

        } catch (error: any) {
          this.logger.error(`❌ [WORKER] CRASHED on job ${job.id}:`, error.stack);

          // UPDATE the existing summary to 'failed'
          const failedSummary = await this.candidateSummaryRepo.findOne({ where: { id: summaryId } });
          if (failedSummary) {
            failedSummary.status = 'failed';
            failedSummary.errorMessage = (error as Error).message;
            await this.candidateSummaryRepo.save(failedSummary);
          }

          this.queueService.markJobProcessed(job.id);
        }
      }
    }
  }
}