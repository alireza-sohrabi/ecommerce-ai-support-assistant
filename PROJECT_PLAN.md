# E-commerce AI Support Assistant

## 1. Project summary

Build a production-oriented AI assistant for an e-commerce business. The assistant will answer customer questions about products and store policies, retrieve relevant information from a controlled knowledge base, cite its sources, and use approved tools to check live business data.

This is both a learning project and a portfolio project. Each milestone must produce a working, reviewable improvement rather than only introducing theory.

## 2. Business problem

E-commerce support teams repeatedly answer questions such as:

- Which product best matches a customer's requirements?
- What is the return or shipping policy?
- Is a product currently available?
- How do two products compare?
- Can a support reply be drafted using the store's approved information?

Generic language models cannot reliably answer store-specific questions and may invent products, policies, prices, or inventory. This project will demonstrate how to build a grounded assistant that combines an LLM with business data, retrieval, validation, and controlled tools.

## 3. Portfolio positioning

The finished project should support this portfolio statement:

> Designed and built a full-stack e-commerce AI support assistant using Next.js, NestJS, OpenAI, PostgreSQL, vector search, RAG, streaming, structured outputs, tool calling, conversation memory, evaluation, and production-oriented security controls.

Target Upwork work includes:

- AI chatbot integration
- LLM integration in an existing web application
- Document question-answering systems
- RAG knowledge assistants
- E-commerce and Shopify AI features
- Semantic product search
- AI support-response drafting
- Tool and API integration

## 4. Target users

### Customer

Asks product and store-policy questions and receives grounded answers with relevant sources.

### Support agent

Uses the assistant to research questions and prepare response drafts. The assistant never sends a customer message without approval.

### Store administrator

Manages the documents and product information used by the assistant and can inspect ingestion status.

## 5. Core use cases

1. Ask a general question and receive a streamed response.
2. Continue a multi-turn conversation.
3. Ask a store-policy question and receive a source-grounded answer.
4. Search for products using natural language.
5. Compare selected products using retrieved facts.
6. Check live product or inventory information through a controlled backend tool.
7. Generate a structured support-response draft.
8. Show when the assistant does not have enough reliable information.
9. Inspect citations and the retrieved context used for an answer.
10. Evaluate expected answers against a small test dataset.

## 6. Technology decisions

### Repository

- One Git repository
- Monorepo structure
- Shared TypeScript types only when genuine sharing is needed
- Separate frontend and backend applications

### Frontend

- Next.js
- React
- TypeScript
- Responsive chat interface
- Streaming response rendering
- Accessible loading, error, empty, and cancellation states

### Backend

- NestJS
- TypeScript
- REST endpoints initially
- Server-side OpenAI integration
- Input and output validation
- Structured logging with sensitive-data filtering

### AI

- OpenAI Responses API
- Server-side prompt instructions
- Streaming
- Structured outputs where appropriate
- Embeddings for semantic retrieval
- Controlled tool calling

### Storage

- PostgreSQL for application data
- `pgvector` for embeddings and similarity search
- Local or object storage for uploaded source files, selected when document upload is implemented

### Deployment

- Frontend and backend deployed separately or as independently deployable services
- Managed PostgreSQL
- Protected environment variables
- Docker support for local dependencies and backend portability

Exact providers and libraries should be selected only when their milestone begins. Avoid installing future dependencies in advance.

## 7. Proposed repository structure

```text
ecommerce-ai-support-assistant/
  apps/
    web/                 Next.js frontend
    api/                 NestJS backend
  packages/
    contracts/           Shared API contracts, added only when justified
  docs/
    architecture/        Architecture decisions and diagrams
    evaluations/         Evaluation cases and results
    portfolio/           Case study and demo material
  sample-data/           Safe synthetic products, policies, and FAQs
  PROJECT_PLAN.md
  README.md
```

The initial repository does not need every directory. Create directories only when the corresponding work begins.

## 8. Delivery principles

- The learner writes the implementation.
- Codex provides requirements, reviews, questions, hints, and debugging guidance.
- Codex does not implement features unless explicitly requested.
- Each milestone has acceptance criteria and a review checkpoint.
- Prefer a working vertical slice over partially building many layers.
- Add complexity only when the current feature requires it.
- Keep all model credentials on the server.
- Use synthetic store data until real data is explicitly approved.
- Record important architecture decisions as they are made.

