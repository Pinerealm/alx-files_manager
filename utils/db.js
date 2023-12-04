import { MongoClient } from 'mongodb';

// Define the DBClient class
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect((err) => {
      if (err) console.log(err);
      else console.log(`Connected to ${host}:${port}`);
    });
    this.db = this.client.db(database);
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const users = this.db.collection('users');
    const countUsers = await users.countDocuments();
    return countUsers;
  }

  async nbFiles() {
    const files = this.db.collection('files');
    const countFiles = await files.countDocuments();
    return countFiles;
  }

  // Check if an email already exists in the DB
  async emailExists(email) {
    const users = this.db.collection('users');
    const countUsers = await users.countDocuments({ email });
    return countUsers !== 0;
  }

  // Create and save a new user in the DB
  async createUser(email, password) {
    const users = this.db.collection('users');
    const newUser = await users.insertOne({ email, password });
    return { id: newUser.insertedId, email };
  }
}

const dbClient = new DBClient();
export default dbClient;
