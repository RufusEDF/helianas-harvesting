import { loadModules } from "./loadModules.js";

export async function initializeDatabases() {
    const api = game.modules.get("helianas-harvesting").api;

    const { moduleStats, components, craftingRecipes } = await loadModules();

    api.stats = moduleStats;

    Array.from(components).forEach(i => {
        try {
            api.componentDatabase.addItem(i[1]);
        } catch (e) {
            console.warn(`Failed to add component "${i[1]?.name || '[unknown]'}": ${e.message}`);
        }
    });

    Array.from(craftingRecipes).forEach(r => {
        try {
            api.recipeDatabase.addRecipe(r[1]);
        } catch (e) {
            console.warn(`Failed to add recipe "${r[1]?.name || '[unknown]'}": ${e.message}`);
        }
    });
}
;
