
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


// Ruta para listar todos los oficios ACUTIALIZACION 2 AGREGAR AL RENDER
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
