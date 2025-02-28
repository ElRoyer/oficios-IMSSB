console.log('Script cargado correctamente'); // Depuración


document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    // Si estás almacenando un token en localStorage, elimínalo
    localStorage.removeItem("authUser");

    alert("Sesión cerrada correctamente.");
    window.location.href = "index.html"; // Redirigir al login
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
});

// Ruta para listar todos los oficios
document.addEventListener("DOMContentLoaded", () => {
  fetchOficios();
});
async function fetchOficios() {
  try {
    const response = await fetch("https://oficios-imssb.onrender.com/oficios"); // Cambia la URL si está en Render
    const oficios = await response.json();
    const tabla = document.getElementById("tablaOficios");
    tabla.innerHTML = ""; // Limpiar tabla antes de agregar nuevos datos

    oficios.forEach((oficio) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${oficio.folio}</td>
        <td>${oficio.asunto}</td>
        <td>${oficio.destinatario}</td>
        <td>${oficio.remitente}</td>
        <td>${oficio.estado}</td>
        <td>${oficio.fecha}</td>
        <td><a href="${oficio.enlace}" target="_blank">Ver</a></td>
      `;
      tabla.appendChild(row);
    });
  } catch (error) {
    console.error("Error al obtener los oficios:", error);
  }
}

// 🔹 Guardar oficio en Firestore
document.getElementById("uploadButton").addEventListener("click", async () => {
  const fileInput = document.getElementById('fileInput');
  const folio = document.getElementById('folio').value;
  const asunto = document.getElementById('asunto').value;
  const destinatario = document.getElementById('destinatario').value;
  const remitente = document.getElementById('remitente').value;
  const estado = document.getElementById('estado').value;

  if (fileInput.files.length === 0) {
    status.textContent = "Por favor, selecciona un archivo.";
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file); // Archivo
  formData.append('folio', folio); // Folio
  formData.append('asunto', asunto); // Asunto
  formData.append('destinatario', destinatario); // Destinatario
  formData.append('remitente', remitente); // Remitente
  formData.append('estado', estado); // Estado

  status.textContent = "Subiendo archivo...";

  try {
    console.log('Enviando solicitud al backend...'); // Depuración
    const response = await fetch("https://oficios-imssb.onrender.com/upload", {
      method: "POST",
      body: formData,
    });

    console.log('Respuesta recibida:', response); // Depuración

    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }

    const data = await response.json();
    status.textContent = 'Archivo subido correctamente';
  } catch (error) {
    console.error(error);
    status.textContent = "Error al subir el archivo.";
  }
});

document.getElementById("uploadButton").addEventListener("click", function(event) {
  event.preventDefault(); // Evita que el formulario se envíe si es necesario

  // Cierra el modal cambiando la URL (simula hacer clic en el botón de cerrar)
  window.location.hash = "#close";
});
