import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

function upload(folderName = "") {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const baseFolder = "uploads";

      const uploadPath = folderName
        ? path.join(baseFolder, folderName)
        : baseFolder;

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, {
          recursive: true,
        });
      }

      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);

      const filename = uuidv4() + ext;

      cb(null, filename);
    },
  });

  return multer({
    storage,
  });
}

export { upload };
