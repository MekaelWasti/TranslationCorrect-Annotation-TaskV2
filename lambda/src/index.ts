import { MongoClient, ServerApiVersion, Db } from 'mongodb';

interface ErrorAnnotation {
  start: number;
  end: number;
  type: string;
  text: string;
}

interface AnnotationData {
  entryId: string;
  originalText: string;
  originalChinese: string;
  editedText: string;
  errorAnnotations: ErrorAnnotation[];
}

let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME);
  cachedDb = db;
  return db;
}

export const handler = async (event: AnnotationData) => {
  try {
    const db = await connectToDatabase();
    
    const collectionName = process.env.MONGODB_COLLECTION_NAME;
    if (!collectionName) {
      throw new Error('MONGODB_COLLECTION_NAME is not defined');
    }

    const collection = db.collection(collectionName);
    const result = await collection.insertOne({
      ...event,
      timestamp: new Date(),
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Annotation saved successfully',
        id: result.insertedId,
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error saving annotation',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    };
  }
}; 