## 9. Milestone roadmap

### Milestone 0 — Repository foundation

**Goal:** Establish a clean, independently runnable frontend and backend.

Deliverables:

- Next.js TypeScript application under `apps/web`
- NestJS TypeScript application under `apps/api`
- Backend health endpoint
- Basic frontend project page
- Root README with local setup instructions
- Environment example files without secrets
- Git ignore rules for environment files and generated artifacts
- Initial architecture description

Acceptance criteria:

- A new developer can follow the README and run both applications.
- The frontend can reach the backend health endpoint.
- No API key or secret exists in tracked files or Git history.
- Both applications pass their default lint/build checks.

Concepts reinforced:

- Monorepo boundaries
- Frontend/backend communication
- Environment configuration
- Secret protection

### Milestone 1 — First model response

**Goal:** Complete the smallest real AI vertical slice.

Deliverables:

- Minimal chat interface with user and assistant messages
- Backend chat endpoint
- Server-side OpenAI request
- Request validation
- Loading and error states
- Basic system/developer instructions for the assistant's role
- Safe error response that does not expose credentials or provider internals

Acceptance criteria:

- A user can submit a message and see a model-generated response.
- The browser never receives the OpenAI API key.
- Empty and excessively large inputs are rejected.
- Provider failures produce an understandable UI error.
- One automated backend test covers request validation.

Concepts reinforced:

- Model API integration
- Prompts and instructions
- Tokens and context
- Secure server-side calls
- Failure handling

### Milestone 2 — Conversation and streaming

**Goal:** Make the chatbot feel like a real interactive application.

Deliverables:

- Stream model output to the interface
- Maintain multi-turn conversation context
- Cancel an in-progress response
- Disable duplicate submissions while appropriate
- Record request duration and token usage when available
- Define a conversation-history limit

Acceptance criteria:

- Text appears incrementally during generation.
- Cancellation stops rendering and releases resources correctly.
- Follow-up questions use relevant earlier messages.
- The application prevents unbounded conversation history.
- Logs do not contain full sensitive prompts by default.

Concepts reinforced:

- Streaming protocols
- Short-term memory
- Context-window management
- Latency and cost
- Abort and cleanup behavior

### Milestone 3 — Structured AI features

**Goal:** Demonstrate reliable, validated model output.

Deliverables:

- Support-request classification
- Structured support-draft generation
- Schema validation on the backend
- Clear handling of invalid or incomplete model output
- UI presentation for structured results

Example structured fields:

- intent
- urgency
- requested action
- draft response
- requires human review

Acceptance criteria:

- Model output is validated before entering application logic.
- Invalid output cannot silently pass as valid data.
- Support drafts are visibly marked as drafts.
- A human must approve any consequential action.

Concepts reinforced:

- Structured outputs
- Runtime validation
- Deterministic application boundaries
- Human approval

### Milestone 4 — Product data and semantic search

**Goal:** Implement the first embeddings and vector-search workflow.

Deliverables:

- Synthetic e-commerce product dataset
- PostgreSQL schema for products and embeddings
- Product ingestion command or protected endpoint
- Embedding generation
- `pgvector` similarity search
- Search-results interface
- Metadata filtering, such as category or availability

Acceptance criteria:

- Products can be inserted and updated without leaving stale embeddings.
- Natural-language search returns relevant products.
- Search results expose similarity information for debugging, not as an unsupported claim of certainty.
- Metadata filters work independently of semantic similarity.
- A small search evaluation set records expected products.

Concepts reinforced:

- Embeddings
- Vector similarity
- Index synchronization
- Metadata filtering
- Retrieval evaluation

### Milestone 5 — Store knowledge RAG

**Goal:** Answer questions using store-controlled documents and cite the sources.

Deliverables:

- Synthetic return, shipping, warranty, and FAQ documents
- Text extraction and cleaning
- Heading-aware or otherwise justified chunking
- Chunk metadata and embeddings
- Retrieval pipeline
- Grounded prompt construction
- Source citations in the answer UI
- Debug view for retrieved chunks

Acceptance criteria:

