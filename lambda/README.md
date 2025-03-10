# Translation Annotation Lambda Functions

This directory contains three AWS Lambda functions for the translation annotation system:

1. `saveAnnotation` - Saves user annotations to MongoDB
2. `deleteAnnotation` - Deletes user annotations from MongoDB
3. `getTranslations` - Fetches translations from the english-chinese-input-dataset collection

## MongoDB Collections

The system uses two collections:
- `annotations-v2`: Stores user annotations
- `english-chinese-input-dataset`: Stores original translations with fields:
  - `original`: English text
  - `machine_translation`: Chinese translation

## Deployment Procedure

1. **Prepare the Environment**
   ```bash
   # Install dependencies
   cd lambda
   npm install
   ```

2. **Package Individual Functions**
   ```bash
   # Package save annotation function
   npm run package-save
   
   # Package delete annotation function
   npm run package-delete
   
   # Package get translations function
   npm run package-get
   ```

3. **Deploy Individual Functions**
   ```bash
   # Deploy save annotation function
   npm run deploy-save
   
   # Deploy delete annotation function
   npm run deploy-delete
   
   # Deploy get translations function
   npm run deploy-get
   ```

4. **Deploy All Functions**
   ```bash
   # This will package and deploy all functions
   npm run deploy
   ```

## Available NPM Scripts

```json
{
  "scripts": {
    "package-save": "cd saveAnnotation && zip -r ../saveAnnotation.zip index.js ../node_modules ../package.json",
    "package-delete": "cd deleteAnnotation && zip -r ../deleteAnnotation.zip index.js ../node_modules ../package.json",
    "package-get": "cd getTranslations && zip -r ../getTranslations.zip index.js ../node_modules ../package.json",
    "deploy-save": "aws lambda update-function-code --function-name saveAnnotation --zip-file fileb://saveAnnotation.zip",
    "deploy-delete": "aws lambda update-function-code --function-name deleteAnnotation --zip-file fileb://deleteAnnotation.zip",
    "deploy-get": "aws lambda update-function-code --function-name getTranslations --zip-file fileb://getTranslations.zip",
    "deploy": "npm run package-save && npm run package-delete && npm run package-get && npm run deploy-save && npm run deploy-delete && npm run deploy-get"
  }
}
```

## Lambda Function Details

### 1. saveAnnotation
- **Purpose**: Saves user annotations for translations
- **Method**: POST
- **Input**: Annotation object with user details, translation, and error spans
- **Output**: Success confirmation or error message
- **Status Codes**:
  - 200: Success
  - 409: Duplicate submission
  - 500: Server error

### 2. deleteAnnotation
- **Purpose**: Removes user annotations
- **Method**: DELETE
- **Input**: userId and translation id
- **Output**: Success confirmation or error message
- **Status Codes**:
  - 200: Success
  - 404: Not found
  - 500: Server error

### 3. getTranslations
- **Purpose**: Fetches translations from MongoDB
- **Method**: GET
- **Input**: None
- **Output**: Array of translations with format:
  ```json
  {
    "translations": [
      {
        "id": "mongodb_id",
        "englishText": "original",
        "chineseText": "machine_translation"
      }
    ]
  }
  ```
- **Status Codes**:
  - 200: Success
  - 500: Server error

## Configuration

1. **Configure Lambda Environment Variables**
   In AWS Lambda Console for each function:
   ```
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB_NAME=your_database_name
   MONGODB_COLLECTION_NAME=your_collection_name
   ```

2. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your:
   # - AWS Access Key ID
   # - AWS Secret Access Key
   # - Default region (e.g., us-east-1)
   # - Default output format (json)
   ```

## API Gateway Setup

Each Lambda function needs an API Gateway endpoint:

1. **saveAnnotation**:
   - POST /annotations
   - Enable CORS
   - Accept application/json

2. **deleteAnnotation**:
   - DELETE /annotations
   - Enable CORS
   - Accept application/json

3. **getTranslations**:
   - GET /translations
   - Enable CORS

CORS Configuration for all endpoints:
```json
{
    "AllowOrigin": "*",
    "AllowMethods": "*",
    "AllowHeaders": "content-type, accept",
    "AllowCredentials": true
}
```

## Troubleshooting

1. **Deployment Issues**
   - Verify AWS CLI is configured correctly
   - Check Lambda function exists in AWS Console
   - Verify zip file was created successfully
   - Check Lambda execution role permissions

2. **Runtime Issues**
   - Check CloudWatch logs for errors
   - Verify MongoDB connection string
   - Ensure proper CORS configuration
   - Check API Gateway integration

3. **MongoDB Issues**
   - Verify network access in MongoDB Atlas
   - Check collection names and database access
   - Verify indexes for duplicate checks

## Security Considerations

1. **API Gateway**
   - Consider adding API key authentication
   - Restrict CORS to specific origins in production
   - Enable AWS WAF for additional security

2. **MongoDB**
   - Use IP whitelist in MongoDB Atlas
   - Create specific database user with minimal permissions
   - Regularly rotate credentials

3. **Lambda**
   - Use environment variables for sensitive data
   - Configure VPC if needed
   - Set appropriate timeout and memory values

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Create deployment package
npm run package
```

