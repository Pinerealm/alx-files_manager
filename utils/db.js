import { MongoClient } from 'mongodb';

// Define the DBClient class
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    // Connect to the DB promise-style
    this.client.connect()
      .then(() => console.log(`Connected to ${host}:${port}`))
      .catch((err) => console.log(err));

    this.db = this.client.db(database);
    this.users = this.db.collection('users');
    this.files = this.db.collection('files');
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const countUsers = await this.users.countDocuments();
    return countUsers;
  }

  async nbFiles() {
    const countFiles = await this.files.countDocuments();
    return countFiles;
  }

  // Check if an email already exists in the DB
  async emailExists(email) {
    const countUsers = await this.users.countDocuments({ email });
    return countUsers !== 0;
  }

  // Get a user from the DB using his email and password
  async getUser(email, password) {
    const user = await this.users.findOne({ email, password });
    return user;
  }
}

const dbClient = new DBClient();
export default dbClient;
