// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================
// Tu enlace oficial de la base de datos (Google Apps Script)
const API_URL = 'https://script.google.com/macros/s/AKfycbyrDRD553jRvrBqagafMSnjhUOXYzi5Pvg0qIGfjf-_NmxtPUcVzSOuGrqiimPt-xSz/exec';

// Variable global para el proceso de WhatsApp
let nombreVerificadoParaWhatsApp = "";

// ==========================================
// 1. RASTREADOR DE VISITAS (TRÁFICO AUTOMÁTICO)
// ==========================================
async function registrarVisita() {
    try {
        // Obtenemos la IP de forma silenciosa al cargar la página
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        
        const datosVisita = {
            action: "log_visit",
            ip: ipData.ip,
            device: navigator.userAgent
        };

        // Enviamos al Excel sin interrumpir al usuario
        fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(datosVisita)
        });

    } catch (error) {
        console.warn("No se pudo registrar la visita automática.");
    }
}

// ==========================================
// 2. BUSCADOR DE PAGOS Y LOGS DE BÚSQUEDA
// ==========================================
async function buscarAlumno() {
    const inputOriginal = document.getElementById('nombreAlumno').value.trim();
    const inputBuscar = inputOriginal.toLowerCase();
    const resultadoDiv = document.getElementById('resultado');

    if (inputBuscar === '') {
        resultadoDiv.innerHTML = '<p style="color: #f44336;">Por favor, introduce un nombre o apellido.</p>';
        return;
    }

    resultadoDiv.innerHTML = '<p style="color: #a0a0a0;">Buscando en la lista oficial...</p>';

    try {
        const respuesta = await fetch(API_URL);
        const datos = await respuesta.json();

        // Obtener IP para el log de búsqueda
        let userIP = "Desconocida";
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            userIP = ipData.ip;
        } catch (e) { console.warn("Error obteniendo IP para búsqueda"); }
        
        const userDevice = navigator.userAgent;
        let estadoBusqueda = "No encontrado";
        let encontrado = false;
        let htmlResultado = '';

        for (const fila of datos) {
            const nombreAlumno = fila["NOMBRE"] ? fila["NOMBRE"].toString() : "";
            const inv1 = fila["INVITADO 1"] ? fila["INVITADO 1"].toString() : "";
            const inv2 = fila["INVITADO 2"] ? fila["INVITADO 2"].toString() : "";
            const inv3 = fila["INVITADO 3"] ? fila["INVITADO 3"].toString() : "";

            // Lógica para Alumnos
            if (nombreAlumno.toLowerCase().includes(inputBuscar) && nombreAlumno.trim() !== "") {
                encontrado = true;
                estadoBusqueda = "Encontrado (Alumno)";
                const pagadoAlumno = fila["PAGADO ALUMNO"] === true ? '✅ Pagada' : '❌ Pendiente';
                
                htmlResultado = `
                    <div class="card">
                        <h3>🎓 ${nombreAlumno}</h3>
                        <p style="margin-top:10px;"><strong>Tu entrada:</strong> <span class="${fila["PAGADO ALUMNO"] === true ? 'estado-pagado' : 'estado-pendiente'}">${pagadoAlumno}</span></p>
                    </div>`;
                break;
            }

            // Lógica para Invitados
            const checkInv = (nombre, pago, otros) => {
                if (nombre.toLowerCase().includes(inputBuscar) && nombre.trim() !== "") {
                    encontrado = true;
                    estadoBusqueda = `Encontrado (Invitado de ${nombreAlumno})`;
                    const pagado = pago === true ? '✅ Pagada' : '❌ Pendiente';
                    htmlResultado = `
                        <div class="card" style="border-left: 5px solid #25D366;">
                            <h3>🎟️ Invitado: ${nombre}</h3>
                            <p>Te invita: <span style="color:#d4af37;">${nombreAlumno}</span></p>
                            <p style="margin-top:10px;"><strong>Invitación:</strong> <span class="${pago === true ? 'estado-pagado' : 'estado-pendiente'}">${pagado}</span></p>
                        </div>`;
                    return true;
                }
                return false;
            };

            if (checkInv(inv1, fila["PAGADO INV 1"], [inv2, inv3])) break;
            if (checkInv(inv2, fila["PAGADO INV 2"], [inv1, inv3])) break;
            if (checkInv(inv3, fila["PAGADO INV 3"], [inv1, inv2])) break;
        }

        // Enviar el LOG de búsqueda al Excel
        fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: "log_search",
                nombreBuscado: inputOriginal,
                ip: userIP,
                device: userDevice,
                resultado: estadoBusqueda
            })
        });

        if (encontrado) resultadoDiv.innerHTML = htmlResultado;
        else resultadoDiv.innerHTML = '<p style="color: #f44336;">No encontrado. Prueba con nombre y primer apellido.</p>';

    } catch (error) {
        resultadoDiv.innerHTML = '<p style="color: #f44336;">Error de conexión.</p>';
    }
}

