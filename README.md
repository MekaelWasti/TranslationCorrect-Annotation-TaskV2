# Translation Error Annotation Tool

A web application for annotating translation errors in English to Chinese translations. Users can identify and categorize different types of translation errors, making it easier to improve translation quality.

## Features

- Google Authentication
- Batch-based translation review system
- Real-time translation editing with diff viewer
- Error span annotation with multiple error types
- Serverless backend using AWS Lambda and MongoDB

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Firebase account
- AWS account
- MongoDB database

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd error-in-translation
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values:
- Firebase configuration from your Firebase Console
- AWS Lambda configuration
- MongoDB connection details

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # React components
├── context/            # Context providers
├── services/           # External service integrations
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Error Types

The application supports the following translation error types:
- Addition: Extra content not present in the source
- Omission: Missing content from the source
- Mistranslation: Incorrect translation of source content
- Untranslated: Content left in source language
- Grammar: Grammatical errors in translation
- Spelling: Spelling errors in translation
- Typography: Formatting and punctuation errors
- Unintelligible: Translation that doesn't make sense

## AWS Lambda Setup

1. Create a new Lambda function in your AWS Console
2. Deploy the provided Lambda function code
3. Configure environment variables in Lambda:
   - MONGODB_URI
   - MONGODB_DB_NAME
   - MONGODB_COLLECTION_NAME

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
