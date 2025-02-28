const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));


res.setHeader('Access-Control-Allow-Origin', 'https://oficios-imssb-1.onrender.com');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
// Configuración de Firebase con credenciales del .env
try {
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
console.log("Firebase inicializado correctamente.");
} catch (error) {
  console.error("Error inicializando Firebase:", error);
}

console.log({
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? "Cargada correctamente" : "No cargada",
});

const db = admin.firestore();

// Configura Google Drive usando variables de entorno

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

console.log({
  project_id: process.env.GOOGLE_PROJECT_ID,
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY
    ? "Cargada correctamente"
    : "No cargada",
});

// Configura Multer para manejar la subida de archivos
const upload = multer({ dest: "uploads/" });

// Habilitar CORS para permitir solicitudes desde el frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/login", async (req, res) => {
  const { usuario, contrasenia } = req.body;

   if (!usuario || !contrasenia) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }
  
  try {
     const usuarioStr = String(usuario); // Asegurar que sea string
    const snapshot = await db.collection("usuarios").where("usuario", "==", usuarioStr).get();

    if (snapshot.empty) {
      console.log("Usuario no encontrado:", usuario);
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    let user = null;
    snapshot.forEach((doc) => {
      user = doc.data();
    });

    console.log("Usuario encontrado:", user);

    if (user.contrasenia === contrasenia) {
      console.log("Inicio de sesión exitoso");
      return res.json({ success: true });
    } else {
      console.log("Contraseña incorrecta");
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
  } catch (error) {
    console.error("Error en el servidor:", error.message);
    return res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
});

// Ruta para obtener todos los oficios
app.get("/oficios", async (req, res) => {
  try {
    const snapshot = await db.collection("oficios").get();
    const oficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(oficios);
  } catch (error) {
    console.error("Error obteniendo oficios:", error);
    res.status(500).json({ error: "Error al obtener los oficios" });
  }
});

// Middleware para parsear el cuerpo de la solicitud
app.use(express.urlencoded({ extended: true })); // Para formularios URL-encoded
app.use(express.json()); // Para JSON

//Subir archivos a drive
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log('Archivo recibido:', req.file);
    
    const fileMetadata = {
      name: req.file.originalname,
      parents: ["1oDpS4cpd3cztUqHcjdUStP3_rtKWCYZT"],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    console.log('Subiendo archivo a Google Drive...');
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id,webViewLink",
    });

    const fileUrl = response.data.webViewLink;
    console.log('Archivo subido a Google Drive. URL:', fileUrl);


    const { folio, asunto, destinatario, remitente, estado } = req.body;

    const now = new Date();
    const fechaFormateada = now
      .toLocaleString("en-US", {
        month: "short", // Mes abreviado (Ej: Feb)
        day: "2-digit", // Día con dos dígitos
        year: "numeric", // Año completo
        hour: "2-digit", // Hora con dos dígitos
        minute: "2-digit", // Minutos con dos dígitos
        second: "2-digit", // Segundos con dos dígitos
        hour12: false, // Formato de 24 horas
        timeZone: "America/Mexico_City", // Zona horaria de México
      })
      .replace(/(\d{4}), /, "$1 @ "); // Reemplaza la coma después del año por " @ "


    // Guarda la URL en Firebase
    await db.collection("oficios").add({
      folio,
      asunto,
      destinatario,
      remitente,
      estado,
      fecha: fechaFormateada,
      enlace: fileUrl,
    });

    // Elimina el archivo temporal
    fs.unlinkSync(req.file.path);

    res.status(200).send({ url: fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading file");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
