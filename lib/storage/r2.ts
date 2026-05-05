import { S3Client } from '@aws-sdk/client-s3'

const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const endpoint = process.env.R2_ENDPOINT
const bucketName = process.env.R2_BUCKET_NAME

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint || '', 
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})