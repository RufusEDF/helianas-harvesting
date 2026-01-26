import { bindStatisticsButton } from "./utils/bindStatisticsButton.js";
import { initializeDatabases } from "./utils/initializeDatabases.js";
import { setupModuleAPI } from "./utils/setupModuleAPI.js";
import { setupSettings } from "./utils/settings.js";
import { relevantRecipes } from "./utils/relevantRecipes.js";
import { bindCreateCustomRecipeButtons } from "./utils/bindCreateCustomRecipeButtons.js";

Hooks.on("init", setupSettings);

Hooks.on("setup", setupModuleAPI);

Hooks.on("ready", initializeDatabases);

// Conditionally import the correct scene control buttons based on Foundry version
Hooks.once("init", async () => {
    const gameVersion = parseFloat(game.version);
    console.log(`Heliana's Harvesting | Detected Foundry VTT version: ${gameVersion}`);

    let bindSceneControlButtons;
    if (gameVersion >= 13) {
        console.log("Heliana's Harvesting | Loading scene controls for v13+");
        bindSceneControlButtons = (await import("./utils/bindSceneControlButtons13.js")).bindSceneControlButtons;
    } else {
        console.log("Heliana's Harvesting | Loading scene controls for v12");
        bindSceneControlButtons = (await import("./utils/bindSceneControlButtons12.js")).bindSceneControlButtons;
    }

    Hooks.on("getSceneControlButtons", bindSceneControlButtons);
});

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

Handlebars.registerHelper('ifContains', function(string1, string2, options) {
    return (string1.toLowerCase().includes(string2.toLowerCase())) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifEquals', function(string1, string2, options) {
    return (string1 === string2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifThen', (condition, ...args) => {
    // Get the hash from the last argument (options object)
    const options = args[args.length - 1];

    if (condition && options.hash) {
        // Convert hash to attribute string: {class: "highlighted"} → 'class="highlighted"'
        return new Handlebars.SafeString(
            Object.entries(options.hash)
                .map(([key, value]) => `${key}="${value}"`)
                .join(' ')
        );
    }

    return '';
});
