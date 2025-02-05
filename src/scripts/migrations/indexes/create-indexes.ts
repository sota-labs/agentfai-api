import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MigrationHelper } from '../utils/migration-helper';

@Injectable()
export class CreateIndexes {
  private migrationHelper: MigrationHelper;

  constructor(@InjectConnection() connection: Connection) {
    this.migrationHelper = new MigrationHelper(connection);
  }

  async up() {
    await this.createUserIndexes();
    await this.createThreadIndexes();
    await this.createMessageIndexes();
    await this.createAgentIndexes();
    await this.createAgentConnectedIndexes();
  }

  async down() {
    await this.migrationHelper.dropIndexes('users');
    await this.migrationHelper.dropIndexes('threads');
    await this.migrationHelper.dropIndexes('messages');
    await this.migrationHelper.dropIndexes('agents');
    await this.migrationHelper.dropIndexes('agent-connected');
  }

  private async createUserIndexes() {
    const indexes = [
      {
        fields: { userId: 1 },
        options: { background: true, unique: true },
      },
      {
        fields: { zkAddress: 1 },
        options: { background: true, unique: true },
      },
    ];
    await this.migrationHelper.createIndexes('users', indexes);
  }

  private async createThreadIndexes() {
    const indexes = [
      {
        fields: { userId: 1 },
        options: { background: true, unique: true },
      },
    ];
    await this.migrationHelper.createIndexes('threads', indexes);
  }

  private async createMessageIndexes() {
    const indexes = [
      {
        fields: { userId: 1 },
        options: { background: true },
      },
      {
        fields: { agentId: 1 },
        options: { background: true },
      },
      {
        fields: { threadId: 1 },
        options: { background: true },
      },
    ];
    await this.migrationHelper.createIndexes('messages', indexes);
  }

  private async createAgentIndexes() {
    const indexes = [
      {
        fields: { agentId: 1 },
        options: { background: true, unique: true },
      },
      {
        fields: { apiKey: 1 },
        options: { background: true, unique: true },
      },
    ];
    await this.migrationHelper.createIndexes('agents', indexes);
  }

  private async createAgentConnectedIndexes() {
    const indexes = [
      {
        fields: { userId: 1, agentId: 1 },
        options: { background: true, unique: true },
      },
    ];
    await this.migrationHelper.createIndexes('agent-connected', indexes);
  }
}
