# E-commerce AI Support Assistant

A production-oriented AI assistant for e-commerce businesses that helps customers and support teams find reliable answers about products, shipping, returns, and store policies. The application will combine conversational AI with controlled business data so responses can be grounded, cited, and safely connected to live store tools.

## Planned technology stack

- Next.js and React
- NestJS
- TypeScript
- OpenAI API
- PostgreSQL and pgvector

## Project status

**Milestone 0 - Repository foundation**

The project is being developed incrementally as a practical AI-engineering portfolio project. See the [project plan](./PROJECT_PLAN.md) for the roadmap, architecture, acceptance criteria, and delivery principles.

## Repository structure

```text
apps/
  web/    Next.js frontend
  api/    NestJS backend
```

Nx manages the applications, task orchestration, and build caching. The frontend and backend remain independently runnable and deployable.

## Prerequisites

- Node.js 24
- npm 11

The repository includes `.nvmrc` and enforces the supported Node.js major version during package installation.

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

## Validation

```bash
npm run lint
npm test
npm run build
```
