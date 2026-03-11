import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  NotFoundException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SampleCandidate } from '../entities/sample-candidate.entity';

@Injectable()
export class CandidateAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(SampleCandidate)
    private readonly candidateRepo: Repository<SampleCandidate>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const user = request.user;
    const candidateId = request.params.candidateId;

    if (!candidateId) return true;

    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
    });

    // enforce the Workspace Boundary
    if (!candidate || candidate.workspaceId !== user.workspaceId) {
      throw new NotFoundException('Candidate not found in your workspace.');
    }

    request.candidate = candidate;

    return true; 
  }
}