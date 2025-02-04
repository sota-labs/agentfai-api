import dotenv from 'dotenv';
process.env.MONGODB_AUTO_INDEX = 'true';
dotenv.config();

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AppModule } from 'app.module';
import { CreateIndexes } from './migrations/indexes/create-indexes';
import databaseConfig from 'config/database.config';

@Module({
  imports: [AppModule, MongooseModule.forRoot(databaseConfig().uri)],
  providers: [CreateIndexes],
})
class ScriptModule {}

async function bootstrap() {
  const app = await NestFactory.create(ScriptModule);
  const indexCreator = app.get(CreateIndexes);
  const operation = process.argv[2] || 'up';

  try {
    if (operation === 'up') {
      await indexCreator.up();
      console.log('Successfully created all indexes');
    } else if (operation === 'down') {
      await indexCreator.down();
      console.log('Successfully dropped all indexes');
    } else {
      console.error('Invalid operation. Use "up" or "down"');
    }
  } catch (error) {
    console.error(`Error ${operation === 'up' ? 'creating' : 'dropping'} indexes:`, error);
  } finally {
    await app.close();
  }
}

bootstrap().then(() => process.exit(0));
