// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================
const API_URL = 'https://script.google.com/macros/s/AKfycbyrDRD553jRvrBqagafMSnjhUOXYzi5Pvg0qIGfjf-_NmxtPUcVzSOuGrqiimPt-xSz/exec';
let nombreVerificadoParaWhatsApp = "";

// ==========================================
// NUEVA FUNCIÓN: DETECTOR DE PAGOS BLINDADO
// ==========================================
function esPagado(valor) {
    if (valor === true) return true;
    if (typeof valor === 'string') {
        const v = valor.trim().toUpperCase();
        return v === 'TRUE' || v === 'VERDADERO' || v === 'V' || v === 'SÍ' || v === 'SI';
    }
    return false;
}

// ==========================================
// 1. RASTREADOR DE VISITAS
// ==========================================
async function registrarVisita() {
    let userIP = "Desconocida / Oculta";
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIP = ipData.ip;
    } catch (error) {
        console.warn("IP bloqueada por privacidad.");
    }

    try {
        const datosVisita = { action: "log_visit", ip: userIP, device: navigator.userAgent };
        fetch(API_URL, { method: 'POST', body: JSON.stringify(datosVisita) });
    } catch (error) { console.warn("No se pudo conectar con el Excel."); }
}

// ==========================================
// 2. BUSCADOR DE ALUMNOS Y PAGOS
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
        const fetchUrl = API_URL + "?nocache=" + new Date().getTime();
        const respuesta = await fetch(fetchUrl);
        const datos = await respuesta.json();

        let userIP = "Desconocida";
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            userIP = ipData.ip;
        } catch (e) {}
        
        const userDevice = navigator.userAgent;
        let estadoBusqueda = "No encontrado";
        let encontrado = false;
        let htmlResultado = '';

        for (const fila of datos) {
            const nombreAlumno = fila["NOMBRE"] ? fila["NOMBRE"].toString() : "";
            const inv1 = fila["INVITADO 1"] ? fila["INVITADO 1"].toString() : "";
            const inv2 = fila["INVITADO 2"] ? fila["INVITADO 2"].toString() : "";
            const inv3 = fila["INVITADO 3"] ? fila["INVITADO 3"].toString() : "";

            if (nombreAlumno.toLowerCase().includes(inputBuscar) && nombreAlumno.trim() !== "") {
                encontrado = true;
                estadoBusqueda = "Encontrado (Alumno)";
                const haPagado = esPagado(fila["PAGADO ALUMNO"]);
                const pagadoTexto = haPagado ? '✅ Pagada' : '❌ Pendiente';
                
                htmlResultado = `
                    <div class="card">
                        <h3>🎓 ${nombreAlumno}</h3>
                        <p style="margin-top:10px;"><strong>Tu entrada:</strong> <span class="${haPagado ? 'estado-pagado' : 'estado-pendiente'}">${pagadoTexto}</span></p>
                    </div>`;
                break;
            }

            const checkInv = (nombre, pago, otros) => {
                if (nombre.toLowerCase().includes(inputBuscar) && nombre.trim() !== "") {
                    encontrado = true;
                    estadoBusqueda = `Encontrado (Invitado de ${nombreAlumno})`;
                    const haPagadoInv = esPagado(pago);
                    const pagadoTexto = haPagadoInv ? '✅ Pagada' : '❌ Pendiente';
                    
                    htmlResultado = `
                        <div class="card" style="border-left: 5px solid #25D366;">
                            <h3>🎟️ Invitado: ${nombre}</h3>
                            <p>Te invita: <span style="color:#d4af37;">${nombreAlumno}</span></p>
                            <p style="margin-top:10px;"><strong>Invitación:</strong> <span class="${haPagadoInv ? 'estado-pagado' : 'estado-pendiente'}">${pagadoTexto}</span></p>
                        </div>`;
                    return true;
                }
                return false;
            };

            if (checkInv(inv1, fila["PAGADO INV 1"], [inv2, inv3])) break;
            if (checkInv(inv2, fila["PAGADO INV 2"], [inv1, inv3])) break;
            if (checkInv(inv3, fila["PAGADO INV 3"], [inv1, inv2])) break;
        }

        fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "log_search", nombreBuscado: inputOriginal, ip: userIP, device: userDevice, resultado: estadoBusqueda })
        });

        if (encontrado) resultadoDiv.innerHTML = htmlResultado;
        else resultadoDiv.innerHTML = '<p style="color: #f44336;">No encontrado. Revisa tu nombre.</p>';

    } catch (error) {
        resultadoDiv.innerHTML = '<p style="color: #f44336;">Error de conexión.</p>';
    }
}

// ==========================================
// 3. SISTEMA WHATSAPP
// ==========================================
async function verificarNombreWhatsApp() {
    const input = document.getElementById('wsNombreVerificar').value.trim();
    const msg = document.getElementById('wsMsgPaso1');
    if (!input) return;

    msg.style.display = 'block';
    msg.innerText = "Verificando en la lista...";
    
    try {
        const fetchUrl = API_URL + "?nocache=" + new Date().getTime();
        const res = await fetch(fetchUrl);
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
        let userIP = "Desconocida";
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            userIP = ipData.ip;
        } catch(e) {}
        
        const datos = { action: "request_whatsapp", nombre: nombreVerificadoParaWhatsApp, telefono: tlf, ip: userIP, device: navigator.userAgent };
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
// 4. ESTADÍSTICAS DEL PIE DE PÁGINA
// ==========================================
async function cargarContadoresTotales() {
    try {
        const fetchUrl = API_URL + "?nocache=" + new Date().getTime();
        const respuesta = await fetch(fetchUrl);
        const datos = await respuesta.json();

        let alumnosTotales = 0, alumnosPagados = 0;
        let invitadosTotales = 0, invitadosPagados = 0;

        datos.forEach(fila => {
            if (fila["NOMBRE"]?.trim()) {
                alumnosTotales++;
                if (esPagado(fila["PAGADO ALUMNO"])) alumnosPagados++;
            }
            [1, 2, 3].forEach(n => {
                const inv = fila[`INVITADO ${n}`];
                if (inv && inv.toString().trim() !== "") {
                    invitadosTotales++;
                    if (esPagado(fila[`PAGADO INV ${n}`])) invitadosPagados++;
                }
            });
        });

        document.getElementById('pagados-personas-total').innerText = alumnosPagados + invitadosPagados;
        document.getElementById('pagados-invitados-total').innerText = invitadosPagados;
        document.getElementById('general-personas-total').innerText = alumnosTotales + invitadosTotales;
        document.getElementById('general-invitados-total').innerText = invitadosTotales;

    } catch (e) { console.error("Error cargando estadísticas"); }
}

// ==========================================
// 5. CUENTA ATRÁS (15 MAYO 2026)
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
// 6. RASTREO DE DESCARGAS DE PDF
// ==========================================
async function registrarDescarga() {
    try {
        let userIP = "Desconocida / Oculta";
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            userIP = ipData.ip;
        } catch (error) { console.warn("IP bloqueada"); }

        const datosDescarga = { action: "log_download", archivo: "Autorizacion_Menores_Malamadre", ip: userIP, device: navigator.userAgent };
        fetch(API_URL, { method: 'POST', body: JSON.stringify(datosDescarga) });
    } catch (error) { console.warn("Error en registro de descarga."); }
}

window.addEventListener('DOMContentLoaded', () => {
    registrarVisita();           
    cargarContadoresTotales();    
    setInterval(actualizarCuentaAtras, 1000); 
    actualizarCuentaAtras();
});