## If you're setting up new AWS Lambda resources

1. **Install AWS CLI and configure credentials**
   ```bash
   # Install AWS CLI
   brew install awscli   # For macOS
   # Or visit https://aws.amazon.com/cli/ for other platforms
   
   # Configure AWS CLI with your credentials
   aws configure
   # You'll need to enter:
   # - AWS Access Key ID
   # - AWS Secret Access Key
   # - Default region (e.g., us-east-1)
   # - Default output format (json)
   ```

2. **Create MongoDB Atlas Database** (if you haven't already)
   - Sign up/login to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier is fine)
   - Create a database user
   - Get your connection string
   - Whitelist all IPs (0.0.0.0/0) for testing

3. **Create Lambda Function in AWS Console**
   - Go to AWS Console → Lambda
   - Click "Create function"
   - Select "Author from scratch"
   - Basic settings:
     - Function name: `saveAnnotation`
     - Runtime: Node.js 18.x
     - Architecture: x86_64
     - Execution role: Create a new role with basic Lambda permissions
   - Click "Create function"

4. **Configure Lambda Function**
   - In the Lambda function configuration, add environment variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     MONGODB_DB_NAME=your_database_name
     MONGODB_COLLECTION_NAME=your_collection_name
     ```
   - Under Configuration → General configuration:
     - Set Memory: 256 MB
     - Set Timeout: 30 seconds

5. **Set up API Gateway**
   - In Lambda function page → Add trigger
   - Select "API Gateway"
   - Create new API:
     - Choose "REST API"
     - Security: "Open" (for development)
   - Click "Add"
   - Note down the API endpoint URL

6. **Configure CORS in API Gateway**
   - Go to API Gateway console
   - Select your API
   - Select the POST method
   - Click "Enable CORS"
   - Add headers:
     ```
     Access-Control-Allow-Origin: '*'
     Access-Control-Allow-Headers: 'Content-Type,Authorization'
     Access-Control-Allow-Methods: 'POST,OPTIONS'
     ```
   - Click "Enable CORS and replace existing CORS headers"
   - Click "Deploy API"

7. **Update Environment Variables**
   Create/update your `.env` file with:
   ```bash
   # AWS Configuration
   VITE_AWS_REGION=us-east-1  # or your chosen region
   VITE_AWS_API_ENDPOINT=your_api_gateway_endpoint
   VITE_AWS_LAMBDA_FUNCTION_NAME=saveAnnotation
   
   # MongoDB Configuration (for Lambda function)
   MONGODB_URI=your_mongodb_uri
   MONGODB_DB_NAME=your_db_name
   MONGODB_COLLECTION_NAME=your_collection_name
   ```

8. **Deploy the Function**
   ```bash
   # Install dependencies
   cd lambda
   npm install
   
   # Deploy
   ./scripts/deploy.sh saveAnnotation
   ```

9. **Test the Deployment**
   - In AWS Lambda console, create a test event
   - Use this sample event:
     ```json
     {
       "body": "{\"entryId\":\"test\",\"originalText\":\"Hello\",\"originalChinese\":\"你好\",\"editedText\":\"您好\",\"errorAnnotations\":[],\"timestamp\":\"2024-02-12T00:00:00.000Z\"}"
     }
     ```
   - Click "Test" and verify the function executes successfully

10. **Security Considerations for Production**
    - Update CORS settings to only allow your domain
    - Add API key authentication to API Gateway
    - Configure VPC for Lambda if needed
    - Set up proper IAM roles with minimal permissions
    - Enable AWS CloudWatch logs
    - Set up proper MongoDB Atlas network access

## Structure

```
lambda/
├── src/                 # Source code
│   ├── config.ts       # AWS configuration
│   └── saveAnnotation.ts # Main Lambda function
├── scripts/            # Build and deployment scripts
├── dist/              # Compiled JavaScript (generated)
└── function.zip       # Deployment package (generated)
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Create deployment package:
```bash
npm run package
```

## Deployment

1. Create a new Lambda function in AWS Console:
   - Runtime: Node.js 18.x
   - Handler: saveAnnotation.handler
   - Architecture: x86_64

2. Set environment variables in AWS Lambda:
   ```
   MONGODB_URI=your_mongodb_uri
   MONGODB_DB_NAME=your_db_name
   MONGODB_COLLECTION_NAME=your_collection_name
   ```

3. Deploy the function:
   ```bash
   npm run deploy
   ```
   Then upload the generated `function.zip` to AWS Lambda

4. Set up API Gateway:
   - Create a new REST API
   - Create a POST method
   - Enable CORS
   - Deploy the API

## Local Testing

To test the function locally:

1. Create a `.env` file with your MongoDB credentials
2. Use the AWS SAM CLI or run the function directly with test events

## API Gateway Configuration

Make sure to configure CORS in API Gateway:

```json
{
    "AllowOrigin": "*",
    "AllowMethods": "POST,OPTIONS",
    "AllowHeaders": "Content-Type,Authorization",
    "AllowCredentials": true
}
``` 