import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CreateSampleCandidateDto } from './dto/create-sample-candidate.dto';
import { SampleService } from './sample.service';
import { CreateCandidateDocumentDto } from './dto/cadidate-document.dto';
import { CandidateAccessGuard } from '../auth/candidate-access.guard';

@Controller('sample')
@UseGuards(FakeAuthGuard, CandidateAccessGuard)
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Post('candidates')
  async createCandidate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSampleCandidateDto,
  ) {
    return this.sampleService.createCandidate(user, dto);
  }

  @Get('candidates')
  async listCandidates(@CurrentUser() user: AuthUser) {
    return this.sampleService.listCandidates(user);
  }

  @Post('candidates/:candidateId/documents')
  async addCandidateDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() documentDto: CreateCandidateDocumentDto, 
  ) {
    return this.sampleService.addDocument(user, candidateId, documentDto);
  }

  @Post('candidates/:candidateId/summaries/generate')
  async generateSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {

    return this.sampleService.generateSummary(user, candidateId);
  }

  @Get('candidates/:candidateId/summaries')
  async getCandidateSummaries(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    return this.sampleService.getSummaries(candidateId);
  }

  @Get('candidates/:candidateId/summaries/:summaryId')
  async getCandidateSummaryById(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ) {
    return this.sampleService.findOneSummary(candidateId, summaryId);
  }
}
