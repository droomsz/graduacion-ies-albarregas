// Tu enlace oficial de la base de datos
const API_URL = 'https://script.google.com/macros/s/AKfycbyrDRD553jRvrBqagafMSnjhUOXYzi5Pvg0qIGfjf-_NmxtPUcVzSOuGrqiimPt-xSz/exec';

// ==========================================
// 1. BUSCADOR PÚBLICO (ALUMNOS E INVITADOS)
// ==========================================
async function buscarAlumno() {
    const inputOriginal = document.getElementById('nombreAlumno').value.trim();
    const inputBuscar = inputOriginal.toLowerCase();
    const resultadoDiv = document.getElementById('resultado');

    if (inputBuscar === '') {
        resultadoDiv.innerHTML = '<p style="color: #f44336;">Por favor, introduce un nombre o apellido.</p>';
        return;
    }

    resultadoDiv.innerHTML = '<p style="color: #a0a0a0;">Buscando en la lista de graduación...</p>';

    try {
        const respuesta = await fetch(API_URL);
        const datos = await respuesta.json();

        let encontrado = false;
        let htmlResultado = '';

        for (const fila of datos) {
            const nombreAlumno = fila["NOMBRE"] ? fila["NOMBRE"].toString() : "";
            const inv1 = fila["INVITADO 1"] ? fila["INVITADO 1"].toString() : "";
            const inv2 = fila["INVITADO 2"] ? fila["INVITADO 2"].toString() : "";
            const inv3 = fila["INVITADO 3"] ? fila["INVITADO 3"].toString() : "";

            if (nombreAlumno.toLowerCase().includes(inputBuscar) && nombreAlumno.trim() !== "") {
                encontrado = true;
                const pagadoAlumno = fila["PAGADO ALUMNO"] === true ? '<span class="estado-pagado">✅ Pagada</span>' : '<span class="estado-pendiente">❌ Pendiente</span>';
                const formatearInvitado = (nombreInv, estadoPago) => {
                    if (!nombreInv || nombreInv.trim() === '') return ''; 
                    const estado = estadoPago === true ? '<span class="estado-pagado">✅ Pagado</span>' : '<span class="estado-pendiente">❌ Pendiente</span>';
                    return `<li style="margin-bottom: 5px;"><strong>${nombreInv}:</strong> ${estado}</li>`;
                };

                const htmlInv1 = formatearInvitado(inv1, fila["PAGADO INV 1"]);
                const htmlInv2 = formatearInvitado(inv2, fila["PAGADO INV 2"]);
                const htmlInv3 = formatearInvitado(inv3, fila["PAGADO INV 3"]);

                let htmlInvitados = '';
                if (htmlInv1 || htmlInv2 || htmlInv3) {
                    htmlInvitados = `<div style="margin-top: 15px; background: #333; padding: 10px; border-radius: 8px;"><p style="margin-bottom: 10px; color: #d4af37;"><strong>Tus Invitados Confirmados:</strong></p><ul style="list-style-type: none;">${htmlInv1}${htmlInv2}${htmlInv3}</ul></div>`;
                }

                htmlResultado = `<div class="card"><h3>🎓 ${nombreAlumno} - ${fila["CURSO"] || ""}</h3><p style="font-size: 1.1rem; margin-top: 10px;"><strong>Tu entrada:</strong> ${pagadoAlumno}</p>${htmlInvitados}</div>`;
                break;
            }

            const generarTarjetaInvitado = (nombreInvitado, pagoInvitado, otrosInvitadosArray) => {
                const estadoPago = pagoInvitado === true ? '<span class="estado-pagado">✅ Pagada</span>' : '<span class="estado-pendiente">❌ Pendiente</span>';
                const otrosReales = otrosInvitadosArray.filter(inv => inv && inv.trim() !== '');
                let otrosHtml = '';
                if (otrosReales.length > 0) {
                    const listaOtros = otrosReales.map(inv => `<li style="margin-bottom: 5px; color: #ccc;">• ${inv}</li>`).join('');
                    otrosHtml = `<div style="margin-top: 15px; background: #333; padding: 10px; border-radius: 8px;"><p style="margin-bottom: 5px; color: #d4af37;"><strong>Sus otros invitados son:</strong></p><ul style="list-style-type: none;">${listaOtros}</ul></div>`;
                }
                return `<div class="card" style="border-left: 5px solid #4caf50;"><h3>🎟️ Estás Invitado: <span style="color: white;">${nombreInvitado}</span></h3><p style="font-size: 1.1rem; margin-top: 10px;"><strong>Tu invitación está:</strong> ${estadoPago}</p><p style="font-size: 1.05rem; margin-top: 10px;"><strong>Te ha invitado:</strong> <span style="color: #d4af37;">${nombreAlumno}</span></p>${otrosHtml}</div>`;
            };

            if (inv1.toLowerCase().includes(inputBuscar) && inv1.trim() !== "") { encontrado = true; htmlResultado = generarTarjetaInvitado(inv1, fila["PAGADO INV 1"], [inv2, inv3]); break; } 
            else if (inv2.toLowerCase().includes(inputBuscar) && inv2.trim() !== "") { encontrado = true; htmlResultado = generarTarjetaInvitado(inv2, fila["PAGADO INV 2"], [inv1, inv3]); break; } 
            else if (inv3.toLowerCase().includes(inputBuscar) && inv3.trim() !== "") { encontrado = true; htmlResultado = generarTarjetaInvitado(inv3, fila["PAGADO INV 3"], [inv1, inv2]); break; }
        }

        if (encontrado) resultadoDiv.innerHTML = htmlResultado;
        else resultadoDiv.innerHTML = '<p style="color: #f44336;">No hemos encontrado a nadie con ese nombre exacto en la lista. Revisa si está bien escrito.</p>';
    } catch (error) {
        resultadoDiv.innerHTML = '<p style="color: #f44336;">Hubo un error de conexión al leer la base de datos.</p>';
    }
}

