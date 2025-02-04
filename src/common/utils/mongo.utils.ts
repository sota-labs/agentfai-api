import { ClientSession, Connection, Types } from 'mongoose';

export class MongoUtils {
  static async withTransaction<R = any>(
    connection: Connection,
    fn: (session: ClientSession) => Promise<R>,
    defaultSession?: ClientSession,
  ): Promise<R> {
    if (defaultSession) return await fn(defaultSession);

    const session = await connection.startSession();
    let result: R;
    try {
      await session.withTransaction(async (ses) => {
        result = await fn(ses);
      });
      return result;
    } catch (e) {
      throw e;
    } finally {
      await session.endSession();
    }
  }

  static compareObjectId(objectIdString1: string, objectIdString2: string): number {
    // return 0 if objectId1 is equal to objectId2
    // return 1 if objectId1 is greater than objectId2
    // return -1 if objectId1 is less than objectId2
    if (!objectIdString2) return 1;
    if (!objectIdString1) return -1;

    const objectId1 = new Types.ObjectId(objectIdString1);
    const objectId2 = new Types.ObjectId(objectIdString2);
    if (objectId1.equals(objectId2)) return 0;
    if (objectId1 > objectId2) return 1;
    return -1;
  }
}
