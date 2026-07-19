/**
 * moon Calendar - Notifications Module
 * Handles browser notifications for event reminders
 */

(function (global) {
  'use strict';

  let permissionStatus = 'default';
  let checkInterval = null;
  let notifiedEvents = new Set();

  /**
   * Check if notifications are supported
   */
  function isSupported() {
    return 'Notification' in global;
  }

  /**
   * Get current permission status
   */
  function getPermission() {
    if (!isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request permission for notifications
   */
  async function requestPermission() {
    if (!isSupported()) {
      return { success: false, reason: 'المتصفح لا يدعم الإشعارات' };
    }
    if (Notification.permission === 'granted') {
      permissionStatus = 'granted';
      return { success: true, permission: 'granted' };
    }
    try {
      const result = await Notification.requestPermission();
      permissionStatus = result;
      return {
        success: result === 'granted',
        permission: result,
        reason: result === 'denied' ? 'تم رفض إذن الإشعارات' : null
      };
    } catch (err) {
      return { success: false, reason: err.message };
    }
  }

  /**
   * Show a notification
   */
  function showNotification(title, options) {
    if (!isSupported() || Notification.permission !== 'granted') {
      return null;
    }
    const opts = {
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-96.png',
      dir: 'rtl',
      lang: 'ar',
      ...options
    };
    try {
      const notif = new Notification(title, opts);
      notif.onclick = () => {
        global.focus();
        notif.close();
        if (opts.data && opts.data.url) {
          window.location.href = opts.data.url;
        }
      };
      return notif;
    } catch (err) {
      console.error('Notification error:', err);
      return null;
    }
  }

  /**
   * Check for upcoming events and show notifications
   */
  function checkUpcomingEvents() {
    if (!isSupported() || Notification.permission !== 'granted') return;

    const now = new Date();
    const events = EventStorage.getUpcomingEvents();

    events.forEach(evt => {
      if (notifiedEvents.has(evt.id)) return;

      const eventDateTime = new Date(evt.date + 'T' + (evt.time || '09:00'));
      const reminderTime = new Date(eventDateTime.getTime() - (evt.reminder || 30) * 60000);

      // Notify if we're within the reminder window (reminder to event time)
      const timeUntilEvent = eventDateTime - now;
      const timeUntilReminder = reminderTime - now;

      // If reminder time is now (within last minute)
      if (timeUntilReminder <= 0 && timeUntilEvent > -60000) {
        const notifKey = evt.id + '_reminder';
        if (!notifiedEvents.has(notifKey)) {
          notifiedEvents.add(notifKey);
          const mins = evt.reminder || 30;
          const body = evt.allDay
            ? `اليوم: ${evt.title}`
            : `بعد ${mins} دقيقة - ${evt.title}\n${evt.time}`;
          showNotification('تذكير: ' + evt.title, {
            body,
            tag: notifKey,
            requireInteraction: true,
            data: { url: window.location.origin + window.location.pathname + '?event=' + evt.id }
          });
        }
      }

      // If event is happening now (within 5 minutes)
      if (timeUntilEvent <= 0 && timeUntilEvent > -300000) {
        const notifKey = evt.id + '_now';
        if (!notifiedEvents.has(notifKey)) {
          notifiedEvents.add(notifKey);
          showNotification('حان الآن: ' + evt.title, {
            body: evt.description || 'الموعد المحدد',
            tag: notifKey,
            requireInteraction: true
          });
        }
      }

      // Mark as processed
      if (timeUntilEvent < -300000) {
        notifiedEvents.add(evt.id);
      }
    });
  }

  /**
   * Start the notification checker
   * Checks every 30 seconds
   */
  function startNotificationChecker() {
    if (checkInterval) return;
    // Initial check
    checkUpcomingEvents();
    // Periodic check
    checkInterval = setInterval(checkUpcomingEvents, 30000);
  }

  /**
   * Stop the notification checker
   */
  function stopNotificationChecker() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }

  /**
   * Test notification (for setup flow)
   */
  function showTestNotification() {
    return showNotification('moon Calendar', {
      body: 'الإشعارات تعمل بشكل صحيح ✓',
      tag: 'moon_test'
    });
  }

  /**
   * Clear notified cache (useful for new day)
   */
  function clearNotifiedCache() {
    notifiedEvents.clear();
  }

  // Public API
  global.Notifications = {
    isSupported,
    getPermission,
    requestPermission,
    showNotification,
    showTestNotification,
    startNotificationChecker,
    stopNotificationChecker,
    checkUpcomingEvents,
    clearNotifiedCache
  };

})(window);
