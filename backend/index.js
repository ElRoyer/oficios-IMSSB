const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });

let serviceAccount;
try {
  console.log("FIREBASE_CREDENTIALS:", process.env.FIREBASE_CREDENTIALS);
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS.replace(/\\n/g, '\n'));
} catch (error) {
  console.error("Error al parsear FIREBASE_CREDENTIALS:", error);
  process.exit(1); // Detiene el servidor si la credencial no es válida
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configura Google Drive
let googleCrendentials;

try {
  console.log("GOOGLE_CREDENTIALS", process.env.GOOGLE_CREDENTIALS);
  googleCrendentials = JSON.parse(process.env.GOOGLE_CREDENTIALS.replace(/\\n/g, '\n'));
  const auth = new google.auth.GoogleAuth({
    credentials: googleCrendentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
} catch (error) {
  console.error("Error al configurar las credenciales de Google:", error);
  process.exit(1);
}

const drive = google.drive({ version: "v3", auth });

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://fonts.gstatic.com; script-src 'self';"
  );
  next();
});
app.use(express.static("frontend")); // Sirve archivos estáticos desde la carpeta "frontend"

// Ruta para iniciar sesión
app.post("/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    // Obtener el usuario de Firestore
    const userRef = db.collection("usuarios").doc(usuario);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: "Usuario no encontrado" });
    }

    // Verificar la contraseña
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

// Ruta para subir archivos
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { folio, asunto, remitente, destinatario, estatus } = req.body;

    // Subir el archivo a Google Drive
    const fileMetadata = {
      name: req.file.originalname,
      parents: ["1oDpS4cpd3cztUqHcjdUStP3_rtKWCYZT"], // Reemplaza con el ID de tu carpeta en Drive
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

    // Guardar la información en Firestore
    await db.collection("oficios").add({
      folio,
      asunto,
      remitente,
      destinatario,
      estatus,
      fileUrl,
      fecha: new Date().toISOString(),
    });

    // Eliminar el archivo temporal
    fs.unlinkSync(req.file.path);

    res.status(200).json({ message: "Archivo subido correctamente", fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al subir el archivo" });
  }
});

// Ruta para obtener todos los oficios
app.get("/oficios", async (req, res) => {
  try {
    const snapshot = await db.collection("oficios").get();
    const oficios = [];
    snapshot.forEach((doc) => {
      oficios.push({ id: doc.id, ...doc.data() });
    });
    console.log("Oficios obtenidos:", oficios); // Mensaje de depuración
    res.status(200).json(oficios);
  } catch (error) {
    console.error("Error al obtener los oficios:", error); // Mensaje de depuración
    res.status(500).json({ error: "Error al obtener los oficios" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
