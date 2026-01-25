import CraftingWindow from "../windows/CraftingWindow.js";
import HarvestWindow from "../windows/HarvestWindow.js";
import CreateRecipeWindow from "../windows/CreateRecipeWindow.js";

export function bindSceneControlButtons(controls) {
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
}
