import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import pg from 'pg';

const { Pool } = pg;

const region = process.env.AWS_REGION || 'ap-southeast-2';
const textract = new TextractClient({ region });
const s3 = new S3Client({ region });
const secretsManager = new SecretsManagerClient({ region });

let pool;

async function getDbPool() {
  if (pool) return pool;
  
  const secret = await secretsManager.send(new GetSecretValueCommand({
    SecretId: process.env.DB_SECRET_ARN
  }));
  
  const dbCreds = JSON.parse(secret.SecretString);
  
  pool = new Pool({
    host: dbCreds.host,
    port: parseInt(dbCreds.port || '5432'),
    database: dbCreds.database,
    user: dbCreds.username,
    password: dbCreds.password,
    ssl: { rejectUnauthorized: false },
    max: 2,
  });
  
  return pool;
}

export const handler = async (event) => {
  console.log('OCR Processor triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    console.log('Parsed message:', JSON.stringify(message));
    const { documentId, s3Key, s3Bucket } = message;
    const bucket = s3Bucket || process.env.S3_BUCKET;

    console.log(`Processing document: ${documentId}, S3: ${bucket}/${s3Key}`);

    try {
      // Get document from S3
      const s3Response = await s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      }));

      const documentBytes = await streamToBuffer(s3Response.Body);

      let extractedText, patientName, dob, confidence;

      // Check if file is plain text
      if (s3Key.endsWith('.txt')) {
        extractedText = documentBytes.toString('utf-8');
        patientName = extractPatientName(extractedText);
        dob = extractDateOfBirth(extractedText);
        confidence = 100;
        console.log(`Text file processed directly: ${extractedText.length} chars`);
      } else {
        // Process with Textract for images/PDFs
        const textractResponse = await textract.send(new DetectDocumentTextCommand({
          Document: { Bytes: documentBytes },
        }));

        extractedText = extractFullText(textractResponse.Blocks || []);
        patientName = extractPatientName(extractedText);
        dob = extractDateOfBirth(extractedText);
        confidence = calculateConfidence(textractResponse.Blocks || []);
        console.log(`Textract processed: ${extractedText.length} chars, confidence: ${confidence}%`);
      }

      console.log(`Extracted: ${extractedText.length} chars, confidence: ${confidence}%`);

      // Update database
      const dbPool = await getDbPool();
      console.log(`Updating document ${documentId} with text length: ${extractedText?.length}, confidence: ${confidence}`);
      
      const result = await dbPool.query(
        `UPDATE documents 
         SET status = $1, 
             extracted_text = $2, 
             extracted_patient_name = $3, 
             extracted_dob = $4, 
             confidence_score = $5,
             updated_at = NOW()
         WHERE id = $6`,
        ['ready', extractedText, patientName, dob, confidence, documentId]
      );

      console.log(`Document ${documentId} processed successfully, rows updated: ${result.rowCount}`);

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);

      // Mark as failed
      await pool.query(
        `UPDATE documents 
         SET status = $1, 
             updated_at = NOW()
         WHERE id = $2`,
        ['failed', documentId]
      );

      throw error;
    }
  }

  return { statusCode: 200, body: 'Processing complete' };
};

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function extractFullText(blocks) {
  return blocks
    .filter(block => block.BlockType === 'LINE')
    .map(block => block.Text)
    .join('\n');
}

function extractPatientName(text) {
  // Look for "Patient Name:" or "Name:" patterns
  const patterns = [
    /Patient\s+Name:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /Name:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractDateOfBirth(text) {
  // Look for DOB patterns: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  const patterns = [
    /Date\s+of\s+Birth:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /DOB:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /Born:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Convert to ISO format YYYY-MM-DD
      const [month, day, year] = match[1].split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

function calculateConfidence(blocks) {
  const confidences = blocks
    .filter(block => block.Confidence !== undefined)
    .map(block => block.Confidence);

  if (confidences.length === 0) return 0;

  const avg = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  return Math.round(avg * 100) / 100;
}
