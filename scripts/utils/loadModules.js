import { findHarvestingCompatibleModules } from "./findHarvestingCompatibleModules.js";
import { loadCompatibleModule } from "./loadCompatibleModule.js";

export async function loadModules() {
    const moduleStats = [];
    const craftingRecipes = new Map();
    const components = new Map();

    const modulesToLoad = findHarvestingCompatibleModules();
    console.log("Found the following modules to load:", modulesToLoad);

    // --- Add a "virtual module" for custom recipes stored in settings ---
    const customRecipesSetting = game.settings.get("helianas-harvesting-custom-recipes", "customRecipes");
    let customRecipes = [];
    try {
        customRecipes = JSON.parse(customRecipesSetting);
    } catch (e) {
        console.warn("Could not parse customRecipes setting, skipping.");
    }
    if (customRecipes.length > 0) {
        modulesToLoad.push({
            id: "helianas-harvesting-custom-recipes-setting",
            title: "Custom Recipes (World Setting)",
            settings: {
                recipes: customRecipes,
                components: []
            },
            priority: game.settings.get("helianas-harvesting-custom-recipes", "customRecipesPriority") || -50
        });
    }
    // --- End virtual module addition ---

    for (const module of modulesToLoad) {
        const results = await loadCompatibleModule(module, components, craftingRecipes);
        moduleStats.push(results);
    }
    return { moduleStats, components, craftingRecipes };
}
