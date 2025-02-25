const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

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

app.post("/login", async (req, res) => {
  const { usuario, contrasenia } = req.body;

  try {
    const snapshot = await db.collection("usuarios").where("usuario", "==", usuario).get();

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

app.post("/subir_oficios", async (req, res) => {
  try {
    const oficio = req.body;
    oficio.fecha = admin.firestore.Timestamp.now(); // Agrega timestamp de Firebase

    const docRef = await db.collection("oficios").add(oficio);
    res.status(201).json({ id: docRef.id, message: "Oficio agregado con éxito" });
  } catch (error) {
    console.error("Error al agregar oficio:", error);
    res.status(500).json({ error: "No se pudo agregar el oficio" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
