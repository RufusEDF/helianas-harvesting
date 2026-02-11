import CraftingWindow from "../windows/CraftingWindow.js";
import HarvestWindow from "../windows/HarvestWindow.js";
import StatisticsWindow from "../windows/StatisticsWindow.js";

/**
 * Bind the statistics button to Application v1 window headers.
 *
 * HarvestWindow and CraftingWindow have been upgraded to ApplicationV2 and
 * define their own statistics controls via `window.controls` in DEFAULT_OPTIONS.
 * The getApplicationHeaderButtons hook does not fire for ApplicationV2 windows,
 * so this function is now deprecated.  It is retained in case future Application v1
 * windows need the statistics button.
 */
export function bindStatisticsButton(window, buttons) {
    if (window instanceof HarvestWindow || window instanceof CraftingWindow) {
        buttons.unshift({
            label: 'HelianasHarvest.StatisticsLabel',
            class: 'stats',
            onclick: () => {
                const sw = new StatisticsWindow();
                sw.render(true);
            }
        });
    }
}
