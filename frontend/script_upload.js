console.log("Script cargado correctamente"); // Depuración

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

// Selección de elementos
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const folio = document.getElementById("folio");
const asunto = document.getElementById("asunto");
const destinatario = document.getElementById("destinatario");
const remitente = document.getElementById("remitente");
const estado = document.getElementById("estado");

// Crear un tooltip manual
const tooltip = document.createElement("div");
tooltip.style.position = "absolute";
tooltip.style.backgroundColor = "black";
tooltip.style.color = "white";
tooltip.style.padding = "5px 10px";
tooltip.style.borderRadius = "5px";
tooltip.style.fontSize = "12px";
tooltip.style.display = "none";
tooltip.style.zIndex = 99999;
tooltip.textContent = "Debes llenar todos los campos antes de enviar";
document.body.appendChild(tooltip);

// Función para validar formulario
function validarFormulario() {
  if (
    fileInput.files.length > 0 &&
    folio.value.trim() !== "" &&
    asunto.value.trim() !== "" &&
    destinatario.value.trim() !== "" &&
    remitente.value.trim() !== "" &&
    estado.value.trim() !== ""
  ) {
    uploadButton.disabled = false;
    uploadButton.style.backgroundColor = "green"; // Cambia a verde cuando está habilitado
    uploadButton.style.cursor = "pointer";
    tooltip.style.display = "none"; // Ocultar tooltip si ya no está deshabilitado
  } else {
    uploadButton.disabled = true;
    uploadButton.style.backgroundColor = "gray"; // Cambia a gris cuando está deshabilitado
    uploadButton.style.cursor = "not-allowed";
  }
}

// Mostrar tooltip cuando el mouse pasa sobre el botón deshabilitado
uploadButton.addEventListener("mouseenter", (event) => {
  if (uploadButton.disabled) {
    tooltip.style.display = "block";
    tooltip.style.top = event.clientY + 10 + "px";
    tooltip.style.left = event.clientX + 10 + "px";
  }
});

// Ocultar tooltip cuando el mouse sale del botón
uploadButton.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

// Agregar eventos de escucha para validar en tiempo real
fileInput.addEventListener("change", validarFormulario);
folio.addEventListener("input", validarFormulario);
asunto.addEventListener("input", validarFormulario);
destinatario.addEventListener("input", validarFormulario);
remitente.addEventListener("input", validarFormulario);
estado.addEventListener("input", validarFormulario);

// Ejecutar la validación al cargar la página
validarFormulario();

// 🔹 Guardar oficio en Firestore
document.getElementById("uploadButton").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const folio = document.getElementById("folio").value;
  const asunto = document.getElementById("asunto").value;
  const destinatario = document.getElementById("destinatario").value;
  const remitente = document.getElementById("remitente").value;
  const estado = document.getElementById("estado").value;

  if (fileInput.files.length === 0) {
    status.textContent = "Por favor, selecciona un archivo.";
    return;
  }

  window.location.hash = "#close"; // Cierra el modal cambiando el hash
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file); // Archivo
  formData.append("folio", folio); // Folio
  formData.append("asunto", asunto); // Asunto
  formData.append("destinatario", destinatario); // Destinatario
  formData.append("remitente", remitente); // Remitente
  formData.append("estado", estado); // Estado

  status.textContent = "Subiendo archivo...";

  try {
    console.log("Enviando solicitud al backend..."); // Depuración
    const response = await fetch("https://oficios-imssb.onrender.com/upload", {
      method: "POST",
      body: formData,
    });

    console.log("Respuesta recibida:", response); // Depuración

    if (!response.ok) {
      throw new Error(`Error al subir el archivo: ${response.statusText}`);
    }

    const data = await response.json();
    status.textContent = "Archivo subido correctamente";
  } catch (error) {
    console.error(error);
    status.textContent = "Error al subir el archivo.";
  }
});

