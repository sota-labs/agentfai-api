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
  }

  async down() {
    await this.migrationHelper.dropIndexes('users');
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
}
