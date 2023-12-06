import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    // Get and validate token
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    // Get and validate file info
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).send({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).send({ error: 'Missing data' });

    // Validate parent
    if (parentId) {
      const parentIdObj = ObjectId(parentId);
      const parent = await dbClient.files.findOne({ _id: parentIdObj });
      if (!parent) return res.status(400).send({ error: 'Parent not found' });

      if (parent.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
    }

    // Create file object
    const file = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic: !!isPublic,
      parentId: parentId || 0,
    };
    if (type === 'folder') {
      const result = await dbClient.files.insertOne(file);
      file.id = result.insertedId;
    } else {
      const buff = Buffer.from(data, 'base64');
      const path = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
      file.localPath = `${path}/${uuidv4()}`;

      await fs.promises.writeFile(file.localPath, buff);
      const result = await dbClient.files.insertOne(file);
      file.id = result.insertedId;
    }
    return res.status(201).send({
      id: file.id,
      userId: file.userId,
      name,
      type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }
}

export default FilesController;
