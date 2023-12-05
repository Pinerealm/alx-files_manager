import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const emailExists = await dbClient.emailExists(email);
    if (emailExists) return res.status(400).send({ error: 'Already exist' });
    const user = await dbClient.users.insertOne(
      { email, password: sha1(password) },
    );

    return res.status(201).send({ id: user.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.get('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    let userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    userId = ObjectId(userId);

    const user = await dbClient.users.findOne({ _id: userId });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    return res.status(200).send({ id: user._id, email: user.email });
  }
}

export default UsersController;
