// ====================================================
// CONFIGURACIÓN DEL PANEL
// ====================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbyrDRD553jRvrBqagafMSnjhUOXYzi5Pvg0qIGfjf-_NmxtPUcVzSOuGrqiimPt-xSz/exec';
const ADMIN_TOKEN_KEY = "ADMIN_ALBARREGAS_2026@"; 

// Columnas de pagos
const COLUMNA_PAGADO_ALUMNO = "PAGADO ALUMNO";
const COLUMNA_PAGADO_INV1 = "PAGADO INV 1";
const COLUMNA_PAGADO_INV2 = "PAGADO INV 2";
const COLUMNA_PAGADO_INV3 = "PAGADO INV 3";

// Columnas de nombres de invitados
const COL_NOMBRE_INV1 = "INVITADO 1";
const COL_NOMBRE_INV2 = "INVITADO 2";
const COL_NOMBRE_INV3 = "INVITADO 3";

// ====================================================
// 1. SISTEMA DE LOGIN
// ====================================================

function intentarLogin() {
    const passwordInput = document.getElementById('adminPassword').value;
    const loginError = document.getElementById('loginError');

    if (passwordInput === ADMIN_TOKEN_KEY) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        loginError.style.display = 'none';
        iniciarPanel();
    } else {
        loginError.style.display = 'block';
    }
}

function iniciarPanel() {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('panelBox').style.display = 'block';
    cargarTablaCompleta();
}

function cerrarSesion() {
    sessionStorage.removeItem('isAdminLoggedIn');
    location.reload();
}

// ====================================================
// 2. CARGAR LA BASE DE DATOS EN LA TABLA
// ====================================================

async function cargarTablaCompleta() {
    const container = document.getElementById('tablaContainer');
    container.innerHTML = '<p style="color: #a0a0a0; text-align: center; padding: 20px;">Descargando datos del Excel...</p>';

    try {
        const respuesta = await fetch(API_URL);
        const datos = await respuesta.json();

        let htmlTabla = `
            <table>
                <thead>
                    <tr>
                        <th>ALUMNO</th>
                        <th>CURSO</th>
                        <th style="text-align: center;">PAGADO</th>
                        <th style="text-align: center;">INVITADO 1</th>
                        <th style="text-align: center;">INVITADO 2</th>
                        <th style="text-align: center;">INVITADO 3</th>
                    </tr>
                </thead>
                <tbody>
        `;

        datos.forEach(alumno => {
            if (!alumno["NOMBRE"]) return;

            const generarToggle = (nombreAlumno, columnaKey, estadoActual) => {
                const checked = estadoActual === true ? 'checked' : '';
                return `
                    <label class="toggle-switch">
                        <input type="checkbox" ${checked} onchange="actualizarPago('${nombreAlumno}', '${columnaKey}', this)">
                        <span class="slider"></span>
                    </label>
                `;
            };

            // Función maestra para generar la celda de un invitado (con su toggle y su botón de editar)
            const generarCeldaInvitado = (nombreAlumno, colNombre, colPago, valorNombre, valorPago) => {
                const nombreLimpio = valorNombre ? valorNombre.toString().trim() : "";
                const tieneInvitado = nombreLimpio !== "";
                
                // Si tiene invitado ponemos el botón de pago, si no, lo dejamos vacío
                const htmlToggle = tieneInvitado ? generarToggle(nombreAlumno, colPago, valorPago) : "<div style='height:20px;'></div>";
                const textoMostrar = tieneInvitado ? nombreLimpio : "Añadir invitado";
                const colorTexto = tieneInvitado ? "#aaa" : "#4caf50";

                return `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        ${htmlToggle}
                        <div style="margin-top: 8px; display: flex; align-items: center; gap: 5px;">
                            <small style="color:${colorTexto}; font-size:0.75rem; max-width: 100px; text-align: center; line-height: 1.1;">${textoMostrar}</small>
                            <button onclick="editarInvitado('${nombreAlumno}', '${colNombre}', '${nombreLimpio}')" 
                                    style="background: none; border: none; cursor: pointer; font-size: 0.9rem; padding: 0;" title="Editar nombre">
                                ✏️
                            </button>
                        </div>
                    </div>
                `;
            };

            const toggleAlumno = generarToggle(alumno["NOMBRE"], COLUMNA_PAGADO_ALUMNO, alumno[COLUMNA_PAGADO_ALUMNO]);
            const celdaInv1 = generarCeldaInvitado(alumno["NOMBRE"], COL_NOMBRE_INV1, COLUMNA_PAGADO_INV1, alumno[COL_NOMBRE_INV1], alumno[COLUMNA_PAGADO_INV1]);
            const celdaInv2 = generarCeldaInvitado(alumno["NOMBRE"], COL_NOMBRE_INV2, COLUMNA_PAGADO_INV2, alumno[COL_NOMBRE_INV2], alumno[COLUMNA_PAGADO_INV2]);
            const celdaInv3 = generarCeldaInvitado(alumno["NOMBRE"], COL_NOMBRE_INV3, COLUMNA_PAGADO_INV3, alumno[COL_NOMBRE_INV3], alumno[COLUMNA_PAGADO_INV3]);

            htmlTabla += `
                <tr>
                    <td><strong>${alumno["NOMBRE"]}</strong></td>
                    <td>${alumno["CURSO"] || ""}</td>
                    <td style="text-align: center;">${toggleAlumno}</td>
                    <td style="text-align: center;">${celdaInv1}</td>
                    <td style="text-align: center;">${celdaInv2}</td>
                    <td style="text-align: center;">${celdaInv3}</td>
                </tr>
            `;
        });

        htmlTabla += '</tbody></table>';
        container.innerHTML = htmlTabla;

    } catch (error) {
        container.innerHTML = '<p style="color: #f44336; text-align: center;">Error al cargar la tabla. Verifica la conexión.</p>';
    }
}

