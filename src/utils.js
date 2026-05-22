/**
 * Utility functions for S-10 Window Sticker Generator
 */

function log(msg, data) {
  if (typeof console !== 'undefined') {
    if (data) {
      console.log('[S10-Gen]', msg, data);
    } else {
      console.log('[S10-Gen]', msg);
    }
  }
}

/**
 * Format a number as USD currency
 */
function formatUSD(amount) {
  if (typeof amount !== 'number') return '$0';
  return '$' + amount.toLocaleString('en-US');
}

/**
 * Debounce function for input handling
 */
function debounce(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
