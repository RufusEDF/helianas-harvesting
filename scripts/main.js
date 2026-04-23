import { bindStatisticsButton } from "./utils/bindStatisticsButton.js";
import { initializeDatabases } from "./utils/initializeDatabases.js";
import { setupModuleAPI } from "./utils/setupModuleAPI.js";
import { setupSettings } from "./utils/settings.js";
import { relevantRecipes } from "./utils/relevantRecipes.js";
import { bindCreateCustomRecipeButtons } from "./utils/bindCreateCustomRecipeButtons.js";
import { initFeatTooltipPositioning } from "./utils/featTooltipPositioner.js";

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

Hooks.once('ready', initFeatTooltipPositioning);
