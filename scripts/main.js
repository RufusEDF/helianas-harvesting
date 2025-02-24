import { bindStatisticsButton } from "./utils/bindStatisticsButton.js";
import { loadModules } from "./utils/loadModules.js";
import { bindSceneControlButtons } from "./utils/bindSceneControlButtons.js";
import { initializeDatabases } from "./utils/initializeDatabases.js";
import { setupModuleAPI } from "./utils/setupModuleAPI.js";

Hooks.on("setup", setupModuleAPI);

Hooks.on("ready", initializeDatabases);

Hooks.on("getSceneControlButtons", bindSceneControlButtons);

Hooks.on("getHarvestWindowHeaderButtons", bindStatisticsButton);
Hooks.on("getCraftingWindowHeaderButtons", bindStatisticsButton);

Handlebars.registerHelper('ifContains', (string1, string2, options) => {
    return (string1.includes(string2)) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifEquals', (string1, string2, options) => {
    return (string1 === string2) ? options.fn(this) : options.inverse(this);
});
