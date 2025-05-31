import { bindStatisticsButton } from "./utils/bindStatisticsButton.js";
import { loadModules } from "./utils/loadModules.js";
import { bindSceneControlButtons } from "./utils/bindSceneControlButtons.js";
import { initializeDatabases } from "./utils/initializeDatabases.js";
import { setupModuleAPI } from "./utils/setupModuleAPI.js";
import { setupSettings } from "./utils/settings.js";
import { relevantRecipes } from "./utils/relevantRecipes.js";
import { bindCreateCustomRecipeButtons } from "./utils/bindCreateCustomRecipeButtons.js";

Hooks.on("init", setupSettings);

Hooks.on("setup", setupModuleAPI);

Hooks.on("ready", initializeDatabases);

Hooks.on("getSceneControlButtons", bindSceneControlButtons);

Hooks.on("getHarvestWindowHeaderButtons", bindStatisticsButton);
Hooks.on("getCraftingWindowHeaderButtons", bindStatisticsButton);

Hooks.on("ready", () => {
    switch (game.settings.get("helianas-harvesting", "createCustomRecipes")) {
        case "off":
            break;
        case "gm":
            if (game.user.isGM){
                bindCreateCustomRecipeButtons();
            }
            break;
        case "gmp":
            bindCreateCustomRecipeButtons();
            break;
        default:
            break;
    }
});


Hooks.on('renderChatMessage', relevantRecipes);

Handlebars.registerHelper('ifContains', (string1, string2, options) => {
    return (string1.toLowerCase().includes(string2.toLowerCase())) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifEquals', (string1, string2, options) => {
    return (string1 === string2) ? options.fn(this) : options.inverse(this);
});
