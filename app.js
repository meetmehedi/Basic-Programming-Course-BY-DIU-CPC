/* ============================================================
   DIU CPC Basic Programming Course — Attendance System JS
   ============================================================ */

'use strict';

/* ---- Configuration ---- */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0Aqz-yFRGvVqvFsyBTH-p_Kwyng5fGrW0HwgV5nzv9lHi7DkaiHi0KXX9KXXSSz8S/exec';

/* ---- State ---- */
let records = loadRecords();

/* ============================================================
   CLOCK & DATE
   ============================================================ */
function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('dateDisplay');

  if (timeEl) {
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    timeEl.textContent = `${h}:${m}:${s}`;
  }

  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-BD', options);
  }
}

setInterval(updateClock, 1000);
updateClock();

/* ============================================================
   LECTURE AUTOMATION
   ============================================================ */
function updateLectureNumberAuto(dateString) {
  const lectureNoInput = document.getElementById('lectureNo');
  if (!lectureNoInput || !dateString) return;

  const msPerDay = 1000 * 60 * 60 * 24;
  const lecture12Date = Date.UTC(2026, 9, 6); // Tuesday, October 6, 2026
  
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return;
  const utcTarget = Date.UTC(year, month - 1, day);
  const daysDiff = Math.floor((utcTarget - lecture12Date) / msPerDay);
  const lectureNum = daysDiff > 0
    ? 12 + Math.ceil(daysDiff / 7)
    : 12 + Math.floor(daysDiff / 7);
  lectureNoInput.value = lectureNum;
  
  const sessionEl = document.getElementById('todayLecture');
  if (sessionEl) {
    sessionEl.textContent = `Lecture #${lectureNoInput.value || '?'}`;
  }
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ============================================================
   ON PAGE LOAD
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const savedTheme = localStorage.getItem('diucpc_theme') || 'dark';
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = '🌙';
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('diucpc_theme', 'dark');
        themeToggle.textContent = '☀️';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('diucpc_theme', 'light');
        themeToggle.textContent = '🌙';
      }
    });
  }

  // Set today's date
  const today = getLocalDateString();
  const lectureDateInput = document.getElementById('lectureDate');
  if (lectureDateInput) {
    lectureDateInput.value = today;
    lectureDateInput.max = today;
    
    // Listen for date changes to auto-update lecture number
    lectureDateInput.addEventListener('change', (e) => {
      updateLectureNumberAuto(e.target.value);
    });
  }

  // Auto-fill lecture number based on date
  updateLectureNumberAuto(today);
  
  updateStats();
  renderTable();
});

/* ---- Storage Keys ---- */
const STORAGE_KEY = 'diucpc_attendance_records';

/* ============================================================
   LOCAL STORAGE
   ============================================================ */
function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/* ============================================================
   STATS
   ============================================================ */
function updateStats() {
  const today = getLocalDateString();
  const todayCount = records.filter(r => r.date === today).length;

  const el1 = document.getElementById('totalAttendees');
  const el2 = document.getElementById('totalRecords');

  if (el1) animateCount(el1, todayCount);
  if (el2) animateCount(el2, records.length);
}

function animateCount(el, target) {
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  const duration = 500;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + diff * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}



/* ============================================================
   FORM VALIDATION & SUBMIT
   ============================================================ */
const form = document.getElementById('attendanceForm');

if (form) {
  form.addEventListener('submit', handleSubmit);

  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateField(input);
    });
  });
}

function validateField(input) {
  const id = input.id;
  const errorMap = {
    studentName: 'nameError',
    studentEmail: 'emailError',
    studentRoll: 'rollError',
    studentBatch: 'batchError',
    lectureNo: 'lectureError',
    lectureDate: 'dateError',
  };

  const errorEl = document.getElementById(errorMap[id]);
  if (!errorEl) return true;

  let msg = '';

  if (!input.value.trim()) {
    msg = 'This field is required.';
  } else {
    if (id === 'studentEmail') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(input.value.trim())) {
        msg = 'Please enter a valid email address.';
      }
    }
    if (id === 'studentName' && input.value.trim().length < 2) {
      msg = 'Name must be at least 2 characters.';
    }
    if (id === 'studentRoll' && input.value.trim().length < 1) {
      msg = 'Enter a valid roll number.';
    }
    if (id === 'lectureNo' && (parseInt(input.value) < 1 || isNaN(parseInt(input.value)))) {
      msg = 'Enter a valid lecture number (≥ 1).';
    }
  }

  errorEl.textContent = msg;
  input.classList.toggle('error', !!msg);
  input.classList.toggle('success', !msg && !!input.value.trim());

  return !msg;
}

