import { Connection } from 'mongoose';

export class MigrationHelper {
  constructor(private readonly connection: Connection) {}

  async createIndexes(collectionName: string, indexes: Array<{ fields: Record<string, number>; options: any }>) {
    const collection = this.connection.collection(collectionName);

    for (const index of indexes) {
      await collection.createIndex(index.fields, index.options);
    }
  }

  async dropIndexes(collectionName: string) {
    const collection = this.connection.collection(collectionName);
    await collection.dropIndexes();
  }
}
