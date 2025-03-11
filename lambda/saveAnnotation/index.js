const { MongoClient, ObjectId } = require('mongodb');

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
  console.log('Received annotation:', JSON.stringify(annotation, null, 2));

  try {
    const db = await connectToDatabase();
    const translationsCollection = db.collection('english-chinese-input-dataset');
    const annotationsCollection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    // Check for existing annotation first
    const existingAnnotation = await annotationsCollection.findOne({
      userId: annotation.userId,
      id: annotation.id
    });

    console.log('Existing annotation check:', existingAnnotation);

    if (existingAnnotation) {
      const response = {
        statusCode: 409,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: 'This translation has already been annotated by you.',
          error: 'DUPLICATE_SUBMISSION'
        })
      };
      console.log('Duplicate submission response:', response);
      return response;
    }

    // Update the translation document with annotation status
    const updateResult = await translationsCollection.updateOne(
      { _id: new ObjectId(annotation.id) },
      { 
        $set: { 
          [`annotationStatus.${annotation.userId}`]: true 
        } 
      }
    );

    console.log('Translation update result:', updateResult);

    if (updateResult.matchedCount === 0) {
      const response = {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: 'Translation not found',
          error: 'NOT_FOUND'
        })
      };
      console.log('Not found response:', response);
      return response;
    }

    // Save the full annotation details
    const insertResult = await annotationsCollection.insertOne(annotation);
    console.log('Annotation insert result:', insertResult);

    const successResponse = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: 'Annotation saved successfully'
      })
    };
    console.log('Success response:', successResponse);
    return successResponse;

  } catch (error) {
    console.error('Error:', error);
    const errorResponse = {
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
    console.log('Error response:', errorResponse);
    return errorResponse;
  }
}; 