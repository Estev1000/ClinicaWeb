// Data Storage Wrapper
const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    add: (key, item) => {
        const data = Storage.get(key);
        // Auto-increment ID
        const id = data.length > 0 ? Math.max(...data.map(i => i.id)) + 1 : 1;
        item.id = id;
        data.push(item);
        Storage.set(key, data);
        return item;
    },
    update: (key, item) => {
        const data = Storage.get(key);
        const index = data.findIndex(i => i.id == item.id);
        if (index !== -1) {
            data[index] = item;
            Storage.set(key, data);
            return true;
        }
        return false;
    },
    delete: (key, id) => {
        let data = Storage.get(key);
        data = data.filter(i => i.id != id);
        Storage.set(key, data);
    }
};

// Navigation Logic
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupModals();
    loadDashboard();
    // populate History Selects
    populateSelects();

    // Hook to clear history form ID when opening purely as 'New'
    document.querySelector('button[onclick="openModal(\'history-modal\')"]').addEventListener('click', () => {
        document.getElementById('history-form').reset();
        document.getElementById('h-id').value = '';
    });

    // Hook to clear patient form ID
    document.querySelector('button[onclick="openModal(\'patient-modal\')"]').addEventListener('click', () => {
        document.getElementById('patient-form').reset();
        document.getElementById('p-id').value = '';
    });

    // Hook to clear doctor form ID
    document.querySelector('button[onclick="openModal(\'doctor-modal\')"]').addEventListener('click', () => {
        document.getElementById('doctor-form').reset();
        document.getElementById('d-id').value = '';
    });
});

function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.view-section');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            // Update Header
            const titleMap = {
                'dashboard': 'Dashboard',
                'patients': 'Gestión de Pacientes',
                'doctors': 'Gestión de Médicos',
                'appointments': 'Turnos Programados',
                'history': 'Historial Clínico'
            };
            document.getElementById('page-title').innerText = titleMap[targetId];

            // Toggle Classes
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Refresh data when section opens
            if (targetId === 'dashboard') loadDashboard();
            if (targetId === 'patients') loadPatients();
            if (targetId === 'doctors') loadDoctors();
            if (targetId === 'appointments') { loadAppointments(); populateSelects(); }
            if (targetId === 'history') { populateSelects(); }
        });
    });
}

// Modal System
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    populateSelects(); // Ensure dropdowns are fresh
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function setupModals() {
    // Close on click outside
    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    };
}

// --- Dashboard ---
function loadDashboard() {
    const patients = Storage.get('patients');
    const doctors = Storage.get('doctors');
    const appointments = Storage.get('appointments');

    // Get Today's Appointments
    const today = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.date === today);

    document.getElementById('total-patients').innerText = patients.length;
    document.getElementById('total-doctors').innerText = doctors.length;
    document.getElementById('today-appointments').innerText = todayApps.length;
}

// --- Patients Management ---
document.getElementById('patient-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const patientData = {
        name: document.getElementById('p-name').value,
        lastname: document.getElementById('p-lastname').value,
        dob: document.getElementById('p-dob').value,
        phone: document.getElementById('p-phone').value,
        email: document.getElementById('p-email').value
    };

    if (id) {
        patientData.id = parseInt(id);
        Storage.update('patients', patientData);
        alert('Paciente actualizado correctamente');
    } else {
        Storage.add('patients', patientData);
        alert('Paciente guardado correctamente');
    }

    closeModal('patient-modal');
    e.target.reset();
    document.getElementById('p-id').value = '';
    loadPatients();
    loadDashboard();
});

window.editPatient = function (id) {
    const patients = Storage.get('patients');
    const p = patients.find(i => i.id == id);
    if (!p) return;

    document.getElementById('p-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-lastname').value = p.lastname;
    document.getElementById('p-dob').value = p.dob;
    document.getElementById('p-phone').value = p.phone;
    document.getElementById('p-email').value = p.email;

    openModal('patient-modal');
};

