const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });

// 🔹 🔥 CREDENCIALES FIREBASE (Obtener desde variables de entorno)
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com",
};

// 🔹 🚀 INICIALIZAR FIREBASE
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔹 🌍 CREDENCIALES GOOGLE DRIVE (Obtener desde variables de entorno)
const googleCredentials = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com",
};

// 🔹 🔑 AUTENTICACIÓN CON GOOGLE DRIVE
const auth = new google.auth.GoogleAuth({
  credentials: googleCredentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

// 🔹 Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

// 🔹 🚪 RUTA PARA INICIO DE SESIÓN
app.post("/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    const userRef = db.collection("usuarios").doc(usuario);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    const hashedPassword = userDoc.data().contrasena;
    if (!hashedPassword || typeof hashedPassword !== "string") {
      return res.status(400).json({ error: "Error en las credenciales" });
    }

    res.status(200).json({ message: "Inicio de sesión exitoso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// 🔹 📂 RUTA PARA SUBIR ARCHIVOS A GOOGLE DRIVE Y GUARDAR EN FIRESTORE
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { folio, asunto, remitente, destinatario, estatus } = req.body;

    // 🔹 Subir el archivo a Google Drive
    const fileMetadata = {
      name: req.file.originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // 🔥 Reemplaza con el ID de tu carpeta en Drive
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    const fileUrl = response.data.webViewLink;

    // 🔹 Guardar la información en Firestore
    await db.collection("oficios").add({
      folio,
      asunto,
      remitente,
      destinatario,
      estatus,
      fileUrl,
      fecha: new Date().toISOString(),
    });

    fs.unlinkSync(req.file.path); // 🔹 Eliminar archivo temporal

    res.status(200).json({ message: "Archivo subido correctamente", fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al subir el archivo" });
  }
});

// 🔹 📄 RUTA PARA OBTENER OFICIOS
app.get("/oficios", async (req, res) => {
  try {
    const snapshot = await db.collection("oficios").get();
    const oficios = [];
    snapshot.forEach((doc) => {
      oficios.push({ id: doc.id, ...doc.data() });
    });
    console.log("Oficios obtenidos:", oficios);
    res.status(200).json(oficios);
  } catch (error) {
    console.error("Error al obtener los oficios:", error);
    res.status(500).json({ error: "Error al obtener los oficios" });
  }
});

// 🔹 🚀 INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
