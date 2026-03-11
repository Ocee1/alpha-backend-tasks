import { randomUUID } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { CandidateSummary } from '../entities/candidateSummary.entity';
import { CreateSampleCandidateDto } from './dto/create-sample-candidate.dto';
import { CandidateDocument } from '../entities/candidateDocument.entity';
import { QueueService } from '../queue/queue.service';
import { CreateCandidateDocumentDto } from './dto/cadidate-document.dto';

@Injectable()
export class SampleService {
  constructor(
    @InjectRepository(SampleWorkspace)
    private readonly workspaceRepository: Repository<SampleWorkspace>,

    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,

    @InjectRepository(CandidateSummary)
    private readonly candidateSummaryRepo: Repository<CandidateSummary>,

    @InjectRepository(CandidateDocument)
    private readonly candidateDocumentRepo: Repository<CandidateDocument>,

    private readonly queueService: QueueService
  ) {}

  async createCandidate(user: AuthUser, dto: CreateSampleCandidateDto): Promise<SampleCandidate> {
    await this.ensureWorkspace(user.workspaceId);

    const candidate = this.candidateRepository.create({
      id: randomUUID(),
      workspaceId: user.workspaceId,
      fullName: dto.fullName.trim(),
      email: dto.email?.trim() ?? null,
    });

    return this.candidateRepository.save(candidate);
  }


  async listCandidates(user: AuthUser): Promise<SampleCandidate[]> {
    return this.candidateRepository.find({
      where: { workspaceId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });
  }


  private async ensureWorkspace(workspaceId: string): Promise<void> {
    const existing = await this.workspaceRepository.findOne({ where: { id: workspaceId } });

    if (existing) {
      return;
    }

    const workspace = this.workspaceRepository.create({
      id: workspaceId,
      name: `Workspace ${workspaceId}`,
    });

    await this.workspaceRepository.save(workspace);
  }


  async generateSummary(user: AuthUser, candidateId: string) {
    // verify the candidate exists 
    const candidate = await this.candidateRepository.findOne({ where: { id: candidateId }});
    if (!candidate) throw new NotFoundException('Candidate not found');

    // create a pending summary record in the database
    const pendingSummary = await this.createCandidateSummary({
      candidateId: candidateId,
      status: 'pending',
      provider: 'Gemini', 
      promptVersion: '1.0',
    });

    this.queueService.enqueue(
      'generate_candidate_summary',
      { 
        candidateId: candidateId,
        summaryId: pendingSummary.id
      },
    );

    console.log('🛠️ DEBUG: Current Queue Status ->', this.queueService.getQueuedJobs());

    return pendingSummary;
  }


  async createCandidateSummary(data: DeepPartial<CandidateSummary>): Promise<CandidateSummary> {
    const newSummary = this.candidateSummaryRepo.create(data);
    return await this.candidateSummaryRepo.save(newSummary);
  }


  async findSummaryByCandidateId(candidateId: string): Promise<CandidateSummary[]> {
    return await this.candidateSummaryRepo.find({
      where: { candidateId },
      order: { createdAt: 'DESC' }, 
    });
  }


  async getSummaries(candidateId: string): Promise<CandidateSummary[]> {
    return await this.candidateSummaryRepo.find({
      where: { candidateId: candidateId },
      order: { createdAt: 'DESC' }, 
    });
  }

  async findOneSummary(candidateId: string, summaryId: string): Promise<CandidateSummary> {
    const summary = await this.candidateSummaryRepo.findOne({
      where: { 
        id: summaryId,
        candidateId: candidateId,
      },
    });

    if (!summary) {
      throw new NotFoundException(`Summary not found or does not belong to this candidate.`);
    }

    return summary;
  }

  async updateSummaryStatus(
    id: string, 
    status: 'pending' | 'completed' | 'failed', 
    errorMessage?: string
  ): Promise<CandidateSummary> {
    const summary = await this.candidateSummaryRepo.findOne({ where: {
      id
    } });

    if (!summary) {
      throw new NotFoundException(`Summary not found or does not belong to this candidate.`);
    }
    
    summary.status = status;
    if (errorMessage) {
      summary.errorMessage = errorMessage;
    }

    return await this.candidateSummaryRepo.save(summary);
  }


  async addDocument(
    user: AuthUser, 
    candidateId: string, 
    dto: CreateCandidateDocumentDto
  ) {

    const candidate = await this.candidateRepository.findOne({ where: { id: candidateId } });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found.`);
    }

    // generate a unique local storage path (storage key)
    const timestamp = Date.now();
    const sanitizedFileName = dto.fileName.replace(/\s+/g, '_'); 
    const storageKey = `/uploads/candidates/${candidateId}/${timestamp}-${sanitizedFileName}`;

    const newDocument = this.candidateDocumentRepo.create({
      candidateId: candidateId,
      documentType: dto.documentType,
      fileName: dto.fileName,
      storageKey: storageKey,
      rawText: dto.rawText,
    });

    return await this.candidateDocumentRepo.save(newDocument);
  }
}