function loadPatients() {
    const patients = Storage.get('patients');
    const tbody = document.getElementById('patients-table-body');
    tbody.innerHTML = '';

    patients.forEach(p => {
        // Calculate Age
        const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
        const row = `
            <tr>
                <td>#${p.id}</td>
                <td>${p.name}</td>
                <td>${p.lastname}</td>
                <td>${age} años</td>
                <td>${p.phone}</td>
                <td>${p.phone}</td>
                <td>
                    <button class="btn-secondary" onclick="editPatient(${p.id})" style="padding: 5px 10px; font-size: 12px;">Editar</button>
                    <button class="btn-secondary" onclick="deletePatient(${p.id})" style="background: #e74c3c; padding: 5px 10px; font-size: 12px; margin-left: 5px;">Eliminar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

window.deletePatient = function (id) {
    if (confirm('¿Está seguro de eliminar este paciente?')) {
        Storage.delete('patients', id);
        // Also delete related history and appointments? For now, keep simple.
        loadPatients();
        loadDashboard();
    }
};

// --- Doctors Management ---
document.getElementById('doctor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('d-id').value;
    const doctorData = {
        name: document.getElementById('d-name').value,
        lastname: document.getElementById('d-lastname').value,
        specialty: document.getElementById('d-specialty').value
    };

    if (id) {
        doctorData.id = parseInt(id);
        Storage.update('doctors', doctorData);
        alert('Médico actualizado correctamente');
    } else {
        Storage.add('doctors', doctorData);
        alert('Médico guardado correctamente');
    }

    closeModal('doctor-modal');
    e.target.reset();
    document.getElementById('d-id').value = '';
    loadDoctors();
    loadDashboard();
});

window.editDoctor = function (id) {
    const doctors = Storage.get('doctors');
    const d = doctors.find(i => i.id == id);
    if (!d) return;

    document.getElementById('d-id').value = d.id;
    document.getElementById('d-name').value = d.name;
    document.getElementById('d-lastname').value = d.lastname;
    document.getElementById('d-specialty').value = d.specialty;

    openModal('doctor-modal');
};

function loadDoctors() {
    const doctors = Storage.get('doctors');
    const tbody = document.getElementById('doctors-table-body');
    tbody.innerHTML = ''; // Clear

    doctors.forEach(d => {
        const row = `
            <tr>
                <td>#${d.id}</td>
                <td>${d.name}</td>
                <td>${d.lastname}</td>
                <td><span style="background: #e0f7fa; color: #006064; padding: 4px 8px; border-radius: 4px;">${d.specialty}</span></td>
                <td><span style="background: #e0f7fa; color: #006064; padding: 4px 8px; border-radius: 4px;">${d.specialty}</span></td>
                <td>
                     <button class="btn-secondary" onclick="editDoctor(${d.id})" style="padding: 5px 10px; font-size: 12px;">Editar</button>
                     <button class="btn-secondary" onclick="deleteDoctor(${d.id})" style="background: #e74c3c; padding: 5px 10px; font-size: 12px; margin-left: 5px;">Eliminar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

window.deleteDoctor = function (id) {
    if (confirm('¿Está seguro de eliminar este médico?')) {
        Storage.delete('doctors', id);
        loadDoctors();
        loadDashboard();
    }
};

// --- Helper: Populate Selects ---
function populateSelects() {
    const patients = Storage.get('patients');
    const doctors = Storage.get('doctors');

    // Appointment Selects
    const aPatientSelect = document.getElementById('a-patient');
    const aDoctorSelect = document.getElementById('a-doctor');

    // History Selects
    const hPatientSelect = document.getElementById('h-patient');

    // Clear and Populate
    [aPatientSelect, hPatientSelect].forEach(sel => {
        if (!sel) return;
        sel.innerHTML = '<option value="">Seleccione Paciente</option>';
        patients.forEach(p => {
            sel.innerHTML += `<option value="${p.id}">${p.name} ${p.lastname} (ID: ${p.id})</option>`;
        });
    });

    if (aDoctorSelect) {
        aDoctorSelect.innerHTML = '<option value="">Seleccione Médico</option>';
        doctors.forEach(d => {
            aDoctorSelect.innerHTML += `<option value="${d.id}">${d.name} ${d.lastname} - ${d.specialty}</option>`;
        });
    }
}

// --- Appointments Management ---
document.getElementById('appointment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newAppointment = {
        patientId: document.getElementById('a-patient').value,
        doctorId: document.getElementById('a-doctor').value,
        date: document.getElementById('a-date').value,
        time: document.getElementById('a-time').value,
        status: 'Pendiente'
    };
    Storage.add('appointments', newAppointment);
    closeModal('appointment-modal');
    e.target.reset();
    loadAppointments();
    loadDashboard();
    alert('Turno agendado correctamente');
});

function loadAppointments() {
    const appointments = Storage.get('appointments');
    const patients = Storage.get('patients');
    const doctors = Storage.get('doctors');
    const tbody = document.getElementById('appointments-table-body');
    tbody.innerHTML = '';

    appointments.forEach(a => {
        const p = patients.find(pat => pat.id == a.patientId) || { name: 'Unknown', lastname: '' };
        const d = doctors.find(doc => doc.id == a.doctorId) || { name: 'Unknown', lastname: '' };

        const row = `
            <tr>
                <td>#${a.id}</td>
                <td>${a.date}</td>
                <td>${a.time}</td>
                <td>${p.name} ${p.lastname}</td>
                <td>${d.name} ${d.lastname}</td>
                <td><span style="color: green; font-weight: bold;">${a.status}</span></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// --- Medical History Management ---
// --- Medical History Management ---
document.getElementById('history-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('h-id').value;

    const historyData = {
        patientId: document.getElementById('h-patient').value,
        date: document.getElementById('h-date').value,
        diagnosis: document.getElementById('h-diagnosis').value,
        treatment: document.getElementById('h-treatment').value,
        notes: document.getElementById('h-notes').value
    };

    if (id) {
        // Update existing
        historyData.id = parseInt(id);
        Storage.update('history', historyData);
        alert('Historial actualizado correctamente');
    } else {
        // Create new
        Storage.add('history', historyData);
        alert('Historial guardado correctamente');
    }

    closeModal('history-modal');
    e.target.reset();
    document.getElementById('h-id').value = ''; // Clear ID

    // Refresh history view if active
    const searchVal = document.getElementById('history-search').value;
    if (searchVal) searchHistory();
    else searchHistory(); // Refresh anyway
});

// Expose to window for onclick access
window.editHistory = function (id) {
    const history = Storage.get('history');
    const record = history.find(h => h.id == id);
    if (!record) return;

    // Fill form
    document.getElementById('h-id').value = record.id;
    document.getElementById('h-patient').value = record.patientId;
    document.getElementById('h-date').value = record.date;
    document.getElementById('h-diagnosis').value = record.diagnosis;
    document.getElementById('h-treatment').value = record.treatment;
    document.getElementById('h-notes').value = record.notes;

    openModal('history-modal');
};

function searchHistory() {
    const query = document.getElementById('history-search').value;
    const history = Storage.get('history');
    const patients = Storage.get('patients');

    let filtered = history;
    if (query) {
        filtered = history.filter(h => h.patientId == query);
    }

    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No se encontraron registros</td></tr>';
        return;
    }

    filtered.forEach(h => {
        const p = patients.find(pat => pat.id == h.patientId) || { name: 'Unknown', lastname: '' };

        // Helper to format expandable cell
        const formatCell = (text) => {
            if (!text) return '';
            if (text.length <= 20) return text; // Lower threshold to trigger on 'klkkkk...'
            // Escape quotes for attribute
            const safeText = text.replace(/"/g, '&quot;');
            return `<span class="expandable" data-full="${safeText}" onclick="toggleExpand(this)">
                        ${text.substring(0, 20)}... <i class='bx bx-chevron-down'></i>
                    </span>`;
        };

        const row = `
            <tr>
                <td>${h.date}</td>
                <td>${p.name} ${p.lastname}</td>
                <td>${formatCell(h.diagnosis)}</td>
                <td>${formatCell(h.treatment)}</td>
                <td>${formatCell(h.notes)}</td>
                <td>
                    <button class="btn-secondary" onclick="editHistory(${h.id})" style="padding: 5px 10px; font-size: 12px;">
                        <i class='bx bxs-edit'></i> Ver/Editar
                    </button>
                    <button class="btn-secondary" onclick="deleteHistory(${h.id})" style="background: #e74c3c; padding: 5px 10px; font-size: 12px; margin-left: 5px;">
                        <i class='bx bxs-trash'></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

window.deleteHistory = function (id) {
    if (confirm('¿Está seguro de eliminar este registro histórico?')) {
        Storage.delete('history', id);
        searchHistory(); // Refresh view
    }
};

window.deleteAllHistory = function () {
    if (confirm('¿ESTÁ SEGURO? P eligro: Esto borrará TODO el historial clínico. Esta acción no se puede deshacer.')) {
        localStorage.removeItem('history');
        searchHistory();
    }
};

// Text Expansion Helper
window.toggleExpand = function (el) {
    const parent = el.parentElement; // The span is the element clicked? No, span is parent of i. 
    // Wait, onclick is on the span. So el is the span.
    const fullText = el.getAttribute('data-full');

    if (el.classList.contains('expanded-text')) {
        // Collapse
        el.classList.remove('expanded-text');
        el.innerHTML = `${fullText.substring(0, 20)}... <i class='bx bx-chevron-down'></i>`;
    } else {
        // Expand
        el.classList.add('expanded-text');
        el.innerHTML = `${fullText} <i class='bx bx-chevron-up'></i>`;
    }
};

// =====================================================
// SISTEMA PREMIUM - MERCADO PAGO INTEGRATION
// =====================================================

// Función para verificar si Premium está activo
function isPremiumActive() {
    return localStorage.getItem('clinic_premium_active') === 'true';
}

// Función para abrir modal de pago
window.openPaymentModal = function () {
    openModal('modalPremium');
};

// Función para copiar link de pago
window.copyPaymentLink = function () {
    const link = 'https://mpago.la/1qQmcP7';
    navigator.clipboard.writeText(link).then(() => {
        alert('✅ Link de pago copiado al portapapeles\n\nCompártelo con tus clientes para que puedan activar Premium.');
    }).catch(() => {
        // Fallback si clipboard API no funciona
        prompt('Copia este link de pago:', link);
    });
};

// Función para ingresar código de activación manual
window.enterProCode = function () {
    const code = prompt("🔑 Ingresa tu código de activación Premium:\n\n(Si pagaste y no se activó automáticamente, contacta a soporte)");

    if (!code) return; // Usuario canceló

    // Códigos válidos (compatibles con clínica y gimnasio)
    const validCodes = ['clinic_pro_2025', 'admin2025', 'gym_pro_2025', 'duenos2025'];

    if (validCodes.includes(code.trim())) {
        localStorage.setItem('clinic_premium_active', 'true');

        // Registrar activación
        const activationLog = JSON.parse(localStorage.getItem('activation_log') || '[]');
        activationLog.push({
            date: new Date().toISOString(),
            code: code,
            method: 'manual'
        });
        localStorage.setItem('activation_log', JSON.stringify(activationLog));

        alert("🎉 ¡Felicidades! Versión PREMIUM Activada\n\n✅ Pacientes ilimitados\n✅ Todas las funciones desbloqueadas\n✅ Exportación de datos habilitada\n\nLa página se recargará para aplicar los cambios.");
        location.reload();
    } else {
        alert("❌ Código inválido\n\nPor favor verifica el código e intenta nuevamente.\n\nSi pagaste y tienes problemas, contacta a soporte.");
    }
};

// Función para exportar datos (PREMIUM)
window.exportClinicData = function () {
    // === LIMITACIÓN FREE ===
    if (!isPremiumActive()) {
        alert("🔒 Función Premium Bloqueada\n\n" +
            "La exportación de copias de seguridad es exclusiva de la versión PREMIUM.\n\n" +
            "Actualiza a Premium para:\n" +
            "✅ Exportar todos tus datos\n" +
            "✅ Hacer copias de seguridad\n" +
            "✅ Migrar entre dispositivos");
        openPaymentModal();
        return;
    }
    // ======================

    // Exportar todos los datos
    const allData = {
        patients: Storage.get('patients'),
        doctors: Storage.get('doctors'),
        appointments: Storage.get('appointments'),
        history: Storage.get('history'),
        exportDate: new Date().toISOString(),
        version: 'ClinicaWeb Premium v1.0'
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `clinicaweb_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    alert(`✅ Copia de seguridad creada exitosamente\n\nArchivo: ${filename}\n\nGuarda este archivo en un lugar seguro.`);
};

// Agregar botón de exportar en el sidebar (opcional)
function addExportButton() {
    const sidebar = document.querySelector('.sidebar-nav');
    if (sidebar && !document.getElementById('btnExportData')) {
        const exportBtn = document.createElement('a');
        exportBtn.href = '#';
        exportBtn.className = 'nav-link';
        exportBtn.id = 'btnExportData';
        exportBtn.innerHTML = '<i class="bx bx-download"></i><span>Exportar Datos</span>';
        exportBtn.onclick = (e) => {
            e.preventDefault();
            exportClinicData();
        };
        sidebar.appendChild(exportBtn);
    }
}

// Verificar estado Premium al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    // 1. Verificar parámetro URL (redirección de Mercado Pago)
    const urlParams = new URLSearchParams(window.location.search);
    const accessCode = urlParams.get('access');

    if (accessCode && ['clinic_pro_2025', 'gym_pro_2025'].includes(accessCode)) {
        localStorage.setItem('clinic_premium_active', 'true');

        // Registrar activación
        const activationLog = JSON.parse(localStorage.getItem('activation_log') || '[]');
        activationLog.push({
            date: new Date().toISOString(),
            code: accessCode,
            method: 'url'
        });
        localStorage.setItem('activation_log', JSON.stringify(activationLog));

        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Mostrar mensaje de bienvenida
        setTimeout(() => {
            alert("🎉 ¡Pago Exitoso! Bienvenido a ClinicaWeb PREMIUM\n\n" +
                "✅ Tu suscripción está activa\n" +
                "✅ Todas las funciones desbloqueadas\n" +
                "✅ Pacientes ilimitados\n\n" +
                "¡Gracias por confiar en nosotros! 🚀");
        }, 500);
    }

    // 2. Verificar LocalStorage y actualizar UI
    if (isPremiumActive()) {
        const btnPremium = document.getElementById('btnPremium');
        if (btnPremium) {
            btnPremium.innerHTML = '<i class="bx bx-check-circle"></i> PRO ACTIVADO';
            btnPremium.classList.add('activated');
            btnPremium.onclick = () => {
                alert("✅ Versión Premium Activa\n\n" +
                    "Tu suscripción está activa y todas las funciones están desbloqueadas.\n\n" +
                    "Gracias por ser usuario Premium! 💎");
            };
        }
    }

    // 3. Agregar botón de exportar
    setTimeout(addExportButton, 1000);
});

// =====================================================
// LIMITACIONES VERSIÓN FREE
// =====================================================

// Modificar la función de agregar paciente para incluir limitación
const originalPatientSubmit = document.getElementById('patient-form').onsubmit;
document.getElementById('patient-form').addEventListener('submit', function (e) {
    const id = document.getElementById('p-id').value;

    // Si NO es edición (nuevo paciente)
    if (!id) {
        const patients = Storage.get('patients');

        // === LIMITACIÓN FREE: Máximo 10 pacientes ===
        if (!isPremiumActive() && patients.length >= 10) {
            e.preventDefault();
            e.stopImmediatePropagation();

            alert("🔒 Límite Alcanzado - Actualiza a Premium\n\n" +
                "La versión GRATUITA permite máximo 10 pacientes.\n\n" +
                "Actualmente tienes: " + patients.length + " pacientes registrados\n\n" +
                "Actualiza a PREMIUM para:\n" +
                "✅ Pacientes ILIMITADOS\n" +
                "✅ Historial clínico completo\n" +
                "✅ Reportes avanzados\n" +
                "✅ Copias de seguridad\n\n" +
                "Solo $8.000/mes - ¡Menos que un café por día!");

            openPaymentModal();
            return false;
        }
        // ============================================
    }
}, true); // Usar capture para ejecutar antes que el handler original
