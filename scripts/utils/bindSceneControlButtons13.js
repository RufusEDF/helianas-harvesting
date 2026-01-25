import CraftingWindow from "../windows/CraftingWindow.js";
import HarvestWindow from "../windows/HarvestWindow.js";
import CreateRecipeWindow from "../windows/CreateRecipeWindow.js";

export function bindSceneControlButtons(controls) {
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
}
