# E-commerce AI Support Assistant

A production-oriented AI assistant for e-commerce businesses that helps customers and support teams find reliable answers about products, shipping, returns, and store policies. The application will combine conversational AI with controlled business data so responses can be grounded, cited, and safely connected to live store tools.

## Planned technology stack

- Next.js and React
- NestJS
- TypeScript
- OpenAI API
- PostgreSQL and pgvector

## Project status

**Milestone 1 - First model response**

The application now includes a minimal chat interface, a validated NestJS chat endpoint, and a secure server-side OpenAI request. It displays user and assistant messages and provides loading and safe error states. See the [project plan](./PROJECT_PLAN.md) for the roadmap, architecture, acceptance criteria, and delivery principles.

## Repository structure

```text
apps/
  web/    Next.js frontend
  api/    NestJS backend
```

Nx manages the applications, task orchestration, and build caching. The frontend and backend remain independently runnable and deployable.

The API follows a ports-and-adapters structure:

```text
apps/api/src/app/
  features/       Business use cases such as chat and knowledge-base ingestion
  ports/          Provider-neutral AI, embedding, and vector-database contracts
  integrations/   OpenAI and Qdrant adapters plus runtime port bindings
```

Features depend on ports, integrations implement ports, and the root application
module composes both layers.

## Prerequisites

- Node.js 24
- npm 11

The repository includes `.nvmrc` and enforces the supported Node.js major version during package installation.

## Environment configuration

Create a root `.env` file from `.env.example`, then provide your OpenAI API key and model:

```dotenv
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=your-model
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
QDRANT_ENDPOINT=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key
KNOWLEDGE_BASE_VECTOR_COLLECTION=knowledge-base
KNOWLEDGE_BASE_RETRIEVAL_LIMIT=4
KNOWLEDGE_BASE_RETRIEVAL_SCORE_THRESHOLD=0.4
WEB_ORIGIN=http://localhost:3000
```

Create `apps/web/.env.local` from `apps/web/.env.example`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

The OpenAI and Qdrant API keys must remain in the root server environment and
must never be added to the frontend environment. `QDRANT_ENDPOINT` must be an
absolute HTTP or HTTPS URL. The API validates both Qdrant settings during
startup; use a dedicated, least-privilege API key for the target Qdrant
instance.

`OPENAI_EMBEDDING_DIMENSIONS` must match the vector size used by the
knowledge-base Qdrant collection. Changing the embedding model or dimensions
after creating the collection requires a new collection name or an explicit
collection migration.

`KNOWLEDGE_BASE_RETRIEVAL_LIMIT` caps the number of chunks supplied to chat
generation. `KNOWLEDGE_BASE_RETRIEVAL_SCORE_THRESHOLD` accepts a value from
`0` to `1`; results below it are excluded. The default `0.4` is an initial
cosine-similarity cutoff calibrated against the repository's retrieval
evaluation cases. Similarity is a ranking signal rather than a confidence
percentage, so rerun the evaluation after changing the embedding model,
chunking, source content, or threshold.

## Local development

Install dependencies from the repository root:

```bash
npm install
```

Start the Next.js frontend at `http://localhost:3000`:

```bash
npm run dev:web
```

Start the NestJS API at `http://localhost:3001`:

```bash
npm run dev:api
```

The API health endpoint is available at `http://localhost:3001/api/health`.

## Debugging the API

Open the repository root in VS Code, add breakpoints in the API TypeScript
source, and run **API: Launch and debug** from the Run and Debug panel. This
starts the Nx development server under the Node debugger, pauses before
application startup, loads the root `.env`, and maps the webpack output back to
the original TypeScript files.

Useful breakpoints for following the grounded chat flow are:

- `ChatController.chat`
- `ChatService.processMessage`
- `KnowledgeBaseRetrievalService.retrieve`
- `OpenAIEmbeddingService.generateEmbeddings`
- `QdrantService.search`
- `OpenAIService.generateResponse`

To start the debuggable process separately:

```bash
npm run debug:api
```

Then select **API: Attach to port 9229** in VS Code. The process initially
pauses until the debugger attaches. Stop the Nx terminal when the debugging
session is complete.

## Knowledge-base synchronization

Version-controlled Markdown sources live under
`apps/api/content/knowledge-base/`. To synchronize them with Qdrant:

```bash
npm run sync:knowledge-base
```

The command creates the configured collection when necessary, embeds and
upserts only new or changed chunks, deletes stale points, and prints a concise
summary. Re-running it with unchanged source files performs no embedding or
vector writes.

## Knowledge-base retrieval evaluation

After synchronizing the knowledge base, run the live retrieval evaluation:

```bash
npm run evaluate:knowledge-base-retrieval
```

The command embeds a small version-controlled set of supported and unsupported
questions, searches the configured Qdrant collection, and verifies the expected
source sections. It prints section metadata and a pass/fail summary without
printing embeddings, credentials, or complete document content. It uses live
OpenAI and Qdrant services, so it is intentionally separate from routine unit
tests.

## Validation

```bash
npm run lint
npm test
npm run build
```
