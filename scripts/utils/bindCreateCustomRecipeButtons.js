import CreateRecipeWindow from "../windows/CreateRecipeWindow.js";

export function bindCreateCustomRecipeButtons(controls) {

    async function getCompendiumUUID(packref, itemid){
        let pack = await game.packs.get(packref);
        let index = await pack.getIndex(itemid);
        let uuid = await index.find(i => i._id === itemid).uuid;
        return uuid;
    }

    Hooks.on("getItemSheetHeaderButtons", (app, html, data) => {

        let packref = app.object.pack
        if (!packref) {return}; // If the item is not from a compendium, we don't need to add a button


        // Check if a recipe already exists with the same name (compendium uuid may differ which may cause bugs)
        let name = app.object.name

        let id = app.object.id

        // Get the item from the compendium to get the required properties for the recipe
        let compendiumItem = game.packs.get(packref).find(i => i._id === id);
        if (!compendiumItem) {
            ui.notifications.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
            console.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
            return;
        }

        let uuid = `Compendium.${packref}.${id}`;

        let recipeDatabase = game.modules.get("helianas-harvesting").api.recipeDatabase

        let { recipeFromUUID, matchType } = recipeDatabase.getRecipeFromItemUuid(uuid);

        let recipeFromName = recipeDatabase._recipes.find(recipe => recipe.name === name);


        let label, icon, recipeDraft;
        if (recipeFromUUID) {
            label = `Recipe Exists (${matchType}) (Create Replacement)`;
            icon = "fa-brands fa-hire-a-helper";
            recipeDraft = {...recipeFromUUID};
        } else if (recipeFromName) {
            label = "Similar Recipe Exists (Same Name) (Create Replacement)";
            icon = "fa-brands fa-hire-a-helper fa-fade";
            recipeDraft = {...recipeFromName};

            // Use the new compendium item's values with the old recipe's component values
            recipeDraft.name = name; // Will multiple recipes with the same name cause issues?
            recipeDraft.item = uuid;
            recipeDraft.link = uuid;
            recipeDraft.itemName = name;
            recipeDraft.rarity = app.object.system?.rarity ?? recipeDraft.rarity;
            recipeDraft.price = app.object.system?.price?.valueInGP ?? recipeDraft.price;
            // Component and metatag should already be on recipeDraft, so no need to change them
            recipeDraft.qty = app.object.system?.quantity ?? recipeDraft.qty;
        } else {
            label = "Create New Recipe";
            icon = "fa-brands fa-hackerrank fa-beat-fade";
            recipeDraft = {
                name: name,
                item: uuid,
                itemName: name,
                rarity: app.object.system?.rarity ?? "",
                price: app.object.system?.price?.valueInGP ?? 0,
                component: "",
                metatag: "",
                qty: app.object.system?.quantity ?? 1
            };
        }

        if(recipeDraft.components && recipeDraft.components.length > 0) {
            recipeDraft.component = recipeDraft.components[0].id; // Use the first component's id if available
            recipeDraft.componentName = recipeDraft.components[0].name;
            recipeDraft.componentImage = recipeDraft.components[0].img;
        }

        if(recipeDraft.link) {
            recipeDraft.item = recipeDraft.link; // Ensure the link is set to the item UUID
        }

        html.unshift({
            label,
            icon,
            class: "custom-header-button",
            onclick: () => {
                const crw = new CreateRecipeWindow(name, app.object.img, recipeDraft);
                crw.render(true);
            }
        });
    });
}