// ==========================================
// 3. REGISTRO WHATSAPP (CON FILTRO E IP)
// ==========================================
async function verificarNombreWhatsApp() {
    const input = document.getElementById('wsNombreVerificar').value.trim();
    const msg = document.getElementById('wsMsgPaso1');
    if (!input) return;

    msg.style.display = 'block';
    msg.innerText = "Verificando en la lista...";
    
    try {
        const res = await fetch(API_URL);
        const datos = await res.json();
        let oficial = null;

        for (const f of datos) {
            if (f["NOMBRE"]?.toLowerCase().includes(input.toLowerCase())) { oficial = f["NOMBRE"]; break; }
            if (f["INVITADO 1"]?.toLowerCase().includes(input.toLowerCase())) { oficial = f["INVITADO 1"]; break; }
            if (f["INVITADO 2"]?.toLowerCase().includes(input.toLowerCase())) { oficial = f["INVITADO 2"]; break; }
            if (f["INVITADO 3"]?.toLowerCase().includes(input.toLowerCase())) { oficial = f["INVITADO 3"]; break; }
        }

        if (oficial) {
            nombreVerificadoParaWhatsApp = oficial;
            document.getElementById('wsPaso1').style.display = 'none';
            document.getElementById('wsPaso2').style.display = 'flex';
            document.getElementById('wsNombreConfirmado').innerText = `✅ Identidad: ${oficial}`;
        } else {
            msg.style.color = "#f44336";
            msg.innerText = "No apareces en la lista de invitados.";
        }
    } catch (e) { msg.innerText = "Error al verificar."; }
}

async function enviarWhatsAppPublico() {
    const tlf = document.getElementById('wsTelefonoPúblico').value.trim();
    const status = document.getElementById('wsStatusMsgPúblico');
    if (!tlf) return;

    status.style.display = "block";
    status.innerText = "Registrando tu número...";

    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        
        const datos = {
            action: "request_whatsapp",
            nombre: nombreVerificadoParaWhatsApp,
            telefono: tlf,
            ip: ipData.ip,
            device: navigator.userAgent
        };

        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(datos) });
        const resJson = await res.json();

        if (resJson.status === 'success') {
            status.style.color = "#25D366";
            status.innerText = "¡Listo! Te añadiremos pronto al grupo.";
            document.getElementById('btnEnviarWs').disabled = true;
        }
    } catch (e) { status.innerText = "Error al guardar el número."; }
}

// ==========================================
// 4. ESTADÍSTICAS DIVIDIDAS (CONTADORES)
// ==========================================
async function cargarContadoresTotales() {
    try {
        const respuesta = await fetch(API_URL);
        const datos = await respuesta.json();

        let alumnosTotales = 0, alumnosPagados = 0;
        let invitadosTotales = 0, invitadosPagados = 0;

        datos.forEach(fila => {
            if (fila["NOMBRE"]?.trim()) {
                alumnosTotales++;
                if (fila["PAGADO ALUMNO"] === true) alumnosPagados++;
            }
            [1, 2, 3].forEach(n => {
                const inv = fila[`INVITADO ${n}`];
                if (inv && inv.toString().trim() !== "") {
                    invitadosTotales++;
                    if (fila[`PAGADO INV ${n}`] === true) invitadosPagados++;
                }
            });
        });

        // Bloque Pagados (Confirmados)
        document.getElementById('pagados-personas-total').innerText = alumnosPagados + invitadosPagados;
        document.getElementById('pagados-invitados-total').innerText = invitadosPagados;

        // Bloque General (Lista completa)
        document.getElementById('general-personas-total').innerText = alumnosTotales + invitadosTotales;
        document.getElementById('general-invitados-total').innerText = invitadosTotales;

    } catch (e) { console.error("Error cargando estadísticas"); }
}

// ==========================================
// 5. CUENTA ATRÁS PARA EL 15 DE MAYO 2026
// ==========================================
function actualizarCuentaAtras() {
    const fechaEvento = new Date('May 15, 2026 23:45:00').getTime();
    const ahora = new Date().getTime();
    const diff = fechaEvento - ahora;

    if (diff <= 0) {
        document.getElementById('countdown').innerHTML = "¡LA GRADUACIÓN HA COMENZADO! 🎉";
        return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = d.toString().padStart(2, '0');
    document.getElementById('hours').innerText = h.toString().padStart(2, '0');
    document.getElementById('minutes').innerText = m.toString().padStart(2, '0');
    document.getElementById('seconds').innerText = s.toString().padStart(2, '0');
}

// ==========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    registrarVisita();           // Registra la entrada (IP/Device)
    cargarContadoresTotales();    // Calcula estadísticas del Excel
    setInterval(actualizarCuentaAtras, 1000); // Inicia el reloj
    actualizarCuentaAtras();
});