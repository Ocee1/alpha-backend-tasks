import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { CandidateSummary } from '../entities/candidateSummary.entity';
import { CandidateDocument } from '../entities/candidateDocument.entity';
import { SampleService } from './sample.service';
import { QueueService } from '../queue/queue.service';

describe('SampleService', () => {
  let service: SampleService;


  const workspaceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const candidateRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const candidateSummaryRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const candidateDocumentRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQueueService = {
    enqueue: jest.fn(),
    getQueuedJobs: jest.fn().mockReturnValue([]),
  };

  const mockAuthUser = { userId: 'user-1', workspaceId: 'workspace-1' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SampleService,
        {
          provide: getRepositoryToken(SampleWorkspace),
          useValue: workspaceRepository,
        },
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: candidateRepository,
        },
        // 🔹 Inject the new missing repositories and services
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: candidateSummaryRepo,
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: candidateDocumentRepo,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<SampleService>(SampleService);
  });

  describe('createCandidate', () => {
    it('creates candidate within current workspace', async () => {
      workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
      candidateRepository.create.mockImplementation((value) => value);
      candidateRepository.save.mockImplementation(async (value) => value);

      const result = await service.createCandidate(mockAuthUser, {
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
      });

      expect(workspaceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(candidateRepository.create).toHaveBeenCalled();
      expect(result.fullName).toBe('Ada Lovelace');
      expect(result.workspaceId).toBe('workspace-1');
    });
  });

  describe('listCandidates', () => {
    it('returns a list of candidates for the users workspace', async () => {
      const mockCandidates = [{ id: '1', fullName: 'John Doe' }];
      candidateRepository.find.mockResolvedValue(mockCandidates);

      const result = await service.listCandidates(mockAuthUser);

      expect(candidateRepository.find).toHaveBeenCalledWith({
        where: { workspaceId: mockAuthUser.workspaceId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockCandidates);
    });
  });

  describe('generateSummary', () => {
    it('throws NotFoundException if candidate does not exist', async () => {
      candidateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.generateSummary(mockAuthUser, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
      
      expect(mockQueueService.enqueue).not.toHaveBeenCalled();
    });

    it('creates a pending summary and queues the job', async () => {
      candidateRepository.findOne.mockResolvedValue({ id: 'candidate-1' });
      
      const mockPendingSummary = { id: 'summary-123', status: 'pending' };
      candidateSummaryRepo.create.mockReturnValue(mockPendingSummary);
      candidateSummaryRepo.save.mockResolvedValue(mockPendingSummary);

      const result = await service.generateSummary(mockAuthUser, 'candidate-1');

      expect(candidateSummaryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateId: 'candidate-1',
          status: 'pending',
          provider: 'Gemini',
        }),
      );
      expect(mockQueueService.enqueue).toHaveBeenCalledWith(
        'generate_candidate_summary',
        { candidateId: 'candidate-1', summaryId: 'summary-123' },
      );
      expect(result).toEqual(mockPendingSummary);
    });
  });

  describe('findOneSummary', () => {
    it('returns summary if it belongs to the candidate', async () => {
      const mockSummary = { id: 'sum-1', candidateId: 'cand-1' };
      candidateSummaryRepo.findOne.mockResolvedValue(mockSummary);

      const result = await service.findOneSummary('cand-1', 'sum-1');
      expect(result).toEqual(mockSummary);
    });

    it('throws NotFoundException if summary does not exist or mismatch', async () => {
      candidateSummaryRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneSummary('cand-1', 'sum-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSummaryStatus', () => {
    it('updates status and saves', async () => {
      const mockSummary = { id: 'sum-1', status: 'pending' };
      candidateSummaryRepo.findOne.mockResolvedValue(mockSummary);
      candidateSummaryRepo.save.mockImplementation(async (val) => val);

      const result = await service.updateSummaryStatus('sum-1', 'completed');
      expect(result.status).toBe('completed');
      expect(candidateSummaryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' }),
      );
    });
  });

  describe('addDocument', () => {
    const docDto = {
      documentType: 'resume',
      fileName: 'test doc.pdf',
      rawText: 'Hello world',
    } as any;

    it('throws NotFoundException if candidate is missing', async () => {
      candidateRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addDocument(mockAuthUser, 'invalid-cand', docDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates and saves a new document with sanitized storageKey', async () => {
      candidateRepository.findOne.mockResolvedValue({ id: 'cand-1' });
      candidateDocumentRepo.create.mockImplementation((val) => val);
      candidateDocumentRepo.save.mockImplementation(async (val) => val);

      const result = await service.addDocument(mockAuthUser, 'cand-1', docDto);

      expect(candidateDocumentRepo.create).toHaveBeenCalled();
      // Ensure spaces were replaced with underscores in the filename mapping
      expect(result.storageKey).toContain('test_doc.pdf');
      expect(result.rawText).toBe('Hello world');
    });
  });
});