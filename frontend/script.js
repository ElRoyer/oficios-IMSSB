document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const contrasenia = document.getElementById("contrasenia").value;
    const errorMensaje = document.getElementById("errorMensaje");
    const successMensaje = document.getElementById("successMensaje");

    try {
      const response = await fetch("https://oficios-imssb.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasenia }),
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      
      if (response.ok) {
        
        errorMensaje.style.display = "none";
        localStorage.setItem("authUser", JSON.stringify(data.user)); // Guardar datos del usuario
        successMensaje.style.display = "block";
        successMensaje.textContent = "Inicio de sesion exitoso"

        // Redirigir después de 3 segundos
        setTimeout(() => {
          window.location.href = "main.html"; // Redirigir si el login es exitoso
        }, 1000);
        //accesoMensaje.textContent = data.success;
      } else {
        errorMensaje.textContent = data.error;
        errorMensaje.style.display = "block";
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      errorMensaje.textContent = "Error al conectar con el servidor";
      errorMensaje.style.display = "block";

      setTimeout(() => {
        errorMensaje.style.display = "none";
      }, 3000);
    }
  });

 
document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    const passwordInput = document.getElementById("contrasenia");
    const icon = this;

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

