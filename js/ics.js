/**
 * moon Calendar - iCalendar (.ics) Import/Export Module
 * Supports RFC 5545 iCalendar format for cross-app compatibility
 */

(function (global) {
  'use strict';

  /**
   * Export events to iCalendar (.ics) format
   * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
   */
  function exportToICS(events) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//moon Calendar//AR//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:moon تقويم',
      'X-WR-CALDESC:تقويم moon الهجري والميلادي',
      'X-WR-TIMEZONE:Asia/Riyadh'
    ];

    const now = formatICSDateTime(new Date());

    events.forEach(evt => {
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + evt.id + '@moon-calendar.app');
      lines.push('DTSTAMP:' + now);
      lines.push('CREATED:' + formatICSDateTime(new Date(evt.createdAt || Date.now())));

      // Date
      if (evt.allDay) {
        const dateStr = evt.date.replace(/-/g, '');
        lines.push('DTSTART;VALUE=DATE:' + dateStr);
        // For all-day events, DTEND is the day AFTER
        const endDate = new Date(evt.date);
        endDate.setDate(endDate.getDate() + 1);
        lines.push('DTEND;VALUE=DATE:' + formatDateISO(endDate).replace(/-/g, ''));
      } else {
        const start = formatICSDateTime(new Date(evt.date + 'T' + evt.time));
        lines.push('DTSTART:' + start);
        // Calculate end time
        const endTime = addMinutes(evt.time, evt.duration || 60);
        const end = formatICSDateTime(new Date(evt.date + 'T' + endTime));
        lines.push('DTEND:' + end);
      }

      lines.push('SUMMARY:' + escapeICSText(evt.title));
      if (evt.description) {
        lines.push('DESCRIPTION:' + escapeICSText(evt.description));
      }
      lines.push('CATEGORIES:' + (evt.category || 'general'));
      lines.push('COLOR:' + (evt.color || '#c9a961'));
      lines.push('STATUS:CONFIRMED');
      lines.push('TRANSP:OPAQUE');

      // Alarm
      if (evt.reminder && evt.reminder > 0 && !evt.allDay) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push('DESCRIPTION:تذكير: ' + escapeICSText(evt.title));
        lines.push('TRIGGER:-PT' + evt.reminder + 'M');
        lines.push('END:VALARM');
      }

      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Import events from iCalendar (.ics) text
   */
  function importFromICS(icsText) {
    const events = [];
    const lines = icsText.split(/\r?\n/);

    let inEvent = false;
    let currentEvent = null;
    let inAlarm = false;
    let currentAlarm = null;

    // Unfold lines (RFC 5545 line continuation)
    const unfolded = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(' ') || lines[i].startsWith('\t')) {
        if (unfolded.length > 0) {
          unfolded[unfolded.length - 1] += lines[i].substr(1);
        }
      } else {
        unfolded.push(lines[i]);
      }
    }

    for (let i = 0; i < unfolded.length; i++) {
      const line = unfolded[i].trim();
      if (!line) continue;

      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {
          title: 'بدون عنوان',
          date: formatDateISO(new Date()),
          time: '09:00',
          duration: 60,
          description: '',
          category: 'imported',
          color: '#c9a961',
          reminder: 30,
          allDay: false
        };
        currentAlarm = null;
        continue;
      }
      if (line === 'END:VEVENT') {
        if (currentEvent) {
          events.push(currentEvent);
        }
        inEvent = false;
        currentEvent = null;
        continue;
      }
      if (line === 'BEGIN:VALARM') {
        inAlarm = true;
        currentAlarm = {};
        continue;
      }
      if (line === 'END:VALARM') {
        if (currentAlarm && currentEvent && currentAlarm.minutes) {
          currentEvent.reminder = currentAlarm.minutes;
        }
        inAlarm = false;
        currentAlarm = null;
        continue;
      }
      if (!inEvent) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const keyPart = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1);
      const keyUpper = keyPart.toUpperCase().split(';')[0];
      const params = keyPart.substring(keyUpper.length);

      if (inAlarm) {
        if (keyUpper === 'TRIGGER') {
          // Parse trigger like -PT30M
          const match = value.match(/-?PT?(\d+)([HMSD])/i);
          if (match) {
            const num = parseInt(match[1]);
            const unit = match[2].toUpperCase();
            let mins = num;
            if (unit === 'H') mins = num * 60;
            else if (unit === 'D') mins = num * 24 * 60;
            else if (unit === 'S') mins = Math.floor(num / 60);
            currentAlarm.minutes = mins;
          }
        }
        continue;
      }

      switch (keyUpper) {
        case 'SUMMARY':
          currentEvent.title = unescapeICSText(value);
          break;
        case 'DESCRIPTION':
          currentEvent.description = unescapeICSText(value);
          break;
        case 'DTSTART':
          if (params.includes('VALUE=DATE')) {
            currentEvent.allDay = true;
            currentEvent.date = parseICSDate(value);
          } else {
            const parsed = parseICSDateTime(value);
            if (parsed) {
              currentEvent.date = parsed.date;
              currentEvent.time = parsed.time;
              currentEvent.allDay = false;
            }
          }
          break;
        case 'DTEND':
          // For timed events, calculate duration
          if (!currentEvent.allDay && params && !params.includes('VALUE=DATE')) {
            const parsed = parseICSDateTime(value);
            if (parsed) {
              const start = new Date(currentEvent.date + 'T' + currentEvent.time);
              const end = new Date(parsed.date + 'T' + parsed.time);
              const diff = Math.round((end - start) / 60000);
              if (diff > 0) currentEvent.duration = diff;
            }
          }
          break;
        case 'CATEGORIES':
          currentEvent.category = value.split(',')[0].trim();
          break;
        case 'COLOR':
          currentEvent.color = value;
          break;
        case 'UID':
          currentEvent._uid = value;
          break;
      }
    }

    return events;
  }

  /**
   * Format Date as iCalendar datetime: YYYYMMDDTHHMMSSZ
   */
  function formatICSDateTime(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}T${h}${min}${s}Z`;
  }

  /**
   * Parse ICS date string YYYYMMDD
   */
  function parseICSDate(str) {
    const m = str.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!m) return formatDateISO(new Date());
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  /**
   * Parse ICS datetime YYYYMMDDTHHMMSSZ
   */
  function parseICSDateTime(str) {
    const m = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (!m) return null;
    return {
      date: `${m[1]}-${m[2]}-${m[3]}`,
      time: `${m[4]}:${m[5]}`
    };
  }

  /**
   * Escape text for ICS
   */
  function escapeICSText(text) {
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  /**
   * Unescape ICS text
   */
  function unescapeICSText(text) {
    return String(text)
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Add minutes to a time string HH:MM
   */
  function addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor((total / 60) % 24);
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Trigger a file download in the browser
   */
  function downloadICS(events, filename) {
    const icsContent = exportToICS(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'moon-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Public API
  global.ICSHandler = {
    exportToICS,
    importFromICS,
    downloadICS
  };

})(window);