function handleSubmit(e) {
  e.preventDefault();

  // Validate required fields
  const fields = ['studentName', 'studentEmail', 'studentRoll', 'studentBatch', 'lectureNo', 'lectureDate'];
  let valid = true;

  fields.forEach(id => {
    const input = document.getElementById(id);
    if (input && !validateField(input)) valid = false;
  });

  // Validate feedback
  const rating = document.getElementById('lectureRating').value;
  const ratingError = document.getElementById('ratingError');
  if (!rating) {
    if (ratingError) ratingError.textContent = 'Please rate the lecture.';
    valid = false;
  } else if (ratingError) {
    ratingError.textContent = '';
  }

  const diff = document.getElementById('lectureDifficulty').value;
  const diffError = document.getElementById('difficultyError');
  if (!diff) {
    if (diffError) diffError.textContent = 'Please select a difficulty level.';
    valid = false;
  } else if (diffError) {
    diffError.textContent = '';
  }

  // Validate checkbox
  const confirmEl = document.getElementById('confirmPresent');
  const confirmError = document.getElementById('confirmError');
  if (confirmEl && !confirmEl.checked) {
    if (confirmError) confirmError.textContent = 'You must confirm your presence to submit.';
    valid = false;
  } else if (confirmError) {
    confirmError.textContent = '';
  }

  if (!valid) {
    shakeForm();
    return;
  }

  // Duplicate check (same email + same lecture date)
  const email = document.getElementById('studentEmail').value.trim().toLowerCase();
  const lectureDate = document.getElementById('lectureDate').value;
  const lectureNo = document.getElementById('lectureNo').value;
  const duplicate = records.find(r => r.email.toLowerCase() === email && r.date === lectureDate);

  if (duplicate) {
    showToast(`⚠️ ${document.getElementById('studentName').value.split(' ')[0]}, you've already submitted attendance for this lecture!`, 'warning');
    return;
  }

  // Build record
  const now = new Date();
  const record = {
    id: Date.now(),
    name: document.getElementById('studentName').value.trim(),
    email: email,
    studentId: document.getElementById('studentId')?.value.trim() || '',
    roll: document.getElementById('studentRoll').value.trim(),
    batch: document.getElementById('studentBatch').value.trim(),
    semester: document.getElementById('studentSemester')?.value || '',
    dept: 'CSE',
    cpcMembershipId: document.getElementById('cpcMembershipId')?.value.trim() || '',
    lecture: parseInt(lectureNo),
    date: lectureDate,
    time: now.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    synced: false,
    // Optional feedback
    rating: document.getElementById('lectureRating')?.value || '',
    difficulty: document.getElementById('lectureDifficulty')?.value || '',
    comment: document.getElementById('feedbackComment')?.value.trim() || '',
  };

  // Save locally first
  records.unshift(record);
  saveRecords();
  updateStats();
  renderTable();

  // Update session label
  const sessionEl = document.getElementById('todayLecture');
  if (sessionEl) sessionEl.textContent = `Lecture #${record.lecture}`;

  // Show local success toast immediately
  showToast(`🎉 Welcome, ${record.name.split(' ')[0]}! Attendance recorded for Lecture #${record.lecture}.`);

  // Background Sync to Google Sheets
  sendToGoogleSheets(record).then(() => {
    const idx = records.findIndex(r => r.id === record.id);
    if (idx !== -1) {
      records[idx].synced = true;
      saveRecords();
      renderTable();
    }
  });

  // Reset form
  form.reset();
  form.querySelectorAll('.form-input').forEach(inp => {
    inp.classList.remove('error', 'success');
  });
  form.querySelectorAll('.form-error').forEach(el => el.textContent = '');

  // Reset feedback
  resetFeedback();

  // Restore defaults
  const todayDate = getLocalDateString();
  document.getElementById('lectureDate').value = todayDate;
  updateLectureNumberAuto(todayDate);

  // Scroll to table
  const tableSection = document.getElementById('tableSection');
  if (tableSection) {
    tableSection.style.display = 'block';
    setTimeout(() => tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  }
}

function shakeForm() {
  const card = document.querySelector('.form-card');
  if (!card) return;
  card.style.animation = 'none';
  void card.offsetWidth; // reflow
  card.style.animation = 'shake 0.4s ease';
  setTimeout(() => card.style.animation = '', 400);
}

// Shake keyframes
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}`;
document.head.appendChild(shakeStyle);

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMsg');
  if (!toast || !msg) return;

  msg.textContent = message;
  toast.style.borderColor = type === 'warning' ? 'hsl(38, 92%, 50%)' : 'hsl(142, 76%, 36%)';
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => closeToast(), 5000);
}

function closeToast() {
  const toast = document.getElementById('toast');
  if (toast) toast.classList.remove('show');
}

window.closeToast = closeToast;

/* ============================================================
   FEEDBACK SECTION
   ============================================================ */
let currentRating = 0;

function toggleFeedback() {
  const body = document.getElementById('feedbackBody');
  const chevron = document.getElementById('feedbackChevron');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'flex';
  if (chevron) chevron.classList.toggle('open', !isOpen);
}

function setRating(value) {
  currentRating = value;
  const input = document.getElementById('lectureRating');
  if (input) input.value = value;
  const err = document.getElementById('ratingError');
  if (err) err.textContent = '';

  const stars = document.querySelectorAll('.star');
  stars.forEach(s => {
    const v = parseInt(s.dataset.value);
    s.classList.toggle('active', v <= value);
  });

  const labels = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Very Good 😊', 'Excellent 🤩'];
  const lbl = document.getElementById('starLabel');
  if (lbl) lbl.textContent = labels[value] || '';
}

function setDifficulty(value) {
  const input = document.getElementById('lectureDifficulty');
  if (input) input.value = value;
  const err = document.getElementById('difficultyError');
  if (err) err.textContent = '';

  document.querySelectorAll('.diff-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.val === value);
  });
}

function resetFeedback() {
  currentRating = 0;
  const ratingInput = document.getElementById('lectureRating');
  if (ratingInput) ratingInput.value = '';
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  const lbl = document.getElementById('starLabel');
  if (lbl) lbl.textContent = 'Click to rate';

  const diffInput = document.getElementById('lectureDifficulty');
  if (diffInput) diffInput.value = '';
  document.querySelectorAll('.diff-pill').forEach(p => p.classList.remove('selected'));

  const comment = document.getElementById('feedbackComment');
  if (comment) comment.value = '';
  const counter = document.getElementById('charCount');
  if (counter) counter.textContent = '0 / 400';

  // Clear feedback errors
  const rErr = document.getElementById('ratingError');
  if (rErr) rErr.textContent = '';
  const dErr = document.getElementById('difficultyError');
  if (dErr) dErr.textContent = '';
}

// Star hover effect
document.addEventListener('DOMContentLoaded', () => {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.value);
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= val));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= currentRating));
    });
  });

  // Char counter
  const textarea = document.getElementById('feedbackComment');
  const counter = document.getElementById('charCount');
  if (textarea && counter) {
    textarea.addEventListener('input', () => {
      counter.textContent = `${textarea.value.length} / 400`;
      counter.style.color = textarea.value.length > 350 ? 'hsl(38,92%,55%)' : '';
    });
  }
});

window.toggleFeedback = toggleFeedback;
window.setRating = setRating;
window.setDifficulty = setDifficulty;

/* ============================================================
   RENDER TABLE
   ============================================================ */
function renderTable(data = records) {
  const tbody = document.getElementById('attendanceBody');
  const emptyEl = document.getElementById('tableEmpty');
  const tableSection = document.getElementById('tableSection');
  const wrapper = document.querySelector('.table-wrapper');

  if (!tbody) return;

  if (records.length === 0) {
    if (tableSection) tableSection.style.display = 'none';
    return;
  }

  if (tableSection) tableSection.style.display = 'block';
  tbody.innerHTML = '';

  if (data.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (emptyEl) emptyEl.classList.add('show');
    return;
  }

  if (wrapper) wrapper.style.display = '';
  if (emptyEl) emptyEl.classList.remove('show');

  data.forEach((rec, idx) => {
    const tr = document.createElement('tr');
    const semLabel = rec.semester ? `${rec.semester}${getOrdinal(rec.semester)} Sem` : '—';
    const syncBadge = rec.synced
      ? `<span class="sync-badge">✓ Synced</span>`
      : `<span class="sync-badge" style="background:hsla(38,92%,50%,0.1);color:hsl(38,92%,60%)">⏳ Pending</span>`;

    tr.innerHTML = `
      <td>${data.length - idx}</td>
      <td><span class="name-cell">${escapeHTML(rec.name)}</span>${syncBadge}</td>
      <td title="${escapeHTML(rec.email)}">${escapeHTML(truncate(rec.email, 22))}</td>
      <td><code style="font-family:'JetBrains Mono',monospace;font-size:0.78rem">${escapeHTML(rec.studentId || '—')}</code></td>
      <td><code style="font-family:'JetBrains Mono',monospace;font-size:0.78rem">${escapeHTML(rec.roll)}</code></td>
      <td><span class="badge-pill badge-batch">${escapeHTML(rec.batch)}</span></td>
      <td>${semLabel}</td>
      <td><span class="badge-pill badge-dept">${escapeHTML(rec.dept)}</span></td>
      <td><span class="badge-pill" style="background:hsla(270,70%,60%,0.15);color:hsl(270,70%,75%)">${escapeHTML(rec.cpcMembershipId || '—')}</span></td>
      <td style="font-family:'JetBrains Mono',monospace">#${rec.lecture}</td>
      <td>${formatDate(rec.date)}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:0.78rem">${escapeHTML(rec.time)}</td>
      <td>
        <button class="delete-btn" onclick="deleteRecord(${rec.id})" title="Remove this record">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getOrdinal(n) {
  const num = parseInt(n);
  if (num === 1) return 'st';
  if (num === 2) return 'nd';
  if (num === 3) return 'rd';
  return 'th';
}

