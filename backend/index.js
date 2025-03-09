const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' https://framework-gb.cdn.gob.mx;");
  next();
});
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
  private_key: process.env.FIREBASE_PRIVATE_KEY
    ? "Cargada correctamente"
    : "No cargada",
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
    return res
      .status(400)
      .json({ error: "Usuario y contraseña son requeridos" });
  }

  try {
    const usuarioStr = String(usuario); // Asegurar que sea string
    const snapshot = await db
      .collection("usuarios")
      .where("usuario", "==", usuarioStr)
      .get();

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
      return res.json({ success: "Inicio de Sesion Exitoso" });
    } else {
      console.log("Contraseña incorrecta");
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
  } catch (error) {
    console.error("Error en el servidor", error.message);
    return res
      .status(500)
      .json({ error: "Error en el servidor: 1", details: error.message });
  }
});

// Ruta para obtener todos los oficios
app.get("/oficios", async (req, res) => {
  try {
    let { lastVisible, pageSize } = req.query;
    pageSize = parseInt(pageSize) || 4; // por defecto 12 registros

    let query = db
      .collection("oficios")
      .orderBy("fecha", "desc")
      .limit(pageSize);

    if (lastVisible) {
      // Convierte el `lastVisible` de la URL a un `DocumentSnapshot` de Firestore
      const lastDoc = await db.collection("oficios").doc(lastVisible).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }
    const snapshot = await query.get();
    const oficios = snapshot.docs.map((doc) => {
      const data = doc.data();
      const fecha = data.fecha ? data.fecha.toDate().toISOString() : null;
      return { id: doc.id, ...data, fecha }; // Agregar la fecha formateada
    });

    if (!oficios || oficios.length === 0) {
      return res.status(404).json({ error: "No se encontraron registros" });
    }

    const last =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null;

    res.json({ oficios, lastVisible: last });
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ error: "Error obteniendo los datos" });
  }
});

// Middleware para parsear el cuerpo de la solicitud
app.use(express.urlencoded({ extended: true })); // Para formularios URL-encoded
app.use(express.json()); // Para JSON

//Subir archivos a drive
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Archivo recibido:", req.file);

    // Obtener los campos del cuerpo de la solicitud
    const { folio, asunto, destinatario, remitente, estado, fecha } = req.body;

    if (!req.file) {
      return res.status(400).send("No se recibió ningún archivo.");
    }

    if (!folio || !asunto || !destinatario || !remitente || !estado) {
      return res.status(400).send("Todos los campos son obligatorios.");
    }

    const fileMetadata = {
      name: req.file.originalname,
      parents: ["1oDpS4cpd3cztUqHcjdUStP3_rtKWCYZT"],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    console.log("Subiendo archivo a Google Drive...");
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id,webViewLink",
    });

    const fileUrl = response.data.webViewLink;
    console.log("Archivo subido a Google Drive. URL:", fileUrl);

    // Guarda la URL en Firebase
    await db.collection("oficios").add({
      folio,
      asunto,
      destinatario,
      remitente,
      estado,
      fecha: admin.firestore.Timestamp.now(), // Asigna la fecha actual
      enlace: fileUrl,
    });

    // Elimina el archivo temporal
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).send({ url: fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading file");
  }
});

app.get("/oficios/search", async (req, res) => {
  try {
    const { folio } = req.query;
    console.log("Búsqueda de oficio por folio:", folio); // Log de folio recibido

    if (!folio) {
      return res.status(400).json({ error: "Folio es obligatorio" });
    }

    // Realizar la búsqueda por folio en Firestore
    const snapshot = await db
      .collection("oficios")
      .where("folio", "==", folio)
      .get();

    const oficios = snapshot.docs.map((doc) => {
      const data = doc.data();
      const fecha = data.fecha ? data.fecha.toDate().toISOString() : null;
      return { id: doc.id, ...data, fecha }; // Devolver el oficio con la fecha formateada
    });

    if (oficios.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró el oficio con ese folio" });
    }

    res.json({ oficios });
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el oficio" });
  }
});

// Asegúrate de que la ruta esté configurada correctamente
app.put("/oficios/:id", async (req, res) => {
  const id = req.params.id; // Obtener el id de la URL
  const { folio, asunto, destinatario, remitente, estado } = req.body;

  try {
    // Actualizar el documento con el ID dado
    const oficioRef = db.collection("oficios").doc(id);
    await oficioRef.update({
      folio,
      asunto,
      destinatario,
      remitente,
      estado,
    });

    res.status(200).json({ message: "Oficio actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el oficio:", error);
    res.status(500).json({ message: "Error al actualizar el oficio", error });
  }
});

//Filtrar por fecha
// Función para filtrar por fecha

// Endpoint para filtrar oficios
app.post("/filtrar-oficios", async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Fechas inválidas" });
    }

    const snapshot = await db.collection("oficios").get();
    let oficios = [];

    console.log("Fecha Inicio recibida:", new Date(fechaInicio).toISOString());
    console.log("Fecha Fin recibida:", new Date(fechaFin).toISOString());


    snapshot.forEach((doc) => {
      let data = doc.data();
      let fechaTimestamp;

      if (data.fecha && data.fecha.toDate) {
        fechaTimestamp = data.fecha.toDate().getTime();
      } else if (typeof data.fecha === "number") {
        fechaTimestamp = data.fecha;
      } else {
        console.warn(`Registro con ID ${doc.id} tiene una fecha inválida.`);
        return;
      }

      if (fechaTimestamp >= fechaInicio && fechaTimestamp <= fechaFin) {
        oficios.push({ id: doc.id, ...data });
      }
    });

    res.json(oficios);
  } catch (error) {
    console.error("Error al filtrar oficios:", error);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
