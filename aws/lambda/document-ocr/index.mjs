import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import pg from 'pg';

const { Pool } = pg;
const textract = new TextractClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    const { documentId, s3Bucket, s3Key } = message;

    try {
      // Run Textract
      const textractResponse = await textract.send(new DetectDocumentTextCommand({
        Document: {
          S3Object: {
            Bucket: s3Bucket,
            Name: s3Key
          }
        }
      }));

      // Extract text
      const extractedText = textractResponse.Blocks
        .filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n');

      // Extract patient name (simple heuristic - first capitalized line)
      const lines = extractedText.split('\n');
      const patientName = lines.find(line => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line)) || null;

      // Extract DOB (look for date patterns)
      const dobMatch = extractedText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
      const extractedDob = dobMatch ? dobMatch[1] : null;

      // Calculate confidence (average of all blocks)
      const confidences = textractResponse.Blocks
        .filter(b => b.Confidence)
        .map(b => b.Confidence);
      const avgConfidence = confidences.length > 0 
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
        : null;

      // Update database
      await pool.query(`
        UPDATE documents 
        SET 
          status = 'ready',
          extracted_text = $1,
          extracted_patient_name = $2,
          extracted_dob = $3,
          confidence_score = $4,
          ocr_completed_at = NOW()
        WHERE id = $5
      `, [extractedText, patientName, extractedDob, avgConfidence?.toFixed(2), documentId]);

      console.log(`OCR completed for document ${documentId}`);

    } catch (error) {
      console.error(`OCR failed for document ${documentId}:`, error);
      
      // Mark as failed
      await pool.query(`
        UPDATE documents 
        SET status = 'failed'
        WHERE id = $1
      `, [documentId]);
    }
  }

  return { statusCode: 200 };
};