// ==========================================
// 2. SISTEMA DE WHATSAPP EN 2 PASOS
// ==========================================

// Variable para guardar el nombre real del Excel una vez verificado
let nombreVerificadoParaWhatsApp = "";

// PASO 1: Verificar si la persona existe en el Excel
async function verificarNombreWhatsApp() {
    const inputOriginal = document.getElementById('wsNombreVerificar').value.trim();
    const inputBuscar = inputOriginal.toLowerCase();
    const msgPaso1 = document.getElementById('wsMsgPaso1');
    const btnVerificar = document.getElementById('btnVerificarWs');

    if (inputBuscar === '') {
        msgPaso1.style.display = 'block';
        msgPaso1.style.color = '#f44336';
        msgPaso1.innerText = 'Por favor, escribe tu nombre para buscarte.';
        return;
    }

    msgPaso1.style.display = 'block';
    msgPaso1.style.color = '#a0a0a0';
    msgPaso1.innerText = 'Verificando en la lista oficial...';
    btnVerificar.disabled = true;

    try {
        const respuesta = await fetch(API_URL);
        const datos = await respuesta.json();
        let nombreOficialEncontrado = null;

        // Buscamos si es alumno o si es invitado
        for (const fila of datos) {
            const nombreAlumno = fila["NOMBRE"] ? fila["NOMBRE"].toString() : "";
            const inv1 = fila["INVITADO 1"] ? fila["INVITADO 1"].toString() : "";
            const inv2 = fila["INVITADO 2"] ? fila["INVITADO 2"].toString() : "";
            const inv3 = fila["INVITADO 3"] ? fila["INVITADO 3"].toString() : "";

            if (nombreAlumno.toLowerCase().includes(inputBuscar) && nombreAlumno.trim() !== "") {
                nombreOficialEncontrado = nombreAlumno; break;
            } else if (inv1.toLowerCase().includes(inputBuscar) && inv1.trim() !== "") {
                nombreOficialEncontrado = inv1; break;
            } else if (inv2.toLowerCase().includes(inputBuscar) && inv2.trim() !== "") {
                nombreOficialEncontrado = inv2; break;
            } else if (inv3.toLowerCase().includes(inputBuscar) && inv3.trim() !== "") {
                nombreOficialEncontrado = inv3; break;
            }
        }

        if (nombreOficialEncontrado) {
            // ÉXITO: Está en la lista. Guardamos su nombre oficial y mostramos el Paso 2
            nombreVerificadoParaWhatsApp = nombreOficialEncontrado;
            document.getElementById('wsPaso1').style.display = 'none';
            document.getElementById('wsPaso2').style.display = 'flex';
            document.getElementById('wsNombreConfirmado').innerText = `✅ Hola, ${nombreOficialEncontrado}`;
        } else {
            // ERROR: No está en la lista
            msgPaso1.style.color = '#f44336';
            msgPaso1.innerText = 'No estás en la lista. Prueba a buscar solo tu nombre y tu primer apellido.';
            btnVerificar.disabled = false;
        }

    } catch (error) {
        msgPaso1.style.color = '#f44336';
        msgPaso1.innerText = 'Error de conexión. Inténtalo de nuevo.';
        btnVerificar.disabled = false;
    }
}