/* ============================================================
   SEARCH / FILTER
   ============================================================ */
function filterTable() {
  const query = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  if (!query) { renderTable(records); return; }

  const filtered = records.filter(r =>
    r.name.toLowerCase().includes(query) ||
    r.email.toLowerCase().includes(query) ||
    (r.roll || '').toLowerCase().includes(query) ||
    (r.batch || '').toLowerCase().includes(query) ||
    (r.studentId || '').toLowerCase().includes(query) ||
    (r.cpcMembershipId || '').toLowerCase().includes(query)
  );
  renderTable(filtered);
}

window.filterTable = filterTable;

/* ============================================================
   DELETE RECORD
   ============================================================ */
function deleteRecord(id) {
  if (!confirm('Remove this attendance record?')) return;
  records = records.filter(r => r.id !== id);
  saveRecords();
  updateStats();
  renderTable();
  const query = document.getElementById('searchInput')?.value;
  if (query) filterTable();
}

window.deleteRecord = deleteRecord;

/* ============================================================
   CLEAR ALL
   ============================================================ */
function clearRecords() {
  if (!confirm('Are you sure you want to delete ALL attendance records? This cannot be undone.')) return;
  records = [];
  saveRecords();
  updateStats();
  renderTable();
}

window.clearRecords = clearRecords;

