/**
 * Upload Controller
 * Handles presigned S3 URL generation for property images.
 * The frontend uploads directly to S3 — the backend never touches the binary.
 *
 * Flow:
 *   1. Frontend requests a presigned URL from this endpoint.
 *   2. Backend generates a presigned PUT URL valid for 5 minutes.
 *   3. Frontend uploads the file directly to S3 using PUT.
 *   4. Frontend calls PATCH /properties/:id with the public S3 URL.
 */
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'reos-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4'];

/**
 * POST /api/upload/presign
 * Body: { filename, contentType, purpose: 'property' | 'profile' }
 * Returns: { uploadUrl, publicUrl, key }
 */
async function getPresignedUrl(req, res) {
  const { filename, contentType, purpose = 'property' } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({ success: false, message: 'filename and contentType required' });
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: `Unsupported type: ${contentType}` });
  }

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `${purpose}/${req.user.id}/${uuidv4()}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: MAX_FILE_SIZE,
      Metadata: {
        uploader: req.user.id,
        purpose,
      },
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
    const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

    logger.info(`Presigned URL generated for ${req.user.id}: ${key}`);
    res.json({ success: true, data: { uploadUrl, publicUrl, key } });
  } catch (err) {
    logger.error('S3 presign error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
  }
}

/**
 * DELETE /api/upload/:key
 * Deletes a media file. Only allowed if the user owns it (key contains userId).
 */
async function deleteMedia(req, res) {
  const key = decodeURIComponent(req.params.key);

  // Security: only allow deleting own files
  if (!key.includes(req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this file' });
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    logger.error('S3 delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
}

module.exports = { getPresignedUrl, deleteMedia };
