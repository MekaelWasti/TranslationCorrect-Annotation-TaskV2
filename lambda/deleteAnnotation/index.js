const { MongoClient, ObjectId } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB_NAME);
  cachedDb = db;
  return db;
}

exports.handler = async ({ userId, id }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': 'content-type, accept',
    'content-type': 'application/json'
  };

  try {
    const db = await connectToDatabase();
    const translationsCollection = db.collection('english-chinese-input-dataset');
    const annotationsCollection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    // Remove the user's annotation status
    const result = await translationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $unset: { 
          [`annotationStatus.${userId}`]: "" 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: 'Translation not found',
          error: 'NOT_FOUND'
        })
      };
    }

    // Also remove the full annotation
    await annotationsCollection.deleteOne({ userId, id });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Annotation deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Error deleting annotation',
        error: error.message
      })
    };
  }
}; 