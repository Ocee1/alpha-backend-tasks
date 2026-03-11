# TalentFlow TypeScript Service Starter

NestJS starter service for the backend assessment.

This service includes:

- Nest bootstrap with global validation
- TypeORM + migration setup
- Fake auth context (`x-user-id`, `x-workspace-id`)
- Tiny workspace-scoped sample module
- Queue abstraction module
- LLM provider abstraction with a fake summarization provider
- Jest test setup

The assessment-specific candidate document and summary workflow is intentionally not implemented.

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

## Setup

```bash
cd ts-service
npm install
cp .env.example .env
```

## Environment

- `PORT`
- `DATABASE_URL`
- `NODE_ENV`
- `GEMINI_API_KEY` (leave blank unless implementing a real provider)

Do not commit API keys or secrets.

Candidates may create a free Gemini API key through Google AI Studio for the full assessment implementation.

## Run Migrations

```bash
cd ts-service
npm run migration:run
```

## Run Service

```bash
cd ts-service
npm run start:dev
```

## Run Tests

```bash
cd ts-service
npm test
npm run test:e2e
```

## Fake Auth Headers

Sample endpoints in this starter are protected by a fake local auth guard.
Include these headers in requests:

- `x-user-id`: any non-empty string (example: `user-1`)
- `x-workspace-id`: workspace identifier used for scoping (example: `workspace-1`)

## Layout Highlights

- `src/auth/`: fake auth guard, user decorator, auth types
- `src/entities/`: starter entities
- `src/sample/`: tiny example module (controller/service/dto)
- `src/queue/`: in-memory queue abstraction
- `src/llm/`: provider interface + fake provider + gemini summarizer
- `src/migrations/`: TypeORM migration files

## LLM Provider Interface

The Gemini integration (GeminiSummarizationProvider) implements a generic SummarizationProvider interface. This allows the application to easily swap to OpenAI or Anthropic in the future, or inject a FakeSummarizationProvider during automated testing to avoid API rate limits and costs.

## API Endpoints
### Candidates

POST /sample/candidates
Creates a new candidate assigned to the authenticated user's workspace.

GET /sample/candidates
Lists all candidates within the user's workspace.

### Documents

POST /sample/candidates/:candidateId/documents
Uploads a candidate document (resume, cover letter). Assumes text is extracted and generates a local file system storage key.

JSON
{
  "documentType": "resume",
  "fileName": "Jane_Doe_Resume.pdf",
  "rawText": "Extracted text content..."
}

### Summaries

POST /sample/candidates/:candidateId/summaries/generate
Triggers the async worker to read the candidate's documents and generate an AI summary. Returns a pending summary object.

GET /sample/candidates/:candidateId/summaries
Lists all summaries for a specific candidate.

GET /sample/candidates/:candidateId/summaries/:summaryId
Fetches a specific summary. Can be used to poll for completion or status change.