// ====================================================
// 3. ACTUALIZAR PAGOS (Interruptores)
// ====================================================

async function actualizarPago(nombreAlumno, columnaKey, checkboxElement) {
    const nuevoValor = checkboxElement.checked;
    checkboxElement.disabled = true; 

    const datosPOST = {
        token: ADMIN_TOKEN_KEY,
        nombreAlumno: nombreAlumno,
        columnaKey: columnaKey,
        nuevoValor: nuevoValor
    };

    try {
        const respuesta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(datosPOST) });
        const resultado = await respuesta.json();
        
        if (resultado.status !== 'success') {
            alert("Error del servidor: " + resultado.message);
            checkboxElement.checked = !nuevoValor; 
        }
    } catch (error) {
        alert("Fallo de conexión. El cambio no se ha guardado.");
        checkboxElement.checked = !nuevoValor; 
    } finally {
        checkboxElement.disabled = false;
    }
}

// ====================================================
// 4. NUEVO: EDITAR NOMBRES DE INVITADOS
// ====================================================

async function editarInvitado(nombreAlumno, columnaInvitado, nombreActual) {
    // Le pedimos al administrador que escriba el nuevo nombre
    const nuevoNombre = prompt(`Introduce el nombre para el ${columnaInvitado} de ${nombreAlumno}:\n(Déjalo en blanco si quieres borrarlo)`, nombreActual);
    
    // Si cancela la ventana o pone exactamente lo mismo que había, no hacemos nada
    if (nuevoNombre === null || nuevoNombre.trim() === nombreActual.trim()) {
        return;
    }

    const datosPOST = {
        token: ADMIN_TOKEN_KEY,
        nombreAlumno: nombreAlumno,
        columnaKey: columnaInvitado,
        nuevoValor: nuevoNombre.trim()
    };

    try {
        // Ponemos el ratón en modo carga
        document.body.style.cursor = 'wait';
        
        const respuesta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(datosPOST) });
        const resultado = await respuesta.json();

        if (resultado.status === 'success') {
            // Si todo va bien, recargamos la tabla para que se genere el botón de pago de ese nuevo invitado
            cargarTablaCompleta();
        } else {
            alert("Error al guardar el nombre: " + resultado.message);
        }
    } catch (error) {
        alert("Fallo de red. No se ha podido guardar el nombre.");
    } finally {
        document.body.style.cursor = 'default';
    }
}

// ====================================================
// 5. AÑADIR ALUMNOS NUEVOS
// ====================================================

async function crearAlumno() {
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const curso = document.getElementById('nuevoCurso').value.trim();
    const inv1 = document.getElementById('nuevoInv1').value.trim();
    const btn = document.getElementById('btnAnadir');

    if (nombre === "") {
        alert("El nombre del alumno es obligatorio.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Guardando...";

    const datosPOST = {
        token: ADMIN_TOKEN_KEY,
        action: "add_student",
        nombre: nombre,
        curso: curso,
        inv1: inv1
    };

    try {
        const respuesta = await fetch(API_URL, { method: 'POST', body: JSON.stringify(datosPOST) });
        const resultado = await respuesta.json();

        if (resultado.status === 'success') {
            document.getElementById('nuevoNombre').value = '';
            document.getElementById('nuevoCurso').value = '';
            document.getElementById('nuevoInv1').value = '';
            cargarTablaCompleta();
        } else {
            alert("Error al guardar: " + resultado.message);
        }
    } catch (error) {
        alert("Error de red. No se ha podido añadir.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar";
    }
}

// AUTO-LOGIN
window.onload = function() {
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        iniciarPanel();
    }
    document.getElementById("adminPassword").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            intentarLogin();
        }
    });
}