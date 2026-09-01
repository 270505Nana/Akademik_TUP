import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const getStorageDriver = () => {
  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  return driver;
};

const isR2Driver = () => {
  const driver = getStorageDriver();
  return driver === 'r2' || driver === 's3';
};

let s3ClientInstance = null;

const getS3Client = () => {
  if (!s3ClientInstance) {
    const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
    const region = process.env.R2_REGION || process.env.S3_REGION || 'auto';

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      console.warn('[StorageService] Peringatan: Kredensial R2/S3 belum lengkap di .env.');
    }

    s3ClientInstance = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }
  return s3ClientInstance;
};

const getBucketName = () => {
  return process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'akademik-tup';
};

/**
 * Normalisasi path file menjadi key S3/R2 yang bersih (menggunakan forward slash)
 */
const normalizeKey = (filepathOrKey) => {
  if (!filepathOrKey) return '';
  return filepathOrKey.replace(/\\/g, '/').replace(/^\/+/, '');
};

/**
 * Upload file buffer ke Storage (R2 atau Local Disk)
 * @param {Object} params
 * @param {Buffer} params.buffer - Data file buffer
 * @param {string} [params.originalname] - Nama file asli
 * @param {string} [params.customFilename] - Nama file kustom yang ditentukan
 * @param {string} [params.folder] - Subfolder kategori file (misal 'berkas-sidang')
 * @param {string} [params.mimetype] - Content-Type / MIME type file
 * @returns {Promise<{ filepath: string, filename: string, key: string }>}
 */
const uploadFile = async ({
  buffer,
  originalname = '',
  customFilename = null,
  folder = '',
  mimetype = 'application/octet-stream',
}) => {
  if (!buffer) {
    throw new Error('Buffer file tidak ditemukan untuk diunggah');
  }

  const ext = originalname ? path.extname(originalname) : '.pdf';
  const filename = customFilename || `${uuidv4()}${ext || ''}`;

  if (isR2Driver()) {
    const s3 = getS3Client();
    const bucket = getBucketName();
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const key = cleanFolder ? `${cleanFolder}/${filename}` : filename;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );

    return {
      filepath: key,
      filename,
      key,
    };
  } else {
    // Local Storage
    const baseDir = path.resolve(process.cwd(), 'uploads');
    const targetDir = folder ? path.join(baseDir, folder) : baseDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const localFilePath = path.join(targetDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    // Simpan format path relatif 'uploads/folder/filename'
    const relativePath = path.relative(process.cwd(), localFilePath).replace(/\\/g, '/');

    return {
      filepath: relativePath,
      filename,
      key: relativePath,
    };
  }
};

/**
 * Hapus file dari Storage (R2 atau Local Disk)
 * @param {string} filepathOrKey
 */
const deleteFile = async (filepathOrKey) => {
  if (!filepathOrKey) return;

  try {
    if (isR2Driver()) {
      const s3 = getS3Client();
      const bucket = getBucketName();
      const key = normalizeKey(filepathOrKey);

      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } else {
      const localFilePath = path.resolve(process.cwd(), filepathOrKey);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  } catch (error) {
    console.error(`[StorageService] Gagal menghapus berkas: ${filepathOrKey}`, error.message);
  }
};

/**
 * Dapatkan Presigned URL untuk download langsung dari Cloudflare R2
 * @param {string} filepathOrKey
 * @param {Object} options
 * @param {string} [options.downloadFilename] - Nama file saat disimpan di perangkat user
 * @param {number} [options.expiresIn=300] - Durasi link berlaku dalam detik (default 5 menit)
 * @param {string} [options.contentType] - MIME type
 * @param {boolean} [options.inline=false] - Preview inline (true) atau unduh attachment (false)
 */
const getPresignedUrl = async (
  filepathOrKey,
  { downloadFilename = null, expiresIn = 300, contentType = null, inline = false } = {}
) => {
  if (!isR2Driver()) return null;

  const s3 = getS3Client();
  const bucket = getBucketName();
  const key = normalizeKey(filepathOrKey);

  const dispositionType = inline ? 'inline' : 'attachment';
  const disposition = downloadFilename
    ? `${dispositionType}; filename="${encodeURIComponent(downloadFilename)}"`
    : dispositionType;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: disposition,
    ...(contentType ? { ResponseContentType: contentType } : {}),
  });

  return await getSignedUrl(s3, command, { expiresIn });
};

/**
 * Ambil file stream dari Storage (R2 atau Local Disk)
 * @param {string} filepathOrKey
 * @returns {Promise<{ stream: NodeJS.ReadableStream, contentType: string, contentLength: number }>}
 */
const getFileStream = async (filepathOrKey) => {
  if (!filepathOrKey) {
    throw new Error('Path berkas tidak valid');
  }

  if (isR2Driver()) {
    const s3 = getS3Client();
    const bucket = getBucketName();
    const key = normalizeKey(filepathOrKey);

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return {
      stream: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
    };
  } else {
    const localFilePath = path.resolve(process.cwd(), filepathOrKey);
    if (!fs.existsSync(localFilePath)) {
      throw new Error('Berkas fisik tidak ditemukan di server');
    }

    const stat = fs.statSync(localFilePath);
    return {
      stream: fs.createReadStream(localFilePath),
      contentType: 'application/octet-stream',
      contentLength: stat.size,
    };
  }
};

/**
 * Handler helper untuk melayani proses Download berkas di Express Controller
 * Menggunakan Presigned URL (Redirect 302) jika R2, atau res.download jika Local
 */
const serveDownload = async (res, { filepath, downloadName, mimeType = null }) => {
  if (!filepath) {
    res.status(404);
    throw new Error('File tidak ditemukan');
  }

  if (isR2Driver()) {
    const presignedUrl = await getPresignedUrl(filepath, {
      downloadFilename: downloadName,
      expiresIn: 300, // 5 menit
      contentType: mimeType,
      inline: false,
    });
    return res.redirect(presignedUrl);
  } else {
    const localFilePath = path.resolve(process.cwd(), filepath);
    if (!fs.existsSync(localFilePath)) {
      res.status(404);
      throw new Error('Berkas fisik tidak ditemukan di server');
    }
    return res.download(localFilePath, downloadName);
  }
};

/**
 * Handler helper untuk melayani Preview berkas di Express Controller (inline di browser)
 */
const servePreview = async (res, { filepath, filename, mimeType = 'application/pdf' }) => {
  if (!filepath) {
    res.status(404);
    throw new Error('File tidak ditemukan');
  }

  if (isR2Driver()) {
    const presignedUrl = await getPresignedUrl(filepath, {
      downloadFilename: filename,
      expiresIn: 300,
      contentType: mimeType,
      inline: true,
    });
    return res.redirect(presignedUrl);
  } else {
    const localFilePath = path.resolve(process.cwd(), filepath);
    if (!fs.existsSync(localFilePath)) {
      res.status(404);
      throw new Error('Berkas fisik tidak ditemukan di server');
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    return res.sendFile(localFilePath);
  }
};

export {
  uploadFile,
  deleteFile,
  getFileStream,
  getPresignedUrl,
  serveDownload,
  servePreview,
  isR2Driver,
  getStorageDriver,
};
