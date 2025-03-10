const { MongoClient } = require('mongodb');

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
    console.log('Received delete request:', { userId, id });
    
    const db = await connectToDatabase();
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    if (!userId || !id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Missing required fields: userId and id',
          error: 'INVALID_REQUEST'
        })
      };
    }

    const result = await collection.deleteOne({
      userId,
      id
    });

    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: 'Annotation not found',
          error: 'NOT_FOUND'
        })
      };
    }

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
        message: 'Error processing request',
        error: error.message
      })
    };
  }
}; 