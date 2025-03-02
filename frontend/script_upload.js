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
  
  window.location.hash = "#close"; // Cierra el modal cambiando el hash
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

//jQuery time
var current_fs, next_fs, previous_fs; //fieldsets
var left, opacity, scale; //fieldset properties which we will animate
var animating; //flag to prevent quick multi-click glitches


$(".next").click(function(){
	if(animating) return false;
	animating = true;
	
	current_fs = $(this).parent();
	next_fs = $(this).parent().next();
	
	//activate next step on progressbar using the index of next_fs
	$("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
	
	//show the next fieldset
	next_fs.show(); 
	//hide the current fieldset with style
	current_fs.animate({opacity: 0}, {
		step: function(now, mx) {
			//as the opacity of current_fs reduces to 0 - stored in "now"
			//1. scale current_fs down to 80%
			scale = 1 - (1 - now) * 0.2;
			//2. bring next_fs from the right(50%)
			left = (now * 50)+"%";
			//3. increase opacity of next_fs to 1 as it moves in
			opacity = 1 - now;
			current_fs.css({
        'transform': 'scale('+scale+')',
        'position': 'absolute'
      });
			next_fs.css({'left': left, 'opacity': opacity});
		}, 
		duration: 800, 
		complete: function(){
			current_fs.hide();
			animating = false;
		}, 
		//this comes from the custom easing plugin
		easing: 'easeInOutBack'
	});
});

$(".previous").click(function(){
	if(animating) return false;
	animating = true;
	
	current_fs = $(this).parent();
	previous_fs = $(this).parent().prev();
	
	//de-activate current step on progressbar
	$("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
	
	//show the previous fieldset
	previous_fs.show(); 
	//hide the current fieldset with style
	current_fs.animate({opacity: 0}, {
		step: function(now, mx) {
			//as the opacity of current_fs reduces to 0 - stored in "now"
			//1. scale previous_fs from 80% to 100%
			scale = 0.8 + (1 - now) * 0.2;
			//2. take current_fs to the right(50%) - from 0%
			left = ((1-now) * 50)+"%";
			//3. increase opacity of previous_fs to 1 as it moves in
			opacity = 1 - now;
			current_fs.css({'left': left});
			previous_fs.css({'transform': 'scale('+scale+')', 'opacity': opacity});
		}, 
		duration: 800, 
		complete: function(){
			current_fs.hide();
			animating = false;
		}, 
		//this comes from the custom easing plugin
		easing: 'easeInOutBack'
	});
});

