import { removeUploadedFiles } from "../utils/validationHelper.js";

export const validate = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const parsedData = await schema.parseAsync(req[source]);

      req[source] = parsedData;
      next();
    } catch (error) {
      if (req.file || req.files) {
        removeUploadedFiles(req.file || req.files);
      }

      if (error.name === "ZodError") {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return res.status(400).json({
          message: "Validation error",
          errors: formattedErrors,
        });
      }

      next(error);
    }
  };
};
