/**
 * =========================================================
 * RIDOKEY - PREMIUM DASHBOARD LOGIC
 * =========================================================
 * Dibuat khusus agar animasi berjalan mulus tanpa reload.
 */

// --- 1. STATE MANAGEMENT ---
const State = {
  isFetching: false,
  intervalId: null,
  lastData: null
};

// --- 2. UTILITY FUNCTIONS ---

// Format Byte ke MB/GB
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 MB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Buat Container Toast Otomatis
function initToastContainer() {
  if (!document.querySelector('.toast-container')) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

// Tampilkan Notifikasi Pop-up Premium
function showToast(message, type = 'info') {
  initToastContainer();
  const container = document.querySelector('.toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Animasi Keluar
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- 3. UI SKELETON CONTROLS ---

function setLoadingState(isLoading) {
  const ids = ['statServerName', 'statState', 'statCpu', 'statRam'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (isLoading && el.textContent === '—') {
        el.classList.add('loading-text');
        el.textContent = 'Loading Data...'; // Teks ini disembunyikan CSS
      } else if (!isLoading) {
        el.classList.remove('loading-text');
      }
    }
  });
}

function showError(message, detail = '') {
  const errorBox = document.getElementById('errorBox');
  const errorText = document.getElementById('errorText');
  
  if (!errorBox || !errorText) return;

  document.getElementById('statusBadge').className = 'status-badge unknown';
  document.getElementById('statusText').textContent = 'ERROR';
  
  let fullMsg = message;
  if (detail) {
    fullMsg += `\n\nDetail: ${typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail}`;
  }
  
  errorText.textContent = fullMsg;
  errorBox.style.display = 'block';
  
  // Efek getar saat error muncul
  errorBox.style.animation = 'none';
  errorBox.offsetHeight; /* trigger reflow */
  errorBox.style.animation = 'shake 0.5s ease-in-out';
}

function hideError() {
  const errorBox = document.getElementById('errorBox');
  if (errorBox) errorBox.style.display = 'none';
}

// --- 4. CORE LOGIC: FETCH STATUS ---

async function loadStatus(isSilent = false) {
  if (State.isFetching) return; // Cegah request tumpang tindih
  State.isFetching = true;

  if (!isSilent) setLoadingState(true);

  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    
    if (!data.ok) {
      throw new Error(data.error || "Gagal mengambil data dari server.");
    }

    hideError();
    State.lastData = data.server;

    // Update Teks UI dengan Smooth Transition
    const nameEl = document.getElementById('statServerName');
    const stateEl = document.getElementById('statState');
    const cpuEl = document.getElementById('statCpu');
    const ramEl = document.getElementById('statRam');

    // Cek apakah data berubah, kalau iya kasih efek flash (opsional)
    if (nameEl.textContent !== data.server.name) {
      nameEl.style.opacity = 0;
      setTimeout(() => {
        nameEl.textContent = data.server.name;
        nameEl.style.opacity = 1;
      }, 150);
    } else {
      nameEl.textContent = data.server.name;
    }

    stateEl.textContent = data.server.state.toUpperCase();
    cpuEl.textContent = (data.server.resources.cpu_absolute || 0).toFixed(1) + '%';
    ramEl.textContent = formatBytes(data.server.resources.memory_bytes);

    // Update Badge
    const badge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    
    if (data.server.state === 'running') {
      badge.className = 'status-badge on';
      statusText.textContent = 'SERVER ON';
    } else {
      badge.className = 'status-badge off';
      statusText.textContent = 'SERVER OFF';
    }

    // Tampilkan notif sukses HANYA kalau bukan silent refresh
    if (!isSilent && !State.lastData) {
      showToast("Terhubung ke Pterodactyl!", "success");
    }

  } catch (err) {
    console.error(err);
    showError(err.message);
    if (!isSilent) showToast(err.message, "error");
  } finally {
    State.isFetching = false;
    setLoadingState(false);
  }
}

// --- 5. CORE LOGIC: POWER ACTION ---

async function power(signal) {
  const btn = event.target;
  const originalText = btn.innerHTML;
  
  // Validasi Konfirmasi
  if (!confirm(`Yakin ingin melakukan [${signal.toUpperCase()}] pada server?`)) return;

  // Loading state di tombol
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Memproses...`;

  try {
    const res = await fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signal })
    });
    const data = await res.json();
    
    if (!data.ok) throw new Error(data.error || "Gagal mengirim perintah power.");

    showToast(data.message || `Perintah ${signal} berhasil dikirim!`, "success");
    
    // Tunggu 2 detik sebelum refresh status biar panel sempat berubah
    setTimeout(() => loadStatus(true), 2000);

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// --- 6. CORE LOGIC: GENERATE API KEY ---

async function generateKey() {
  const btn = document.getElementById('btnGenerate');
  const keyBox = document.getElementById('newKeyBox');
  const keyValue = document.getElementById('newKeyValue');
  
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Membuat...`;

  try {
    const res = await fetch('/api/keys', { method: 'POST' });
    const data = await res.json();
    
    if (!data.ok) throw new Error(data.error || "Gagal membuat API Key.");

    // Sembunyikan box dulu, lalu tampilkan dengan animasi baru
    keyBox.style.display = 'none';
    
    setTimeout(() => {
      keyBox.style.display = 'block';
      keyValue.textContent = data.secret || "Key tidak dikembalikan panel (Cek manual di Pterodactyl).";
      
      // Efek copy saat diklik
      keyValue.onclick = () => {
        navigator.clipboard.writeText(keyValue.textContent);
        showToast("Key berhasil di-copy ke clipboard!", "info");
      };
      
      showToast("API Key berhasil dibuat!", "success");
    }, 100);

  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// --- 7. INITIALIZATION & EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
  // Init UI
  initToastContainer();
  
  // Load Data Pertama Kali
  loadStatus(false);

  // Auto Refresh tiap 10 detik (Silent)
  State.intervalId = setInterval(() => {
    loadStatus(true);
  }, 10000);

  // Event Listener Tombol Generate Key
  const btnGenerate = document.getElementById('btnGenerate');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', generateKey);
  }

  // Hapus interval kalau tab browser ditutup (mencegah memory leak)
  window.addEventListener('beforeunload', () => {
    if (State.intervalId) clearInterval(State.intervalId);
  });
});

// Tangkap Fungsi Global dari HTML
window.power = power;