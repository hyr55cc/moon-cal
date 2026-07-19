/**
 * moon Calendar - Main Application Controller
 * Wires together all modules and handles UI interactions
 */

(function () {
  'use strict';

  const CATEGORIES = [
    { id: 'general', name: 'عام', color: '#c9a961', icon: '📌' },
    { id: 'work', name: 'عمل', color: '#1d4f6e', icon: '💼' },
    { id: 'family', name: 'عائلي', color: '#8a2a2a', icon: '👨‍👩‍👧' },
    { id: 'health', name: 'صحة', color: '#1a6044', icon: '❤️' },
    { id: 'study', name: 'دراسة', color: '#8a6420', icon: '📚' },
    { id: 'religious', name: 'ديني', color: '#0d4f3c', icon: '🕌' },
    { id: 'birthday', name: 'عيد ميلاد', color: '#b34040', icon: '🎂' },
    { id: 'deadline', name: 'موعد نهائي', color: '#b34040', icon: '⏰' },
    { id: 'travel', name: 'سفر', color: '#3a7798', icon: '✈️' }
  ];

  // State
  let currentView = 'calendar';
  let currentEditingId = null;
  let settings = EventStorage.loadSettings();

  /**
   * Initialize the app
   */
  function init() {
    // Load settings
    settings = EventStorage.loadSettings();

    // Build category options
    buildCategoryOptions();

    // Set today's date as default in event form
    setDefaultFormDate();

    // Initialize calendar view
    CalendarView.init(new Date(), settings.primaryCalendar || 'hijri',
      handleDayClick, handleMonthChange);

    // Render initial calendar
    CalendarView.render();
    renderEventsList();
    updateNotificationStatus();

    // Attach global event listeners
    attachEventListeners();

    // Start notification checker
    if (settings.notificationsEnabled) {
      Notifications.startNotificationChecker();
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Check for daily rollover
    setupDailyRollover();

    // Show welcome message on first run
    if (!localStorage.getItem('moon_welcomed')) {
      setTimeout(() => {
        showToast('مرحباً بك في تقويم moon 🌙', 'success');
        localStorage.setItem('moon_welcomed', 'true');
      }, 800);
    }

    // Optional: load demo data when ?demo=1
    if (window.location.search.includes('demo=1')) {
      loadDemoData();
    }

    // Optional: switch view via ?view=calendar|converter|data|settings
    const viewParam = window.location.search.match(/view=([^&]+)/);
    if (viewParam) {
      const v = viewParam[1];
      if (['calendar', 'converter', 'data', 'settings'].includes(v)) {
        setTimeout(() => switchView(v), 100);
      }
    }
  }

  /**
   * Load demo events (used for screenshots and demos)
   */
  function loadDemoData() {
    if (EventStorage.loadEvents().length > 0) return;
    const today = new Date();
    const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const t = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return d; };

    const events = [
      { title: 'اجتماع فريق العمل', date: fmt(t(2)), time: '10:00', duration: 60, category: 'work', color: '#1d4f6e', reminder: 30, description: 'اجتماع شهري لمراجعة المشاريع الحالية' },
      { title: 'موعد مع الطبيب', date: fmt(t(5)), time: '16:30', duration: 30, category: 'health', color: '#1a6044', reminder: 60, description: 'فحص دوري' },
      { title: 'عيد ميلاد أحمد', date: fmt(t(12)), time: '19:00', duration: 180, category: 'birthday', color: '#b34040', reminder: 1440 },
      { title: 'موعد نهائي - تسليم المشروع', date: fmt(t(20)), time: '23:59', duration: 0, category: 'deadline', color: '#b34040', reminder: 120 },
      { title: 'رحلة عائلية', date: fmt(t(35)), time: '08:00', duration: 480, category: 'travel', color: '#3a7798', reminder: 10080 },
      { title: 'امتحان نهاية الفصل', date: fmt(t(45)), time: '09:00', duration: 120, category: 'study', color: '#8a6420', reminder: 1440 }
    ];
    events.forEach(e => EventStorage.addEvent(e));
    CalendarView.render();
    renderEventsList();
  }

  /**
   * Build category select options
   */
  function buildCategoryOptions() {
    const select = document.getElementById('eventCategory');
    if (!select) return;
    select.innerHTML = CATEGORIES.map(c =>
      `<option value="${c.id}" data-color="${c.color}">${c.icon} ${c.name}</option>`
    ).join('');
  }

  /**
   * Attach global event listeners
   */
  function attachEventListeners() {
    // Navigation
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Calendar toolbar
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => CalendarView.prevMonth());
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => CalendarView.nextMonth());
    document.getElementById('todayBtn')?.addEventListener('click', () => {
      CalendarView.goToToday();
      renderEventsList();
    });
    document.getElementById('addEventBtn')?.addEventListener('click', () => openEventModal());

    // Calendar system toggle
    document.querySelectorAll('.system-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.system-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.sys;
        CalendarView.setView(view);
        settings.primaryCalendar = view;
        EventStorage.saveSettings(settings);
      });
    });
    // Set initial active state
    const sysBtn = document.querySelector(`.system-toggle-btn[data-sys="${settings.primaryCalendar || 'hijri'}"]`);
    if (sysBtn) {
      document.querySelectorAll('.system-toggle-btn').forEach(b => b.classList.remove('active'));
      sysBtn.classList.add('active');
    }

    // Event modal
    document.getElementById('eventForm')?.addEventListener('submit', handleEventSubmit);
    document.getElementById('cancelEventBtn')?.addEventListener('click', closeEventModal);
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => closeAllModals());
    });
    document.getElementById('eventModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'eventModal') closeAllModals();
    });
    document.getElementById('eventDate')?.addEventListener('change', updateFormDateHijri);

    // Day detail
    document.getElementById('addEventForDayBtn')?.addEventListener('click', () => {
      const date = CalendarView.getSelectedDate();
      if (date) {
        closeAllModals();
        openEventModal(null, date);
      }
    });

    // Converter
    document.querySelectorAll('.converter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.converter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const direction = tab.dataset.dir;
        document.getElementById('gToHConverter').style.display = direction === 'g2h' ? 'block' : 'none';
        document.getElementById('hToGConverter').style.display = direction === 'h2g' ? 'block' : 'none';
      });
    });

    document.getElementById('convertGtoHBtn')?.addEventListener('click', convertGtoH);
    document.getElementById('convertHtoGBtn')?.addEventListener('click', convertHtoG);

    // Set converter defaults
    const today = new Date();
    const todayHijri = HijriCalendar.gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const gDateInput = document.getElementById('gDateInput');
    if (gDateInput) gDateInput.value = EventStorage.formatDateISO(today);
    const hYearInput = document.getElementById('hYearInput');
    if (hYearInput) hYearInput.value = todayHijri.year;
    const hMonthInput = document.getElementById('hMonthInput');
    if (hMonthInput) hMonthInput.value = todayHijri.month;
    const hDayInput = document.getElementById('hDayInput');
    if (hDayInput) hDayInput.value = todayHijri.day;

    // Import/Export
    document.getElementById('exportICSBtn')?.addEventListener('click', handleExportICS);
    document.getElementById('exportJSONBtn')?.addEventListener('click', handleExportJSON);
    document.getElementById('importICSFile')?.addEventListener('change', handleImportICS);
    document.getElementById('importJSONFile')?.addEventListener('change', handleImportJSON);

    // Settings
    document.getElementById('enableNotifications')?.addEventListener('change', handleNotificationToggle);
    document.getElementById('clearAllBtn')?.addEventListener('click', handleClearAll);

    // Auto-convert on change
    document.getElementById('gDateInput')?.addEventListener('change', convertGtoH);
    document.getElementById('hYearInput')?.addEventListener('change', convertHtoG);
    document.getElementById('hMonthInput')?.addEventListener('change', convertHtoG);
    document.getElementById('hDayInput')?.addEventListener('change', convertHtoG);
  }

  /**
   * Switch between views
   */
  function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(view + 'View')?.classList.add('active');
    document.querySelectorAll('[data-view]').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });

    if (view === 'converter') {
      // Run initial conversion
      convertGtoH();
    }
  }

  /**
   * Handle day click on calendar
   */
  function handleDayClick(dateStr) {
    CalendarView.setSelectedDate(dateStr);
    showDayDetailModal(dateStr);
  }

  /**
   * Handle month change
   */
  function handleMonthChange() {
    renderEventsList();
  }

  /**
   * Show day detail modal
   */
  function showDayDetailModal(dateStr) {
    const modal = document.getElementById('dayDetailModal');
    if (!modal) return;

    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const hijri = HijriCalendar.gregorianToHijri(y, m, d);
    const events = EventStorage.getEventsForDate(dateStr);
    const dayName = HijriCalendar.getDayName(date, 'ar');

    document.getElementById('dayDetailDayName').textContent = dayName;
    document.getElementById('dayDetailHijri').textContent =
      `${HijriCalendar.toArabicNumerals(hijri.day)} ${HijriCalendar.HIJRI_MONTH_NAMES_AR[hijri.month - 1]} ${HijriCalendar.toArabicNumerals(hijri.year)} هـ`;
    document.getElementById('dayDetailGregorian').textContent =
      `${HijriCalendar.toArabicNumerals(d)} ${HijriCalendar.GREGORIAN_MONTH_NAMES_AR[m - 1]} ${HijriCalendar.toArabicNumerals(y)} م`;

    const listEl = document.getElementById('dayDetailEventsList');
    if (events.length === 0) {
      listEl.innerHTML = `
        <div class="day-detail-empty">
          <div class="day-detail-empty-icon">📅</div>
          <p>لا توجد مواعيد في هذا اليوم</p>
        </div>
      `;
    } else {
      listEl.innerHTML = events.map(e => renderEventCard(e)).join('');
      // Attach handlers
      listEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
          closeAllModals();
          openEventModal(btn.dataset.id);
        });
      });
      listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('هل تريد حذف هذا الموعد؟')) {
            EventStorage.deleteEvent(btn.dataset.id);
            closeAllModals();
            showDayDetailModal(dateStr);
            CalendarView.render();
            renderEventsList();
            showToast('تم حذف الموعد', 'success');
          }
        });
      });
    }

    // Set the add event button's date
    document.getElementById('addEventForDayBtn').dataset.date = dateStr;

    modal.classList.add('show');
  }

  /**
   * Render events list for upcoming section
   */
  function renderEventsList() {
    const container = document.getElementById('eventsList');
    if (!container) return;

    const upcoming = EventStorage.getUpcomingEvents(20);
    const today = EventStorage.formatDateISO(new Date());
    const todayEvents = EventStorage.getEventsForDate(today);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🌙</div>
          <div class="empty-state-title">لا توجد مواعيد قادمة</div>
          <div class="empty-state-text">ابدأ بإضافة مواعيدك لتنظيم وقتك ومتابعة مناسباتك</div>
          <button class="btn btn-primary" onclick="document.getElementById('addEventBtn').click()">
            <span>➕</span> إضافة موعد جديد
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = upcoming.map(evt => renderEventCard(evt)).join('');

    // Attach handlers
    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => openEventModal(btn.dataset.id));
    });
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('هل تريد حذف هذا الموعد؟')) {
          EventStorage.deleteEvent(btn.dataset.id);
          CalendarView.render();
          renderEventsList();
          showToast('تم حذف الموعد', 'success');
        }
      });
    });
  }

  /**
   * Render a single event card
   */
  function renderEventCard(evt) {
    const date = new Date(evt.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = EventStorage.formatDateISO(today);
    const isToday = evt.date === todayStr;
    const isPast = evt.date < todayStr;
    const daysUntil = calculateDaysUntil(evt.date);
    const category = CATEGORIES.find(c => c.id === evt.category) || CATEGORIES[0];

    const formattedDate = HijriCalendar.formatArabicDate(
      date.getFullYear(), date.getMonth() + 1, date.getDate()
    );

    let countdownHtml = '';
    if (isToday) {
      countdownHtml = `<div class="event-countdown"><span class="countdown-label">الحالة</span><span class="countdown-value">اليوم 📍</span></div>`;
    } else if (!isPast) {
      const cls = daysUntil <= 3 ? 'urgent' : (daysUntil <= 7 ? 'soon' : '');
      const dayWord = daysUntil === 1 ? 'يوم' : (daysUntil === 2 ? 'يومين' : (daysUntil <= 10 ? 'أيام' : 'يوم'));
      countdownHtml = `<div class="event-countdown ${cls}"><span class="countdown-label">متبقي</span><span class="countdown-value">${HijriCalendar.toArabicNumerals(daysUntil)} ${dayWord}</span></div>`;
    } else {
      const daysAgo = Math.abs(daysUntil);
      countdownHtml = `<div class="event-countdown" style="background: linear-gradient(135deg, #6b7a72, #9aa49c);"><span class="countdown-label">مرّ منذ</span><span class="countdown-value">${HijriCalendar.toArabicNumerals(daysAgo)} يوم</span></div>`;
    }

    const cardClasses = ['event-card'];
    if (isPast) cardClasses.push('passed');
    if (isToday) cardClasses.push('today');

    return `
      <div class="${cardClasses.join(' ')}" style="border-right-color: ${evt.color || category.color}">
        <div class="event-card-header">
          <div class="event-title">${category.icon} ${escapeHtml(evt.title)}</div>
          <div class="event-actions">
            <button class="icon-btn" data-action="edit" data-id="${evt.id}" title="تعديل">✏️</button>
            <button class="icon-btn danger" data-action="delete" data-id="${evt.id}" title="حذف">🗑️</button>
          </div>
        </div>
        <div class="event-meta">
          <div class="event-meta-row">
            <span class="event-meta-icon">📅</span>
            <span>${formattedDate.hijri} (${HijriCalendar.toArabicNumerals(date.getDate())} ${HijriCalendar.GREGORIAN_MONTH_NAMES_AR[date.getMonth()]})</span>
          </div>
          ${evt.allDay ? '' : `
          <div class="event-meta-row">
            <span class="event-meta-icon">⏰</span>
            <span>${HijriCalendar.toArabicNumerals(evt.time)} ${evt.duration ? '(' + evt.duration + ' دقيقة)' : ''}</span>
          </div>
          `}
          ${evt.reminder && !evt.allDay ? `
          <div class="event-meta-row">
            <span class="event-meta-icon">🔔</span>
            <span>تذكير قبل ${HijriCalendar.toArabicNumerals(evt.reminder)} دقيقة</span>
          </div>
          ` : ''}
        </div>
        ${evt.description ? `<div class="event-description">${escapeHtml(evt.description)}</div>` : ''}
        ${countdownHtml}
      </div>
    `;
  }

  /**
   * Calculate days until a given date string
   */
  function calculateDaysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diffTime = target - today;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Open event modal
   */
  function openEventModal(eventId, defaultDate) {
    currentEditingId = eventId;
    const modal = document.getElementById('eventModal');
    const titleEl = document.getElementById('eventModalTitle');
    const form = document.getElementById('eventForm');

    if (eventId) {
      // Edit mode
      const evt = EventStorage.getEvent(eventId);
      if (!evt) return;
      titleEl.textContent = 'تعديل الموعد';
      form.eventTitle.value = evt.title;
      form.eventDate.value = evt.date;
      form.eventTime.value = evt.time;
      form.eventDuration.value = evt.duration || 60;
      form.eventDescription.value = evt.description || '';
      form.eventCategory.value = evt.category || 'general';
      form.eventReminder.value = evt.reminder !== undefined ? evt.reminder : 30;
      form.eventAllDay.checked = evt.allDay || false;
      document.getElementById('deleteEventBtn').style.display = 'inline-flex';
    } else {
      // Add mode
      titleEl.textContent = 'إضافة موعد جديد';
      form.reset();
      form.eventDate.value = defaultDate || EventStorage.formatDateISO(new Date());
      form.eventTime.value = '09:00';
      form.eventDuration.value = 60;
      form.eventReminder.value = settings.defaultReminder || 30;
      form.eventCategory.value = 'general';
      document.getElementById('deleteEventBtn').style.display = 'none';
    }

    updateFormDateHijri();
    modal.classList.add('show');
    setTimeout(() => form.eventTitle.focus(), 100);
  }

  /**
   * Set default form date
   */
  function setDefaultFormDate() {
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
      dateInput.value = EventStorage.formatDateISO(new Date());
      updateFormDateHijri();
    }
  }

  /**
   * Update the Hijri display next to the date input
   */
  function updateFormDateHijri() {
    const dateInput = document.getElementById('eventDate');
    const display = document.getElementById('eventDateHijri');
    if (!dateInput || !display || !dateInput.value) return;

    const [y, m, d] = dateInput.value.split('-').map(Number);
    const hijri = HijriCalendar.gregorianToHijri(y, m, d);
    display.textContent = `${HijriCalendar.toArabicNumerals(hijri.day)} ${HijriCalendar.HIJRI_MONTH_NAMES_AR[hijri.month - 1]} ${HijriCalendar.toArabicNumerals(hijri.year)} هـ`;
  }

  /**
   * Handle event form submit
   */
  function handleEventSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = {
      title: form.eventTitle.value.trim(),
      date: form.eventDate.value,
      time: form.eventTime.value,
      duration: parseInt(form.eventDuration.value) || 60,
      description: form.eventDescription.value.trim(),
      category: form.eventCategory.value,
      color: CATEGORIES.find(c => c.id === form.eventCategory.value)?.color || '#c9a961',
      reminder: parseInt(form.eventReminder.value) || 0,
      allDay: form.eventAllDay.checked
    };

    if (!formData.title) {
      showToast('الرجاء إدخال عنوان الموعد', 'error');
      return;
    }
    if (!formData.date) {
      showToast('الرجاء اختيار التاريخ', 'error');
      return;
    }

    if (currentEditingId) {
      EventStorage.updateEvent(currentEditingId, formData);
      showToast('تم تحديث الموعد', 'success');
    } else {
      EventStorage.addEvent(formData);
      showToast('تمت إضافة الموعد', 'success');
    }

    closeAllModals();
    CalendarView.render();
    renderEventsList();
    Notifications.checkUpcomingEvents();
  }

  /**
   * Close all modals
   */
  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
    currentEditingId = null;
  }

  /**
   * Close event modal specifically
   */
  function closeEventModal() {
    closeAllModals();
  }

  /**
   * Convert Gregorian to Hijri
   */
  function convertGtoH() {
    const input = document.getElementById('gDateInput');
    if (!input || !input.value) return;
    const [y, m, d] = input.value.split('-').map(Number);
    const hijri = HijriCalendar.gregorianToHijri(y, m, d);
    const date = new Date(y, m - 1, d);
    const dayName = HijriCalendar.getDayName(date, 'ar');

    const resultEl = document.getElementById('gToHResult');
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="converter-result-divider"></div>
        <div class="converter-result-label">التاريخ الهجري المقابل</div>
        <div class="converter-result-value">${HijriCalendar.toArabicNumerals(hijri.day)} ${HijriCalendar.HIJRI_MONTH_NAMES_AR[hijri.month - 1]} ${HijriCalendar.toArabicNumerals(hijri.year)} هـ</div>
        <div class="converter-result-label" style="margin-top: 0.5rem;">${dayName}</div>
      `;
    }
  }

  /**
   * Convert Hijri to Gregorian
   */
  function convertHtoG() {
    const yInput = document.getElementById('hYearInput');
    const mInput = document.getElementById('hMonthInput');
    const dInput = document.getElementById('hDayInput');
    if (!yInput || !mInput || !dInput) return;

    const hYear = parseInt(yInput.value);
    const hMonth = parseInt(mInput.value);
    const hDay = parseInt(dInput.value);

    if (!hYear || !hMonth || !hDay) return;

    const g = HijriCalendar.hijriToGregorian(hYear, hMonth, hDay);
    const date = new Date(g.year, g.month - 1, g.day);
    const dayName = HijriCalendar.getDayName(date, 'ar');

    const resultEl = document.getElementById('hToGResult');
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="converter-result-divider"></div>
        <div class="converter-result-label">التاريخ الميلادي المقابل</div>
        <div class="converter-result-value">${HijriCalendar.toArabicNumerals(g.day)} ${HijriCalendar.GREGORIAN_MONTH_NAMES_AR[g.month - 1]} ${HijriCalendar.toArabicNumerals(g.year)} م</div>
        <div class="converter-result-label" style="margin-top: 0.5rem;">${dayName}</div>
      `;
    }
  }

  /**
   * Handle ICS export
   */
  function handleExportICS() {
    const events = EventStorage.loadEvents();
    if (events.length === 0) {
      showToast('لا توجد مواعيد للتصدير', 'warning');
      return;
    }
    ICSHandler.downloadICS(events, `moon-calendar-${EventStorage.formatDateISO(new Date())}.ics`);
    showToast(`تم تصدير ${events.length} موعد بصيغة ICS`, 'success');
  }

  /**
   * Handle JSON export
   */
  function handleExportJSON() {
    const events = EventStorage.loadEvents();
    if (events.length === 0) {
      showToast('لا توجد مواعيد للتصدير', 'warning');
      return;
    }
    const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), events }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moon-backup-${EventStorage.formatDateISO(new Date())}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast(`تم تصدير ${events.length} موعد`, 'success');
  }

  /**
   * Handle ICS import
   */
  function handleImportICS(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = ICSHandler.importFromICS(evt.target.result);
        if (imported.length === 0) {
          showToast('لم يتم العثور على مواعيد في الملف', 'warning');
          return;
        }
        // Merge with existing events
        const existing = EventStorage.loadEvents();
        const existingKeys = new Set(existing.map(e => `${e.title}_${e.date}_${e.time}`));
        const newEvents = imported.filter(e => !existingKeys.has(`${e.title}_${e.date}_${e.time}`));
        EventStorage.replaceAllEvents([...existing, ...newEvents]);
        CalendarView.render();
        renderEventsList();
        showToast(`تم استيراد ${newEvents.length} موعد جديد${newEvents.length !== imported.length ? ` (${imported.length - newEvents.length} مكرر)` : ''}`, 'success');
      } catch (err) {
        console.error(err);
        showToast('فشل قراءة الملف. تأكد من صحة صيغته', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  /**
   * Handle JSON import
   */
  function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        const imported = Array.isArray(data) ? data : (data.events || []);
        if (imported.length === 0) {
          showToast('الملف فارغ', 'warning');
          return;
        }
        const existing = EventStorage.loadEvents();
        const existingIds = new Set(existing.map(e => e.id));
        const newEvents = imported.filter(e => !existingIds.has(e.id));
        EventStorage.replaceAllEvents([...existing, ...newEvents]);
        CalendarView.render();
        renderEventsList();
        showToast(`تم استيراد ${newEvents.length} موعد`, 'success');
      } catch (err) {
        showToast('فشل قراءة الملف', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  /**
   * Handle notification toggle
   */
  async function handleNotificationToggle(e) {
    if (e.target.checked) {
      const result = await Notifications.requestPermission();
      if (result.success) {
        settings.notificationsEnabled = true;
        Notifications.startNotificationChecker();
        Notifications.showTestNotification();
        showToast('تم تفعيل الإشعارات بنجاح', 'success');
      } else {
        e.target.checked = false;
        showToast(result.reason || 'فشل تفعيل الإشعارات', 'error');
      }
    } else {
      settings.notificationsEnabled = false;
      Notifications.stopNotificationChecker();
      showToast('تم إيقاف الإشعارات', 'success');
    }
    EventStorage.saveSettings(settings);
    updateNotificationStatus();
  }

  /**
   * Update notification status indicator
   */
  function updateNotificationStatus() {
    const toggle = document.getElementById('enableNotifications');
    if (toggle) toggle.checked = settings.notificationsEnabled;
    const statusEl = document.getElementById('notificationStatus');
    if (statusEl) {
      if (!Notifications.isSupported()) {
        statusEl.textContent = 'المتصفح لا يدعم الإشعارات';
        statusEl.style.color = 'var(--danger-500)';
      } else {
        const perm = Notifications.getPermission();
        if (perm === 'granted') {
          statusEl.textContent = 'الإشعارات مفعّلة ✓';
          statusEl.style.color = 'var(--success-500)';
        } else if (perm === 'denied') {
          statusEl.textContent = 'الإشعارات محظورة من المتصفح - يمكنك تفعيلها من إعدادات المتصفح';
          statusEl.style.color = 'var(--danger-500)';
        } else {
          statusEl.textContent = 'اضغط للتفعيل';
          statusEl.style.color = 'var(--text-3)';
        }
      }
    }
  }

  /**
   * Handle clear all
   */
  function handleClearAll() {
    const count = EventStorage.loadEvents().length;
    if (count === 0) {
      showToast('لا توجد مواعيد للحذف', 'warning');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف جميع المواعيد (${count} موعد)؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      EventStorage.replaceAllEvents([]);
      CalendarView.render();
      renderEventsList();
      showToast('تم حذف جميع المواعيد', 'success');
    }
  }

  /**
   * Setup daily rollover check (clear notified cache at midnight)
   */
  function setupDailyRollover() {
    const checkRollover = () => {
      const today = EventStorage.formatDateISO(new Date());
      const lastDate = localStorage.getItem('moon_last_date');
      if (lastDate !== today) {
        Notifications.clearNotifiedCache();
        localStorage.setItem('moon_last_date', today);
        renderEventsList();
      }
    };
    checkRollover();
    setInterval(checkRollover, 60000); // Check every minute
  }

  /**
   * Show toast notification
   */
  function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type || ''}`;
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    toast.innerHTML = `<span style="font-size: 1.2rem;">${icons[type] || 'ℹ'}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Register service worker
   */
  function registerServiceWorker() {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  }

  // Public API for inline onclick handlers
  window.MoonApp = {
    openEventModal,
    deleteEvent: (id) => {
      if (confirm('حذف الموعد؟')) {
        EventStorage.deleteEvent(id);
        CalendarView.render();
        renderEventsList();
        showToast('تم الحذف', 'success');
      }
    }
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
