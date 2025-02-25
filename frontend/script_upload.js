
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