- Policy answers cite the source section used.
- The assistant admits when the knowledge base lacks an answer.
- Retrieved chunks are separated from trusted application instructions.
- Changing a source document can trigger correct re-ingestion.
- Retrieval and answer generation are evaluated separately.

Concepts reinforced:

- Ingestion
- Chunking
- RAG
- Grounding
- Citation design
- Prompt-injection boundaries

### Milestone 6 — Controlled tools

**Goal:** Allow the model to request live business information safely.

Initial tools:

- Get product details
- Check simulated inventory
- Retrieve current simulated price
- Prepare a support-response draft

Deliverables:

- Tool definitions
- Server-side argument validation
- Authorization rules
- Tool execution loop with a strict step limit
- Tool failure handling
- Tool-call audit log without unnecessary sensitive data

Acceptance criteria:

- The model cannot execute arbitrary code or call arbitrary URLs.
- Every tool argument is validated outside the model.
- Tool failures return controlled information to the model.
- Read and write actions are clearly distinguished.
- Consequential actions require confirmation.

Concepts reinforced:

- Tool calling
- Agent loops
- Trust boundaries
- Validation
- Stopping conditions

### Milestone 7 — Persistent conversations and memory

**Goal:** Add useful memory without sending all stored information to every request.

Deliverables:

- Persisted users or anonymous sessions
- Stored conversations and messages
- Conversation summaries
- Explicit user preferences
- Relevant-memory retrieval
- Memory inspection and deletion controls

Acceptance criteria:

- One user cannot access another user's conversations.
- Stored memory has a documented purpose and retention rule.
- Users can correct or delete saved preferences.
- Only relevant memories are inserted into a prompt.
- Conversation history is summarized or trimmed predictably.

Concepts reinforced:

- Short-term and long-term memory
- Retrieval relevance
- Privacy
- Multi-user isolation
- Retention policies

### Milestone 8 — Production readiness

**Goal:** Convert the working project into a credible client-facing demonstration.

Deliverables:

- Authentication and authorization
- Rate limiting
- Request-size limits
- Secure headers and CORS configuration
- Retry policy for temporary provider failures
- Timeouts and cancellation
- Database migrations
- Automated tests for critical flows
- Structured observability
- Deployment configuration
- Seeded demo environment

Acceptance criteria:

- The deployed demo works from a clean user session.
- Secrets are stored only in deployment configuration.
- Rate limits and input limits are enforced server-side.
- Critical flows have automated tests.
- Logs support debugging without exposing complete private conversations.
- Known limitations are documented.

Concepts reinforced:

- Reliability
- Security
- Observability
- Deployment
- Operational cost

### Milestone 9 — Evaluation and portfolio package

**Goal:** Demonstrate engineering judgment and make the project useful for Upwork applications.

Deliverables:

- Evaluation dataset covering normal, ambiguous, unsupported, and adversarial questions
- Retrieval metrics or clearly defined retrieval checks
- Grounded-answer scoring rubric
- Regression results for important prompt or retrieval changes
- Architecture diagram
- Professional GitHub README
- Screenshots
- Short demo video script
- Portfolio case study
- Upwork project description
- Reusable proposal paragraph

Acceptance criteria:

- Evaluation results are reproducible.
- The case study explains the business problem, architecture, tradeoffs, and limitations.
- The README supports local setup and includes a deployed demo link when available.
- The demo shows failure handling and citations, not only successful chat responses.

Concepts reinforced:

- AI evaluation
- Regression testing
- Technical communication
- Portfolio positioning

## 10. Suggested delivery schedule

The schedule is intentionally flexible. Progress is measured by completed behavior, not elapsed time.

| Period | Target |
| --- | --- |
| Week 1 | Repository foundation and first model response |
| Week 2 | Streaming, conversation state, validation, and structured output |
| Week 3 | Product storage, embeddings, and semantic search |
| Week 4 | Document ingestion, RAG, citations, and retrieval evaluation |
| Week 5 | Tool calling and controlled workflow |
| Week 6 | Persistent memory, authentication, and user separation |
| Week 7 | Reliability, security, tests, and deployment |
| Week 8 | Evaluation, documentation, demo, and Upwork materials |

Each approximately 30-minute learning session should aim to include:

1. One narrowly scoped concept
2. One implementation task
3. One observable behavior change
4. One review checkpoint
5. One short progress-log update

