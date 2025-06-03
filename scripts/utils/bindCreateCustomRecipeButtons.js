import CreateRecipeWindow from "../windows/CreateRecipeWindow.js";

export function bindCreateCustomRecipeButtons(controls) {

    async function getCompendiumUUID(packref, itemid){
        let pack = await game.packs.get(packref);
        let index = await pack.getIndex(itemid);
        let uuid = await index.find(i => i._id === itemid).uuid;
        return uuid;
    }

    Hooks.on("getItemSheetHeaderButtons", (app, html, data) => {
        // Check if a recipe already exists
        let name = app.object.name
        let packref = app.object.pack
        let id = app.object.id
        let recipeDatabase = game.modules.get("helianas-harvesting").api.recipeDatabase
        let recipe = recipeDatabase._recipes.find(recipe => recipe.name === name);

        let newButton = null


        if (!packref) {
            //console.log("Item is not a compendium item");
            return;
        }else if (recipe) {
            // if it does, add a button which does nothing.
            newButton = {
            label: "Recipe Exists",
            class: "custom-header-button",
            icon: "fa-brands fa-hire-a-helper",
                onclick: () => {
                    console.log("Recipe already exists for this item:", recipe);
                }
            };
        } else {
            // if it doesn't, add a button which creates a recipe
            newButton = {
            label: "Create Recipe",
            class: "custom-header-button",
            //icon: "fa-brands fa-hire-a-helper",
            icon: "fa-brands fa-hackerrank fa-beat-fade",
                onclick: () => {
                    //console.log(game.packs.get(packref));
                    // Get the uuid of the item in the compendium
                    getCompendiumUUID(packref, id)
                        .then((uuid) => {
                            console.log("uuid", uuid);

                            //assuming the item has been cached
                            // Get the item from the compendium to get the required properties for the recipe
                            let compendiumItem = game.packs.get(packref).find(i => i._id === id);
                            if (!compendiumItem) {
                                ui.notifications.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
                                console.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
                                return;
                            }

                            //assuming the item hasn't been cached, otherwise this will need to be awaited
                            // Get the item from the compendium to get the required properties for the recipe
                            //await let compendiumItem = game.packs.get(packref).getDocument(id);
                            //as we have the UUID we can use "await fromUuid(UUID)" instead.
                            console.log("compendiumItem", compendiumItem);

                            let recipeDraft = {
                                name: name,
                                item: uuid,
                                itemName: name,
                                rarity: compendiumItem?.system?.rarity ?? "",
                                price: compendiumItem?.system?.price?.valueInGP ?? 0,
                                component: "",
                                metatag: "",
                                qty: compendiumItem?.system?.quantity ?? 1
                                //variants: "currently unsupported"
                            };

                            let itemImage = compendiumItem?.img ?? ""; // Use empty string if img is undefined or inaccessible

                            console.log("recipeDraft", recipeDraft);
                            // Open the CreateRecipeWindow with the recipeDraft
                            const crw = new CreateRecipeWindow(name, itemImage, recipeDraft);
                            console.log("crw", crw);
                            crw.render(true);
                        })
                        .catch((error) => {
                            console.error("Error getting UUID or the rest", error);
                        })
                }
            }
        };
        // Add the button to the header
        html.unshift(newButton);
    });
}
