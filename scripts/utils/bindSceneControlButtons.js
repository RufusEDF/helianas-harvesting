import CraftingWindow from "../windows/CraftingWindow.js";
import HarvestWindow from "../windows/HarvestWindow.js";
import CreateRecipeWindow from "../windows/CreateRecipeWindow.js";

export function bindSceneControlButtons(controls) {
    //this file is not currently in use.
    //game.version does not seem to be available when this is imported/called. I've opted for manually checking the Foundry version and editing main.js when backward compatibility is needed.
    gameVersion = parseFloat(game.version);
    console.warn("Heliana's Harvesting | Detected Foundry VTT version:", gameVersion);

    if (gameVersion >= 13) {
        console.warn("Heliana's Harvesting | Binding scene control buttons for Foundry VTT version 13 or higher.");

        let actorControl = controls.tokens;
        actorControl.tools['harvest'] = {
            name: "harvest",
            title: "HelianasHarvest.HarvestControl",
            icon: "fa-solid fa-sickle",
            layer: "tokens",
            visible: game.user.isGM || game.settings.get("helianas-harvesting", "playerHarvesting"),
            button: true,
            onChange: () => {
                let token = null;

                if (canvas.tokens.controlled.length)
                    token = canvas.tokens.controlled[0];

                const { componentDatabase } = game.modules.get("helianas-harvesting").api;
                const hw = new HarvestWindow(componentDatabase, token);
                hw.render(true);
            }
        };

        actorControl.tools['craft'] = {
            name: "craft",
            title: "HelianasHarvest.CraftControl",
            icon: "fa-solid fa-hammer-crash",
            layer: "tokens",
            visible: game.user.isGM || game.settings.get("helianas-harvesting", "playerCrafting") || game.settings.get("helianas-harvesting", "playerRecipes"),
            button: true,
            onChange: () => {
                const { recipeDatabase } = game.modules.get("helianas-harvesting").api;

                const cw = new CraftingWindow(recipeDatabase, "", true);
                cw.render(true);
            }
        };

        let createRecipeSetting = game.settings.get("helianas-harvesting-custom-recipes", "createCustomRecipes");
        actorControl.tools['create-recipe'] = {
            name: "create-recipe",
            title: "HelianasHarvest.CreateRecipeControl",
            icon: "fa-brands fa-hackerrank",
            layer: "tokens",
            visible: createRecipeSetting  == "gmp" || (game.user.isGM && createRecipeSetting == "gm"),
            button: true,
            onChange: () => {
                const crw = new CreateRecipeWindow();
                crw.render(true);
            }
        };



    } else if (gameVersion < 13) {
        console.warn("Heliana's Harvesting | Binding scene control buttons for Foundry VTT version 12 or lower.");

        let actorControl = controls.find(c => c.name === "token");
        actorControl.tools.push({
            name: "harvest",
            title: "HelianasHarvest.HarvestControl",
            icon: "fa-solid fa-sickle",
            layer: "tokens",
            visible: game.user.isGM || game.settings.get("helianas-harvesting", "playerHarvesting"),
            button: true,
            onClick: () => {
                let token = null;

                if (canvas.tokens.controlled.length)
                    token = canvas.tokens.controlled[0];

                const { componentDatabase } = game.modules.get("helianas-harvesting").api;
                const hw = new HarvestWindow(componentDatabase, token);
                hw.render(true);
            }
        });

        actorControl.tools.push({
            name: "craft",
            title: "HelianasHarvest.CraftControl",
            icon: "fa-solid fa-hammer-crash",
            layer: "tokens",
            visible: game.user.isGM || game.settings.get("helianas-harvesting", "playerCrafting") || game.settings.get("helianas-harvesting", "playerRecipes"),
            button: true,
            onClick: () => {
                const { recipeDatabase } = game.modules.get("helianas-harvesting").api;

                const cw = new CraftingWindow(recipeDatabase, "", true);
                cw.render(true);
            }
        });

        let createRecipeSetting = game.settings.get("helianas-harvesting-custom-recipes", "createCustomRecipes");
        actorControl.tools.push({
            name: "create-recipe",
            title: "HelianasHarvest.CreateRecipeControl",
            icon: "fa-brands fa-hackerrank",
            layer: "tokens",
            visible: createRecipeSetting  == "gmp" || (game.user.isGM && createRecipeSetting == "gm"),
            button: true,
            onClick: () => {
                const crw = new CreateRecipeWindow();
                crw.render(true);
            }
        });

    } else {
        console.error("Heliana's Harvesting | Unable to determine Foundry VTT version. Scene control buttons will not be bound.");
    }
}
