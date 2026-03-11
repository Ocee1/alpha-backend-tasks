import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { SampleCandidate } from './sample-candidate.entity';

@Entity({ name: 'candidate_documents' })
export class CandidateDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  documentType!: string; // e.g., "resume", "cover_letter"

  @Column({ name: 'file_name', type: 'varchar', length: 160 })
  fileName!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 255 })
  storageKey!: string; // local path or file identifier

  @Column({ name: 'raw_text', type: 'text' })
  rawText!: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  @ManyToOne(() => SampleCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;
}
