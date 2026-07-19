/**
 * moon Calendar - Event Storage Module
 * Handles persistence of events in localStorage
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'moon_calendar_events_v1';
  const SETTINGS_KEY = 'moon_calendar_settings_v1';

  /**
   * Load events from localStorage
   */
  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const events = JSON.parse(raw);
      return Array.isArray(events) ? events : [];
    } catch (err) {
      console.error('Failed to load events:', err);
      return [];
    }
  }

  /**
   * Save events to localStorage
   */
  function saveEvents(events) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      return true;
    } catch (err) {
      console.error('Failed to save events:', err);
      return false;
    }
  }

  /**
   * Add a new event
   */
  function addEvent(eventData) {
    const events = loadEvents();
    const event = {
      id: generateId(),
      title: eventData.title || 'بدون عنوان',
      date: eventData.date, // YYYY-MM-DD
      time: eventData.time || '09:00',
      duration: eventData.duration || 60, // minutes
      description: eventData.description || '',
      category: eventData.category || 'general',
      color: eventData.color || '#c9a961',
      reminder: eventData.reminder !== undefined ? eventData.reminder : 30, // minutes before
      allDay: eventData.allDay || false,
      recurring: eventData.recurring || 'none', // none, daily, weekly, monthly, yearly
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    events.push(event);
    saveEvents(events);
    return event;
  }

  /**
   * Update an existing event
   */
  function updateEvent(id, updates) {
    const events = loadEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...updates, updatedAt: Date.now() };
    saveEvents(events);
    return events[idx];
  }

  /**
   * Delete an event
   */
  function deleteEvent(id) {
    const events = loadEvents();
    const filtered = events.filter(e => e.id !== id);
    saveEvents(filtered);
    return events.length !== filtered.length;
  }

  /**
   * Get an event by ID
   */
  function getEvent(id) {
    return loadEvents().find(e => e.id === id) || null;
  }

  /**
   * Get events for a specific date
   */
  function getEventsForDate(dateStr) {
    return loadEvents().filter(e => e.date === dateStr);
  }

  /**
   * Get events for a date range (inclusive)
   */
  function getEventsInRange(startDate, endDate) {
    const events = loadEvents();
    return events.filter(e => e.date >= startDate && e.date <= endDate);
  }

  /**
   * Get all upcoming events (today and future)
   */
  function getUpcomingEvents(limit) {
    const today = formatDateISO(new Date());
    const events = loadEvents()
      .filter(e => e.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Get all past events
   */
  function getPastEvents(limit) {
    const today = formatDateISO(new Date());
    const events = loadEvents()
      .filter(e => e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Replace all events (used by import)
   */
  function replaceAllEvents(events) {
    saveEvents(events);
  }

  /**
   * Load settings
   */
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return getDefaultSettings();
      return { ...getDefaultSettings(), ...JSON.parse(raw) };
    } catch (err) {
      return getDefaultSettings();
    }
  }

  /**
   * Save settings
   */
  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      return false;
    }
  }

  function getDefaultSettings() {
    return {
      notificationsEnabled: false,
      defaultReminder: 30,
      primaryCalendar: 'hijri', // 'hijri' or 'gregorian'
      language: 'ar',
      startWeek: 'saturday', // 'saturday' or 'sunday'
      theme: 'classic' // 'classic' (reserved for future themes)
    };
  }

  /**
   * Generate a unique ID
   */
  function generateId() {
    return 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Format a Date as YYYY-MM-DD
   */
  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Public API
  global.EventStorage = {
    loadEvents,
    saveEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    getEventsForDate,
    getEventsInRange,
    getUpcomingEvents,
    getPastEvents,
    replaceAllEvents,
    loadSettings,
    saveSettings,
    formatDateISO
  };

})(window);
