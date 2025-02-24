const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configura Firebase
const serviceAccount = require('./credentials-firebase.json'); // Archivo de Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configura Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: './credentials-google-cloud.json', // Archivo de Google Cloud
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Obtener el usuario de Firestore
    const userRef = db.collection('users').doc(username);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const hashedPassword = userDoc.data().password;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    res.status(200).json({ message: 'Inicio de sesión exitoso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta para subir archivos
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { folio, asunto, remitente, destinatario, estatus } = req.body;

    // Subir el archivo a Google Drive
    const fileMetadata = {
      name: req.file.originalname,
      parents: ['1oDpS4cpd3cztUqHcjdUStP3_rtKWCYZT'], // Reemplaza con el ID de tu carpeta en Drive
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileUrl = response.data.webViewLink;

    // Guardar la información en Firestore
    await db.collection('oficios').add({
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

    res.status(200).json({ message: 'Archivo subido correctamente', fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
});

// Ruta para obtener todos los oficios
app.get('/oficios', async (req, res) => {
  try {
    const snapshot = await db.collection('oficios').get();
    const oficios = [];
    snapshot.forEach((doc) => {
      oficios.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(oficios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los oficios' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});