// PASO 2: Enviar el teléfono junto con el nombre verificado
async function enviarWhatsAppPublico() {
    const inputTelefono = document.getElementById('wsTelefonoPúblico');
    const mensajeStatus = document.getElementById('wsStatusMsgPúblico');
    const btnEnviar = document.getElementById('btnEnviarWs');
    
    const telefono = inputTelefono.value.trim();

    if (telefono === '') {
        mensajeStatus.style.display = 'block';
        mensajeStatus.style.color = '#f44336';
        mensajeStatus.innerText = 'Por favor, rellena tu teléfono.';
        return;
    }

    mensajeStatus.style.display = 'block';
    mensajeStatus.style.color = '#a0a0a0';
    mensajeStatus.innerText = 'Guardando número en la base de datos...';
    btnEnviar.disabled = true;

    // Enviamos el nombre que verificamos en el Paso 1 (así no pueden hacer trampas cambiándolo)
    const datosPOST = {
        action: "request_whatsapp",
        nombre: nombreVerificadoParaWhatsApp,
        telefono: telefono
    };

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(datosPOST)
        });
        const resultado = await respuesta.json();

        if (resultado.status === 'success') {
            mensajeStatus.style.color = '#25D366';
            mensajeStatus.innerText = '¡Solicitud enviada con éxito! Serás añadido pronto al grupo.';
            inputTelefono.disabled = true; // Bloqueamos la casilla para evitar envíos dobles
        } else {
            mensajeStatus.style.color = '#f44336';
            mensajeStatus.innerText = 'Hubo un error al guardar tu número en el Excel.';
            btnEnviar.disabled = false;
        }
    } catch (error) {
        mensajeStatus.style.color = '#f44336';
        mensajeStatus.innerText = 'Error de conexión. Inténtalo más tarde.';
        btnEnviar.disabled = false;
    }
}
// LÓGICA DE LA CUENTA ATRÁS (Hacia el 15 de Mayo de 2026)
function actualizarCuentaAtras() {
    const fechaGraduacion = new Date('May 15, 2026 20:00:00').getTime();
    const ahora = new Date().getTime();
    const diferencia = fechaGraduacion - ahora;

    if (diferencia <= 0) {
        document.getElementById('countdown').innerHTML = "¡ES EL DÍA DE LA GRADUACIÓN! 🎉";
        return;
    }

    const d = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const h = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diferencia % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = d < 10 ? '0' + d : d;
    document.getElementById('hours').innerText = h < 10 ? '0' + h : h;
    document.getElementById('minutes').innerText = m < 10 ? '0' + m : m;
    document.getElementById('seconds').innerText = s < 10 ? '0' + s : s;
}

// Actualizar cada segundo
setInterval(actualizarCuentaAtras, 1000);
actualizarCuentaAtras(); // Carga inicial