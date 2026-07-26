import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from '@api/features/chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeBaseModule } from '@api/features/knowledge-base/knowledge-base.module';
import { IntegrationsModule } from '@api/integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    IntegrationsModule,
    ChatModule,
    KnowledgeBaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
