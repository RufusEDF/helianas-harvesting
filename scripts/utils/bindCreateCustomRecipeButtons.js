import CreateRecipeWindow from "../windows/CreateRecipeWindow.js";

export function bindCreateCustomRecipeButtons(controls) {

    async function getCompendiumUUID(packref, itemid){
        let pack = await game.packs.get(packref);
        let index = await pack.getIndex(itemid);
        let uuid = await index.find(i => i._id === itemid).uuid;
        return uuid;
    }

    Hooks.on("getItemSheetHeaderButtons", (app, html, data) => {

        // Check if a recipe already exists with the same name (compendium uuid may differ which may cause bugs)
        let name = app.object.name
        console.log("name", name);
        let packref = app.object.pack
        console.log("packref", packref);
        let id = app.object.id
        console.log("id", id);
        // Get the item from the compendium to get the required properties for the recipe
        let compendiumItem = game.packs.get(packref).find(i => i._id === id);
        if (!compendiumItem) {
            ui.notifications.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
            console.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
            return;
        }


        let recipeDatabase = game.modules.get("helianas-harvesting").api.recipeDatabase
        console.log("recipeDatabase", recipeDatabase);
        let recipeFromName = recipeDatabase._recipes.find(recipe => recipe.name === name);
        console.log("recipeFromName", recipeFromName);


        if (!packref) {return}; // If the item is not from a compendium, we don't need to add a button

        let compendiumUUID = getCompendiumUUID(packref, id)
            .then((uuid) => {
                console.log("1compendiumUUID inside then", uuid);
                let recipeFromUUID, matchType = recipeDatabase.getRecipeFromItemUuid(uuid);
                console.log("3recipeFromUUID", recipeFromUUID);
                console.log("3.5matchType", matchType);

                let label, icon, recipeDraft;

                if (recipeFromUUID) {
                    console.log("4Recipe already exists with same UUID (Create Replacement).");
                    label = "Recipe Exists (${matchType}) (Create Replacement)";
                    icon = "fa-brands fa-hire-a-helper";
                    recipeDraft = recipeFromUUID;
                    console.log("5recipe already exists", recipeDraft);
                } else if (recipeFromName) {
                    console.log("Recipe already exists with the same name but different UUID.");
                    label = "Similar Recipe Exists (Same Name) (Create Duplicate)";
                    icon = "fa-brands fa-hire-a-helper fa-fade";
                    recipeDraft = recipeFromName;
                    console.log("recipe already exists with same name", recipeDraft);
                } else {
                    console.log("No existing recipe found for this item.");
                    label = "Create New Recipe";
                    icon = "fa-brands fa-hackerrank fa-beat-fade";
                    recipeDraft = {
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
                    console.log("no existing recipe found", recipeDraft);
                }

                console.log("building new button", label, icon, recipeDraft);
                let newButton = {
                    label,
                    icon,
                    class: "custom-header-button",
                    onclick: () => {
                        // Open the CreateRecipeWindow with the recipeDraft
                        const crw = new CreateRecipeWindow(name, app.object.img, recipeDraft);
                        console.log("crw", crw);
                        crw.render(true);
                    }
                };
                console.log("newButton", newButton);
                console.log("html before unshift", html);
                html.unshift(newButton);
                console.log("html after unshift", html);
                if (!app._customButtonAdded) {
                    app._customButtonAdded = true;
                    app.render();
                }
            })
            .catch((error) => {
                console.error("Error getting compendium UUID:", error);
                return null;
            });
    });
}


//        let newButton = {
//            label,
//            class: "custom-header-button",
//            icon,
//            onclick: () => {
//                //console.log(game.packs.get(packref));
//                // Get the uuid of the item in the compendium
//                getCompendiumUUID(packref, id)
//                    .then((uuid) => {
//                        console.log("uuid", uuid);
//
//                        //assuming the item has been cached
//                        // Get the item from the compendium to get the required properties for the recipe
//                        let compendiumItem = game.packs.get(packref).find(i => i._id === id);
//                        if (!compendiumItem) {
//                            ui.notifications.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
//                            console.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
//                            return;
//                        }
//
//                        //assuming the item hasn't been cached, otherwise this will need to be awaited
//                        // Get the item from the compendium to get the required properties for the recipe
//                        //await let compendiumItem = game.packs.get(packref).getDocument(id);
//                        //as we have the UUID we can use "await fromUuid(UUID)" instead to remove the caching issue.
//                        console.log("compendiumItem", compendiumItem);
//
//                       //if name and uuid both match we an existing recipe, we can confidently prefill the fields
//                        let recipeFromItemUUID = game.modules.get('helianas-harvesting').api.recipeDatabase.getRecipeFromItemUuid(uuid);
//                        if (recipeFromItemUUID) {
//                            console.log("recipeFromItemUUID", recipeFromItemUUID);
//                            // Open the CreateRecipeWindow with the existing recipe
//                            const crw = new CreateRecipeWindow(name, compendiumItem.img, recipeFromItemUUID);
//                            console.log("crw", crw);
//                            crw.render(true);
//                           return;
//                        }
//
//                        let recipeDraft = {
//                            name: name,
//                            item: uuid,
//                            itemName: name,
//                           rarity: compendiumItem?.system?.rarity ?? "",
//                            price: compendiumItem?.system?.price?.valueInGP ?? 0,
//                            component: "",
//                            metatag: "",
//                            qty: compendiumItem?.system?.quantity ?? 1
//                            //variants: "currently unsupported"
//                        };
//
//                        let itemImage = compendiumItem?.img ?? ""; // Use empty string if img is undefined or inaccessible
//
//                        console.log("recipeDraft", recipeDraft);
//                        // Open the CreateRecipeWindow with the recipeDraft
//                        const crw = new CreateRecipeWindow(name, itemImage, recipeDraft);
//                        console.log("crw", crw);
//                        crw.render(true);
//                    })
//                    .catch((error) => {
//                        console.error("Error getting UUID or the rest", error);
//                    })
//            }
//        };


        // Add the button to the header
//        html.unshift(newButton);