/* ============================================================
   EXPORT CSV
   ============================================================ */
function exportCSV() {
  if (records.length === 0) { alert('No records to export.'); return; }

  const headers = ['#', 'Name', 'Email', 'Student ID', 'Roll', 'Batch', 'Semester', 'Department', 'CPC Membership ID', 'Lecture', 'Date', 'Time', 'Synced to Sheets'];
  const rows = records.map((r, i) => [
    records.length - i,
    r.name,
    r.email,
    r.studentId || '',
    r.roll,
    r.batch,
    r.semester ? `${r.semester}${getOrdinal(r.semester)} Semester` : '',
    r.dept,
    r.cpcMembershipId || '',
    `Lecture #${r.lecture}`,
    r.date,
    r.time,
    r.synced ? 'Yes' : 'No',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = getLocalDateString();
  a.href = url;
  a.download = `diucpc_attendance_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.exportCSV = exportCSV;

/* ============================================================
   HELPERS
   ============================================================ */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/* ============================================================
   GOOGLE SHEETS — SEND RECORD
   ============================================================ */
async function sendToGoogleSheets(record) {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(record),
    });
    console.log('✅ Synced to Google Sheets:', record.name);
  } catch (err) {
    console.warn('POST failed, trying GET fallback…', err);
    try {
      const params = new URLSearchParams({
        name: record.name,
        email: record.email,
        studentId: record.studentId || '',
        roll: record.roll,
        batch: record.batch,
        semester: record.semester || '',
        dept: record.dept,
        cpcMembershipId: record.cpcMembershipId || '',
        lecture: record.lecture,
        date: record.date,
        time: record.time,
        rating: record.rating || '',
        difficulty: record.difficulty || '',
        comment: record.comment || '',
      });
      await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
      });
      console.log('✅ Synced via GET fallback:', record.name);
    } catch (fallbackErr) {
      console.error('❌ Google Sheets sync failed completely:', fallbackErr);
    }
  }
}
