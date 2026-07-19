/**
 * moon Calendar - Calendar Rendering Module
 * Renders the monthly calendar grid with Hijri + Gregorian dates
 */

(function (global) {
  'use strict';

  let currentView = 'hijri'; // 'hijri' or 'gregorian'
  let currentDate = new Date();
  let currentHijriYear = 0;
  let currentHijriMonth = 0;
  let selectedDate = null;
  let onDayClickCallback = null;
  let onMonthChangeCallback = null;

  /**
   * Initialize calendar with starting date and view type
   */
  function init(date, view, dayClickCb, monthChangeCb) {
    currentDate = date || new Date();
    currentView = view || 'hijri';
    onDayClickCallback = dayClickCb;
    onMonthChangeCallback = monthChangeCb;

    const todayHijri = HijriCalendar.gregorianToHijri(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    );
    currentHijriYear = todayHijri.year;
    currentHijriMonth = todayHijri.month;
  }

  /**
   * Set the calendar view (hijri or gregorian primary)
   */
  function setView(view) {
    currentView = view;
    render();
  }

  /**
   * Navigate to previous month
   */
  function prevMonth() {
    if (currentView === 'hijri') {
      currentHijriMonth--;
      if (currentHijriMonth < 1) {
        currentHijriMonth = 12;
        currentHijriYear--;
      }
    } else {
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    render();
    if (onMonthChangeCallback) onMonthChangeCallback();
  }

  /**
   * Navigate to next month
   */
  function nextMonth() {
    if (currentView === 'hijri') {
      currentHijriMonth++;
      if (currentHijriMonth > 12) {
        currentHijriMonth = 1;
        currentHijriYear++;
      }
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    render();
    if (onMonthChangeCallback) onMonthChangeCallback();
  }

  /**
   * Go to today
   */
  function goToToday() {
    currentDate = new Date();
    const todayHijri = HijriCalendar.gregorianToHijri(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    );
    currentHijriYear = todayHijri.year;
    currentHijriMonth = todayHijri.month;
    selectedDate = EventStorage.formatDateISO(currentDate);
    render();
    if (onMonthChangeCallback) onMonthChangeCallback();
  }

  /**
   * Get current displayed month's info
   */
  function getCurrentMonthInfo() {
    if (currentView === 'hijri') {
      return {
        year: currentHijriYear,
        month: currentHijriMonth,
        monthLength: HijriCalendar.hijriMonthLength(currentHijriYear, currentHijriMonth)
      };
    } else {
      return {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        monthLength: HijriCalendar.gregorianMonthLength(currentDate.getFullYear(), currentDate.getMonth() + 1)
      };
    }
  }

  /**
   * Get the start date (Gregorian) of the current displayed month
   */
  function getCurrentMonthStart() {
    if (currentView === 'hijri') {
      const startHijri = { year: currentHijriYear, month: currentHijriMonth, day: 1 };
      const startGreg = HijriCalendar.hijriToGregorian(startHijri.year, startHijri.month, startHijri.day);
      return new Date(startGreg.year, startGreg.month - 1, startGreg.day);
    }
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }

  /**
   * Get the current selected date
   */
  function getSelectedDate() {
    return selectedDate;
  }

  /**
   * Set the selected date
   */
  function setSelectedDate(dateStr) {
    selectedDate = dateStr;
    render();
  }

  /**
   * Render the calendar grid
   */
  function render(containerEl) {
    if (!containerEl) containerEl = document.getElementById('calendarGrid');
    if (!containerEl) return;

    const startDate = getCurrentMonthStart();
    const monthInfo = getCurrentMonthInfo();
    const today = new Date();
    const todayStr = EventStorage.formatDateISO(today);

    // Determine first day of week (Saturday for Arab region)
    let firstDay = startDate.getDay(); // 0=Sun, 6=Sat
    // Shift to make Saturday = 0
    const offset = (firstDay - 6 + 7) % 7;

    // Build HTML
    let html = '<div class="weekdays">';
    const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    dayNames.forEach((name, i) => {
      const isWeekend = (i === 0 || i === 6); // Friday (6) and Saturday (0) in Arab convention
      html += `<div class="weekday ${isWeekend ? 'weekend' : ''}">${name}</div>`;
    });
    html += '</div>';

    html += '<div class="days-grid">';

    // Previous month days (greyed out)
    const prevDate = new Date(startDate);
    prevDate.setDate(prevDate.getDate() - offset);
    for (let i = 0; i < offset; i++) {
      const d = new Date(prevDate);
      d.setDate(d.getDate() + i);
      const dateStr = EventStorage.formatDateISO(d);
      const hijri = HijriCalendar.gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
      html += renderDayCell(d, hijri, dateStr, true, false, todayStr);
    }

    // Current month days
    const daysInMonth = monthInfo.monthLength;
    for (let day = 1; day <= daysInMonth; day++) {
      let gYear, gMonth, gDay;
      if (currentView === 'hijri') {
        const g = HijriCalendar.hijriToGregorian(currentHijriYear, currentHijriMonth, day);
        gYear = g.year; gMonth = g.month; gDay = g.day;
      } else {
        gYear = currentDate.getFullYear();
        gMonth = currentDate.getMonth() + 1;
        gDay = day;
      }
      const d = new Date(gYear, gMonth - 1, gDay);
      const dateStr = EventStorage.formatDateISO(d);
      const hijri = currentView === 'hijri'
        ? { year: currentHijriYear, month: currentHijriMonth, day }
        : HijriCalendar.gregorianToHijri(gYear, gMonth, gDay);
      html += renderDayCell(d, hijri, dateStr, false, true, todayStr);
    }

    // Next month days to fill the grid (6 rows * 7 = 42 cells max)
    const totalCells = offset + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    const lastDate = new Date(startDate);
    lastDate.setDate(lastDate.getDate() + offset + daysInMonth - 1);
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      const dateStr = EventStorage.formatDateISO(d);
      const hijri = HijriCalendar.gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
      html += renderDayCell(d, hijri, dateStr, true, false, todayStr);
    }

    html += '</div>';
    containerEl.innerHTML = html;

    // Update month label
    updateMonthLabel();

    // Attach click handlers
    containerEl.querySelectorAll('.day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.dataset.date;
        if (date && onDayClickCallback) {
          onDayClickCallback(date);
        }
      });
    });
  }

  /**
   * Render a single day cell
   */
  function renderDayCell(date, hijri, dateStr, isOutside, isCurrentMonth, todayStr) {
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const dayOfWeek = date.getDay();
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6); // Friday or Saturday
    const events = EventStorage.getEventsForDate(dateStr);
    const hasEvents = events.length > 0;

    let classes = ['day-cell'];
    if (isOutside) classes.push('outside');
    if (isToday) classes.push('today');
    if (isSelected) classes.push('selected');
    if (isWeekend) classes.push('weekend');
    if (hasEvents) classes.push('has-events');

    const dayName = HijriCalendar.getDayName(date, 'ar');
    const hijriLabel = `${hijri.day}`;
    const gregLabel = HijriCalendar.toArabicNumerals(date.getDate());

    let eventsHtml = '';
    if (hasEvents && isCurrentMonth) {
      eventsHtml = '<div class="day-events">';
      const maxDots = 3;
      for (let i = 0; i < Math.min(events.length, maxDots); i++) {
        const color = events[i].color || '#c9a961';
        eventsHtml += `<span class="event-dot" style="background:${color}"></span>`;
      }
      if (events.length > maxDots) {
        eventsHtml += `<span class="event-dot more">+${events.length - maxDots}</span>`;
      }
      eventsHtml += '</div>';
    }

    return `
      <div class="${classes.join(' ')}" data-date="${dateStr}">
        <div class="day-cell-numbers">
          <div class="day-hijri">${hijriLabel}</div>
          <div class="day-gregorian">${gregLabel}</div>
        </div>
        ${eventsHtml}
        <div class="day-name">${dayName}</div>
      </div>
    `;
  }

  /**
   * Update the month label
   */
  function updateMonthLabel() {
    const labelEl = document.getElementById('monthLabel');
    const subLabelEl = document.getElementById('subMonthLabel');
    if (!labelEl) return;

    if (currentView === 'hijri') {
      const monthName = HijriCalendar.HIJRI_MONTH_NAMES_AR[currentHijriMonth - 1];
      labelEl.textContent = `${monthName} ${HijriCalendar.toArabicNumerals(currentHijriYear)} هـ`;

      // Show corresponding Gregorian
      const startG = HijriCalendar.hijriToGregorian(currentHijriYear, currentHijriMonth, 1);
      const monthDays = HijriCalendar.hijriMonthLength(currentHijriYear, currentHijriMonth);
      const endG = HijriCalendar.hijriToGregorian(currentHijriYear, currentHijriMonth, Math.min(monthDays, 28));
      if (subLabelEl) {
        const m1 = HijriCalendar.GREGORIAN_MONTH_NAMES_AR[startG.month - 1];
        const m2 = HijriCalendar.GREGORIAN_MONTH_NAMES_AR[endG.month - 1];
        const mText = startG.month === endG.month ? m1 : `${m1} - ${m2}`;
        subLabelEl.textContent = `${mText} ${HijriCalendar.toArabicNumerals(startG.year)} م`;
      }
    } else {
      const monthName = HijriCalendar.GREGORIAN_MONTH_NAMES_AR[currentDate.getMonth()];
      labelEl.textContent = `${monthName} ${HijriCalendar.toArabicNumerals(currentDate.getFullYear())} م`;

      // Show corresponding Hijri
      if (subLabelEl) {
        const h1 = HijriCalendar.gregorianToHijri(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const h2 = HijriCalendar.gregorianToHijri(currentDate.getFullYear(), currentDate.getMonth() + 1,
                                                  HijriCalendar.gregorianMonthLength(currentDate.getFullYear(), currentDate.getMonth() + 1));
        const hm1 = HijriCalendar.HIJRI_MONTH_NAMES_AR[h1.month - 1];
        const hm2 = HijriCalendar.HIJRI_MONTH_NAMES_AR[h2.month - 1];
        const hText = h1.month === h2.month ? hm1 : `${hm1} - ${hm2}`;
        subLabelEl.textContent = `${hText} ${HijriCalendar.toArabicNumerals(h1.year)} هـ`;
      }
    }
  }

  // Public API
  global.CalendarView = {
    init,
    setView,
    prevMonth,
    nextMonth,
    goToToday,
    getCurrentMonthInfo,
    getCurrentMonthStart,
    getSelectedDate,
    setSelectedDate,
    render
  };

})(window);
