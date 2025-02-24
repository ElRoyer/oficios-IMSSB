document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
  
    const usuario = document.getElementById("usuario").value;
    const contrasenia = document.getElementById("contrasenia").value;
    const errorMensaje = document.getElementById("errorMensaje");
  
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasenia }),
      });
  
      const data = await response.json();
      console.log("Respuesta del servidor:", data);
  
      if (response.ok) {
        window.location.href = "main.html"; // Redirigir si el login es exitoso
      } else {
        errorMensaje.textContent = data.error;
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      errorMensaje.textContent = "Error al conectar con el servidor";
    }
  });
  
