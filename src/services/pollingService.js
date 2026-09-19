/**
 * PashuRakshak — Real-Time DB Polling Service
 *
 * Polls for new animal_cases every POLL_INTERVAL ms.
 * Subscribers receive { newCases, allCases } whenever new entries are detected.
 *
 * Usage:
 *   import { startPolling, stopPolling, subscribe, unsubscribe } from './pollingService';
 *   const unsub = subscribe((evt) => console.log(evt.newCases));
 *   startPolling();
 *   // on cleanup:
 *   stopPolling(); unsub();
 */

import { getAnimalCases } from '../db/client.js';

const POLL_INTERVAL = 3000; // 3 seconds

let _timerId = null;
let _lastKnownIds = new Set(); // Set of case IDs we've already seen
let _initialized = false;
let _subscribers = [];

/**
 * Subscribe to new-case events.
 * @param {function} fn - called with { newCases: Case[], allCases: Case[] }
 * @returns {function} unsubscribe function
 */
export function subscribe(fn) {
  _subscribers.push(fn);
  return () => unsubscribe(fn);
}

export function unsubscribe(fn) {
  _subscribers = _subscribers.filter((s) => s !== fn);
}

function _emit(payload) {
  _subscribers.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.warn('[PollingService] Subscriber error:', err);
    }
  });
}

async function _poll() {
  try {
    const allCases = await getAnimalCases();

    if (!_initialized) {
      // First run — just establish the baseline, don't emit
      _lastKnownIds = new Set(allCases.map((c) => String(c.id)));
      _initialized = true;
      return;
    }

    // Find genuinely new cases (IDs we haven't seen before)
    const newCases = allCases.filter((c) => !_lastKnownIds.has(String(c.id)));

    if (newCases.length > 0) {
      // Update the known set
      newCases.forEach((c) => _lastKnownIds.add(String(c.id)));
      _emit({ newCases, allCases });
    }
  } catch (err) {
    // Silent — DB errors should not crash the app
    console.warn('[PollingService] Poll error:', err.message);
  }
}

/**
 * Start the background polling loop.
 * Safe to call multiple times — won't create duplicate timers.
 */
export function startPolling() {
  if (_timerId !== null) return; // already running
  // Run immediately on start, then on interval
  _poll();
  _timerId = setInterval(_poll, POLL_INTERVAL);
}

/**
 * Stop the background polling loop and reset state.
 */
export function stopPolling() {
  if (_timerId !== null) {
    clearInterval(_timerId);
    _timerId = null;
  }
  _initialized = false;
  _lastKnownIds = new Set();
}

/**
 * Reset polling state (e.g. when user re-mounts Overview).
 * Keeps subscribers intact but forces re-initialization on next poll.
 */
export function resetPolling() {
  _initialized = false;
  _lastKnownIds = new Set();
}
