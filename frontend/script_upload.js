
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
  
      oficios.forEach(oficio => {
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

// 🔹 Abrir y cerrar el modal
document.getElementById("openModalBtn").addEventListener("click", function () {
  document.getElementById("modal").style.display = "flex";
});

document.querySelector(".close").addEventListener("click", function () {
  document.getElementById("modal").style.display = "none";
});

// 🔹 Guardar oficio en Firestore
document.getElementById("oficioForm").addEventListener("submit", async function (event) {
    event.preventDefault();
  
    const nuevoOficio = {
      folio: document.getElementById("folio").value,
      asunto: document.getElementById("asunto").value,
      destinatario: document.getElementById("destinatario").value,
      remitente: document.getElementById("remitente").value,
      estado: document.getElementById("estado").value,
      enlace: document.getElementById("enlace").value,
    };
  
    try {
      const response = await fetch("https://oficios-imssb.onrender.com/subir_oficios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoOficio),
      });
  
      const result = await response.json();
      alert(result.message);
      document.getElementById("modal").style.display = "none";
      document.getElementById("oficioForm").reset();
    } catch (error) {
      console.error("Error al agregar el oficio:", error);
      alert("Error al agregar oficio");
    }
  });

