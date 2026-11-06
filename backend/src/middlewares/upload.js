import multer from 'multer';

function upload(folderName = "") {
  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: {
      fileSize: 1 * 1024 * 1024, // 1 MB max
    },
  });
}

export { upload };
