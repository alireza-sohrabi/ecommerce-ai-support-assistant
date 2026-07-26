import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { KnowledgeBaseSyncService } from '@api/features/knowledge-base/knowledge-base-sync.service';

async function synchronizeKnowledgeBase(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const summary = await application
      .get(KnowledgeBaseSyncService)
      .synchronize();

    process.stdout.write(
      `${[
        'Knowledge-base synchronization complete:',
        `${summary.total} total`,
        `${summary.unchanged} unchanged`,
        `${summary.embedded} embedded`,
        `${summary.upserted} upserted`,
        `${summary.deleted} deleted`,
      ].join(' ')}\n`,
    );
  } finally {
    await application.close();
  }
}

synchronizeKnowledgeBase().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown synchronization failure';

  process.stderr.write(`Knowledge-base synchronization failed: ${message}\n`);
  process.exitCode = 1;
});
