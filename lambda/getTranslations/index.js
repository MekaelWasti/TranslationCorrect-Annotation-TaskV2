const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB_NAME);
  
  // Ensure index exists for efficient querying
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);
  await collection.createIndex({ userId: 1, id: 1 });
  
  cachedDb = db;
  return db;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': 'content-type, accept',
    'content-type': 'application/json'
  };

  try {
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const userId = queryParams.userId;
    const skip = (page - 1) * limit;

    const db = await connectToDatabase();
    const translationsCollection = db.collection('english-chinese-input-dataset');
    const annotationsCollection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    // Get total count for pagination
    const total = await translationsCollection.countDocuments();
    const totalPages = Math.ceil(total / limit);

    // Get paginated translations
    const translations = await translationsCollection.find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // Transform translations and get submission status if userId is provided
    const transformedTranslations = await Promise.all(translations.map(async (item) => {
      const translation = {
        id: item._id.toString(),
        englishText: item.original,
        chineseText: item.machine_translation,
        isSubmitted: false
      };

      if (userId) {
        // Check if this translation has been submitted by the user
        const submission = await annotationsCollection.findOne({
          userId,
          id: translation.id
        }, { projection: { _id: 1 } });
        
        translation.isSubmitted = !!submission;
      }

      return translation;
    }));

    const response = {
      statusCode: 200,
      headers,
      body: {
        translations: transformedTranslations,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit
        }
      }
    };

    return response;
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: {
        message: error.message || 'Error fetching translations',
        error: 'INTERNAL_SERVER_ERROR'
      }
    };
  }
}; 