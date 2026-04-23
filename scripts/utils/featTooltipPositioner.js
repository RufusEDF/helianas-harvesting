/**
 * Positions `.harvest-feat-tooltip` elements using `position: fixed` so they
 * escape every overflow container (Harvest Window scroll panes, chat sidebar,
 * etc.).  Visibility is still toggled by the existing CSS `:hover` / `:focus`
 * rules — this module only sets `left` and `top` on each show.
 *
 * Uses event delegation on `document.body` so it automatically covers
 * dynamically-created DOM such as chat messages.
 */

const TOOLTIP_GAP = 8; // px between indicator and tooltip

/**
 * Compute and apply viewport-relative position for a feat tooltip.
 * @param {HTMLElement} indicator - The `.harvest-feat-indicator` element.
 */
function positionTooltip(indicator) {
  const tooltip = indicator.querySelector('.harvest-feat-tooltip');
  if (!tooltip) return;

  // Temporarily make tooltip visible (but transparent) so we can measure it.
  // The CSS :hover rule will set display:block almost simultaneously, but we
  // need the dimensions *before* the browser paints.
  const prevDisplay = tooltip.style.display;
  tooltip.style.display = 'block';
  tooltip.style.visibility = 'hidden';

  const indicatorRect = indicator.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  // Preferred position: centred above the indicator
  let left = indicatorRect.left + indicatorRect.width / 2 - tooltipRect.width / 2;
  let top = indicatorRect.top - tooltipRect.height - TOOLTIP_GAP;

  // Clamp horizontally to viewport
  if (left < 4) left = 4;
  if (left + tooltipRect.width > window.innerWidth - 4) {
    left = window.innerWidth - tooltipRect.width - 4;
  }

  // If there isn't enough room above, flip below the indicator
  if (top < 4) {
    top = indicatorRect.bottom + TOOLTIP_GAP;
  }

  // If the tooltip overflows the bottom of the viewport, push it up
  if (top + tooltipRect.height > window.innerHeight - 4) {
    top = window.innerHeight - tooltipRect.height - 4;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.visibility = '';
  tooltip.style.display = prevDisplay; // restore — CSS :hover takes over
}

/**
 * Clear inline positioning so the next hover recalculates fresh coordinates.
 * @param {HTMLElement} indicator - The `.harvest-feat-indicator` element.
 */
function clearTooltipPosition(indicator) {
  const tooltip = indicator.querySelector('.harvest-feat-tooltip');
  if (!tooltip) return;
  tooltip.style.left = '';
  tooltip.style.top = '';
}

/**
 * Register delegated event listeners for feat-indicator tooltips.
 * Call once after the DOM is ready (e.g. in a Foundry `ready` hook).
 */
export function initFeatTooltipPositioning() {
  document.body.addEventListener('mouseenter', (event) => {
    const indicator = event.target.closest('.harvest-feat-indicator');
    if (indicator) positionTooltip(indicator);
  }, true); // useCapture so we fire before the CSS :hover paint

  document.body.addEventListener('mouseleave', (event) => {
    const indicator = event.target.closest('.harvest-feat-indicator');
    if (indicator) clearTooltipPosition(indicator);
  }, true);

  document.body.addEventListener('focusin', (event) => {
    const indicator = event.target.closest('.harvest-feat-indicator');
    if (indicator) positionTooltip(indicator);
  });

  document.body.addEventListener('focusout', (event) => {
    const indicator = event.target.closest('.harvest-feat-indicator');
    if (indicator) clearTooltipPosition(indicator);
  });
}
