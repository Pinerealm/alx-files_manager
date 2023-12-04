import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus() {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    return status;
  }

  static async getStats() {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    return stats;
  }
}

export default AppController;
