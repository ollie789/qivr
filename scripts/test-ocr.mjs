#!/usr/bin/env node
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { readFileSync } from 'fs';

const QUEUE_URL = "https://sqs.ap-southeast-2.amazonaws.com/818084701597/qivr-document-ocr";
const REGION = "ap-southeast-2";

const sqsClient = new SQSClient({ region: REGION });

async function testOcr() {
  console.log("Testing OCR pipeline...\n");

  // Test message
  const message = {
    documentId: "15e518ae-57f8-4033-9d94-509d9295ebf6", // Use existing document
    s3Bucket: "qivr-documents-prod",
    s3Key: "documents/15e518ae-57f8-4033-9d94-509d9295ebf6"
  };

  console.log("Sending test message to SQS:");
  console.log(JSON.stringify(message, null, 2));

  try {
    const result = await sqsClient.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message)
    }));

    console.log("\n✅ Message sent successfully!");
    console.log("Message ID:", result.MessageId);
    console.log("\nCheck Lambda logs in a few seconds:");
    console.log("aws logs tail /aws/lambda/qivr-document-ocr --region ap-southeast-2 --follow");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

testOcr();
