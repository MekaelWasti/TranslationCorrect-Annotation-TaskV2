const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB_NAME);
  cachedDb = db;
  return db;
}

exports.handler = async (annotation) => {
  // Log the incoming annotation
  console.log('Received annotation:', JSON.stringify(annotation, null, 2));

  try {
    const db = await connectToDatabase();
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    // Check for existing annotation
    const existingAnnotation = await collection.findOne({
      userId: annotation.userId,
      id: annotation.id
    });

    if (existingAnnotation) {
      return {
        statusCode: 409,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: 'This translation has already been annotated by you. Please move to the next one.',
          error: 'DUPLICATE_SUBMISSION'
        })
      };
    }

    const result = await collection.insertOne(annotation);

    return {
      statusCode: 200,
      headers: {
        "": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: 'Annotation saved successfully',
        id: result.insertedId
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: 'Error saving annotation',
        error: error.message
      })
    };
  }
}; 