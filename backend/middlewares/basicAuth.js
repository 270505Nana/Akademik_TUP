const basicAuthSwagger = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Dokumentasi API Akademik"');
    return res.status(401).send("Akses ditolak. Silakan login.");
  }

  try {
    const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
    const username = auth[0];
    const password = auth[1];

    const validUsername = process.env.SWAGGER_USER || "admin";
    const validPassword = process.env.SWAGGER_PASSWORD || "akademik123";

    if (username === validUsername && password === validPassword) {
      return next();
    }
  } catch (error) {
    // Apabila format base64 tidak valid, kembalikan dialog login
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Dokumentasi API Akademik"');
  return res.status(401).send("Kredensial salah.");
};

module.exports = { basicAuthSwagger };
