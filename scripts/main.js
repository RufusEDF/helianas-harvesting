import { bindStatisticsButton } from "./utils/bindStatisticsButton.js";
import { bindSceneControlButtons } from "./utils/bindSceneControlButtons12.js";
import { initializeDatabases } from "./utils/initializeDatabases.js";
import { setupModuleAPI } from "./utils/setupModuleAPI.js";
import { setupSettings } from "./utils/settings.js";
import { relevantRecipes } from "./utils/relevantRecipes.js";
import { bindCreateCustomRecipeButtons } from "./utils/bindCreateCustomRecipeButtons.js";

Hooks.on("init", setupSettings);

Hooks.on("setup", setupModuleAPI);

Hooks.on("ready", initializeDatabases);

Hooks.on("getSceneControlButtons", bindSceneControlButtons);

//Hooks.on("getHarvestWindowHeaderButtons", bindStatisticsButton);
//Hooks.on("getCraftingWindowHeaderButtons", bindStatisticsButton);
// Using this hook will only show the statistics button in ApplicationV1 windows (eg. HarvestWindow).
Hooks.on("getApplicationHeaderButtons", bindStatisticsButton);

Hooks.on("ready", () => {
    switch (game.settings.get("helianas-harvesting-custom-recipes", "createCustomRecipes")) {
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

console.log("Heliana's Harvesting | Hooks registered.");

Handlebars.registerHelper('ifContains', (string1, string2, options) => {
    return (string1.toLowerCase().includes(string2.toLowerCase())) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifEquals', (string1, string2, options) => {
    return (string1 === string2) ? options.fn(this) : options.inverse(this);
});
