import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).send({ error: 'Unauthorized' });

    const base64Credentials = authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) return res.status(401).send({ error: 'Unauthorized' });

    const hashedPassword = sha1(password);
    const user = await dbClient.getUser(email, hashedPassword);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id, 86400);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.get('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    let userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    userId = ObjectId(userId);

    const user = await dbClient.users.findOne({ _id: userId });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

export default AuthController;