// https://www.linkedin.com/in/atakangk/
//jQuery time
var current_fs, next_fs, previous_fs; //fieldsets
var left, opacity, scale; //fieldset properties which we will animate
var animating; //flag to prevent quick multi-click glitches

$(".next").click(function () {
  if (animating) return false;
  animating = true;

  current_fs = $(this).parent();
  next_fs = $(this).parent().next();

  //activate next step on progressbar using the index of next_fs
  $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

  //show the next fieldset
  next_fs.show();
  //hide the current fieldset with style
  current_fs.animate(
    { opacity: 0 },
    {
      step: function (now, mx) {
        //as the opacity of current_fs reduces to 0 - stored in "now"
        //1. scale current_fs down to 80%
        scale = 1 - (1 - now) * 0.2;
        //2. bring next_fs from the right(50%)
        left = now * 50 + "%";
        //3. increase opacity of next_fs to 1 as it moves in
        opacity = 1 - now;
        current_fs.css({
          transform: "scale(" + scale + ")",
          position: "absolute",
        });
        next_fs.css({ left: left, opacity: opacity });
      },
      duration: 800,
      complete: function () {
        current_fs.hide();
        animating = false;
      },
      //this comes from the custom easing plugin
      easing: "easeInOutBack",
    }
  );
});

$(".previous").click(function () {
  if (animating) return false;
  animating = true;

  current_fs = $(this).parent();
  previous_fs = $(this).parent().prev();

  //de-activate current step on progressbar
  $("#progressbar li")
    .eq($("fieldset").index(current_fs))
    .removeClass("active");

  //show the previous fieldset
  previous_fs.show();
  //hide the current fieldset with style
  current_fs.animate(
    { opacity: 0 },
    {
      step: function (now, mx) {
        //as the opacity of current_fs reduces to 0 - stored in "now"
        //1. scale previous_fs from 80% to 100%
        scale = 0.8 + (1 - now) * 0.2;
        //2. take current_fs to the right(50%) - from 0%
        left = (1 - now) * 50 + "%";
        //3. increase opacity of previous_fs to 1 as it moves in
        opacity = 1 - now;
        current_fs.css({ left: left });
        previous_fs.css({
          transform: "scale(" + scale + ")",
          opacity: opacity,
        });
      },
      duration: 800,
      complete: function () {
        current_fs.hide();
        animating = false;
      },
      //this comes from the custom easing plugin
      easing: "easeInOutBack",
    }
  );
});

document.addEventListener("DOMContentLoaded", () => {
  fetchOficios(); // Cargar los oficios inicialmente
  document.getElementById("searchBtn").addEventListener("click", searchFolio); // Evento de búsqueda
  document.getElementById("closeModal").addEventListener("click", closeModal); // Cerrar el modal
});

// Buscar oficio por folio
async function searchFolio() {
  const folio = document.getElementById("folioSearch").value.trim();

  if (!folio) {
    alert("Por favor ingresa un folio.");
    return;
  }

  try {
    const response = await fetch(
      `https://oficios-imssb.onrender.com/oficios/search?folio=${folio}`
    );

    // Verifica si la respuesta es exitosa
    if (!response.ok) {
      throw new Error("Error en la búsqueda de oficio");
    }

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    if (data.oficios.length > 0) {
      displayModal(data.oficios);
    } else {
      showMessage("No se encontraron oficios con ese folio.");
    }
  } catch (error) {
    showMessage("No se encontraron oficios con ese folio.");
  }
}

// Función para mostrar mensajes en la interfaz
function showMessage(message) {
  const messageElement = document.createElement("divalert");
  messageElement.classList.add("alert");
  messageElement.textContent = message;

  document.body.appendChild(messageElement);

  // Elimina el mensaje después de 5 segundos
  setTimeout(() => {
    messageElement.remove();
  }, 2000);
}

