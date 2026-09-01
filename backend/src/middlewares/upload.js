import multer from 'multer';

function upload(folderName = "") {
  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024, // 25 MB max
    },
  });
}

export { upload };