## 11. Initial API boundaries

These are planning-level boundaries, not fixed implementation contracts.

### Early endpoints

- Health check
- Submit a chat request
- Stream a chat response

### Later endpoints

- Create and list conversations
- Retrieve conversation messages
- Search products
- Upload and list knowledge sources
- Trigger or inspect ingestion
- Submit answer feedback
- Inspect citations for a response

Every request must have:

- Defined input validation
- Defined authentication requirement
- Defined maximum size
- Safe error behavior
- Logging rules

## 12. Initial data concepts

Likely entities include:

- User
- Conversation
- Message
- Product
- Knowledge source
- Document chunk
- Embedding metadata
- Tool execution
- User preference
- Answer feedback
- Evaluation case

Database schemas should be introduced only when their milestone starts. Do not design the entire final schema during the first chatbot milestone.

## 13. Evaluation strategy

Evaluation begins before RAG rather than being added only at the end.

### Basic chatbot checks

- Follows the assistant role
- Rejects or handles empty input
- Handles unavailable provider responses
- Does not expose hidden instructions or credentials

### Retrieval checks

- Expected product appears in the top results
- Correct policy chunk is retrieved
- Metadata filters do not leak unrelated records
- Unsupported questions retrieve no misleading context

### Answer checks

- Claims are supported by retrieved sources
- Citations point to the correct document sections
- Conflicting sources are handled explicitly
- Missing information produces an honest limitation
- Tool results are represented accurately

### Adversarial checks

- Prompt injection inside an uploaded document
- Request to reveal system instructions
- Request to access another user's conversation
- Oversized or malformed input
- Tool arguments attempting unauthorized behavior

## 14. Security and privacy requirements

- Never expose provider API keys to the browser.
- Never commit secrets or real customer data.
- Validate all external input, including model-generated tool arguments.
- Treat retrieved documents as untrusted data, not instructions.
- Apply authorization filters before retrieval, not after generation.
- Limit upload formats and sizes.
- Escape or sanitize rendered content appropriately.
- Require approval before any future write action.
- Provide deletion behavior for stored conversations and memory.
- Document what is logged and retained.

## 15. Cost and performance requirements

- Record model and token usage when the provider returns it.
- Avoid resending unlimited conversation history.
- Retrieve only a justified number of chunks.
- Use a cost-appropriate model for each task.
- Generate embeddings only when content changes.
- Add retries only for temporary failures and keep them bounded.
- Add timeouts to provider and tool calls.
- Measure response latency before optimizing it.

## 16. Testing strategy

- Unit tests for validation, prompt construction, chunking, and tool handlers
- Integration tests for API, database, and retrieval boundaries
- Frontend tests for message submission, streaming state, cancellation, and errors
- End-to-end tests for the critical chat and RAG flows
- Evaluation cases for nondeterministic AI behavior

Traditional tests should verify deterministic application logic. Evaluation cases should measure model and retrieval behavior. One should not replace the other.

## 17. Explicitly out of scope for the first MVP

- Training or fine-tuning a foundation model
- Autonomous actions without user approval
- Voice or realtime audio
- Multi-agent orchestration
- Real Shopify credentials or customer data
- Payments and subscriptions
- Mobile applications
- Complex microservices
- Multiple model providers
- Kubernetes

These may be considered later only if they improve the portfolio or match a real client requirement.

## 18. Definition of project success

The project is successful when the learner can independently:

- Explain every request and data flow in the application.
- Implement and secure a server-side LLM call.
- Build and evaluate embeddings and semantic search.
- Build a grounded RAG pipeline with citations.
- Validate structured model output and tool arguments.
- Implement a bounded tool-calling workflow.
- Manage conversation context and persistent memory safely.
- Diagnose failures using useful logs and tests.
- Deploy the complete application.
- Explain architectural tradeoffs to a prospective client.
- Present the project professionally in an Upwork proposal and portfolio.

## 19. First implementation task

Complete Milestone 0 without adding AI dependencies yet.

The first review will check:

- Repository organization
- Local development experience
- Frontend/backend separation
- Environment and secret handling
- Health-check integration
- Lint and build status
- README clarity

After that review, begin Milestone 1 with the smallest possible real model request.