// Mostrar el modal con los resultados
function displayModal(oficios) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = ""; // Limpiar contenido previo

  oficios.forEach((oficio) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${oficio.folio || "N/A"}</td>
      <td>${oficio.asunto || "N/A"}</td>
      <td>${oficio.destinatario || "N/A"}</td>
      <td>${oficio.remitente || "N/A"}</td>
      <td>${oficio.estado || "N/A"}</td>
      <td>${oficio.fecha ? new Date(oficio.fecha).toLocaleString() : "N/A"}</td>
      <td><a href="${oficio.enlace || "#"}" target="_blank">Ver</a></td>
    `;
    modalBody.appendChild(row);
  });

  modal.style.display = "block"; // Mostrar el modal
}

// Cerrar el modal
function closeModal() {
  document.getElementById("modal").style.display = "none";
}

//Modificar un registro
function abrirModalEditar(id, folio, asunto, destinatario, remitente, estado) {
  console.log("Abriendo modal para editar el oficio:", id); // Debugging

  document.getElementById("modalOverlay").style.display = "block";

  // Asegurar que los elementos existen antes de modificar
  const inputId = document.getElementById("editId"); // Cambiar a "editId"
  const inputFolio = document.getElementById("editFolio"); // Cambiar a "editFolio"
  const inputAsunto = document.getElementById("editAsunto"); // Cambiar a "editAsunto"
  const inputDestinatario = document.getElementById("editDestinatario"); // Cambiar a "editDestinatario"
  const inputRemitente = document.getElementById("editRemitente"); // Cambiar a "editRemitente"
  const inputEstado = document.getElementById("editEstado"); // Cambiar a "editEstado"

  if (
    !modalEditar ||
    !inputId ||
    !inputFolio ||
    !inputAsunto ||
    !inputDestinatario ||
    !inputRemitente ||
    !inputEstado
  ) {
    console.error("❌ Error: No se encontraron los elementos del formulario.");
    return;
  }

  // Llenar el formulario con los datos del oficio
  inputId.value = id;
  inputFolio.value = folio || "";
  inputAsunto.value = asunto || "";
  inputDestinatario.value = destinatario || "";
  inputRemitente.value = remitente || "";
  inputEstado.value = estado || "";

  // Mostrar el modal
  modalEditar.style.display = "block";
}

// Cerrar el modal
function cerrarModalEditar() {
  document.getElementById("modalEditar").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
}

async function updateOficio() {
  const inputId = document.getElementById("editId");
  const inputFolio = document.getElementById("editFolio");
  const inputAsunto = document.getElementById("editAsunto");
  const inputDestinatario = document.getElementById("editDestinatario");
  const inputRemitente = document.getElementById("editRemitente");
  const inputEstado = document.getElementById("editEstado");

   // Verifica si los elementos están siendo encontrados
   console.log(inputId, inputFolio, inputAsunto, inputDestinatario, inputRemitente, inputEstado);


   // Verifica que todos los elementos existan antes de usarlos
  if (!inputId || !inputFolio || !inputAsunto || !inputDestinatario || !inputRemitente || !inputEstado) {
    console.error("❌ Error: No se encontraron los elementos del formulario.");
    return;
  }

 // Asigna los valores del formulario
 const id = inputId.value;
 const folio = inputFolio.value;
 const asunto = inputAsunto.value;
 const destinatario = inputDestinatario.value;
 const remitente = inputRemitente.value;
 const estado = inputEstado.value;

  if (!id) {
    alert("Error: No se encontró el ID del oficio.");
    return;
  }

  try {
    const response = await fetch(`https://oficios-imssb.onrender.com/oficios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folio, asunto, destinatario, remitente, estado }),
    });

    if (response.ok) {
      alert("✅ Oficio actualizado correctamente.");
      cerrarModalEditar();
      fetchOficios(); // Recargar la tabla después de editar
    } else {
      alert("❌ Error al actualizar el oficio.");
    }
  } catch (error) {
    console.error("Error en la actualización:", error);
  }
}
