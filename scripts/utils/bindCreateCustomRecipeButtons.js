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
        //console.log("packref", packref);
        if (!packref) {return}; // If the item is not from a compendium, we don't need to add a button


        // Check if a recipe already exists with the same name (compendium uuid may differ which may cause bugs)
        let name = app.object.name
        //console.log("name", name);

        let id = app.object.id
        //console.log("id", id);

        // Get the item from the compendium to get the required properties for the recipe
        let compendiumItem = game.packs.get(packref).find(i => i._id === id);
        if (!compendiumItem) {
            ui.notifications.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
            console.error(`Item with id ${id} not found in pack ${packref}.  This is likely a caching issue.  Please close the item and try again.`);
            return;
        }
        //console.log("compendiumItem", compendiumItem);

        let uuid = `Compendium.${packref}.${id}`;
        //console.log("uuid", uuid);

        let recipeDatabase = game.modules.get("helianas-harvesting").api.recipeDatabase
        //console.log("recipeDatabase", recipeDatabase);
        let { recipeFromUUID, matchType } = recipeDatabase.getRecipeFromItemUuid(uuid);
        //console.log("recipeFromUUID", recipeFromUUID);
        let recipeFromName = recipeDatabase._recipes.find(recipe => recipe.name === name);
        //console.log("recipeFromName", recipeFromName);

        let label, icon, recipeDraft;
        if (recipeFromUUID) {
            label = `Recipe Exists (${matchType}) (Create Replacement)`;
            icon = "fa-brands fa-hire-a-helper";
            recipeDraft = {...recipeFromUUID};
        } else if (recipeFromName) {
            label = "Similar Recipe Exists (Same Name) (Create Replacement)";
            icon = "fa-brands fa-hire-a-helper fa-fade";
            recipeDraft = {...recipeFromName};
            // console.log("recipeDraftBefore", recipeDraft);

            // Use the new compendium item's values with the old recipe's component values
            recipeDraft.name = name; // Will multiple recipes with the same name cause issues?
            // console.log("uuid", uuid);
            // console.log("recipeDraft.itemBefore", recipeDraft.item);
            // console.log("recipeDraft.linkBefore", recipeDraft.link);
            recipeDraft.item = uuid;
            // console.log("recipeDraft.itemAfter", recipeDraft.item);
            recipeDraft.link = uuid;
            // console.log("recipeDraft.linkAfter", recipeDraft.link);
            recipeDraft.itemName = name;
            recipeDraft.rarity = app.object.system?.rarity ?? recipeDraft.rarity;
            recipeDraft.price = app.object.system?.price?.valueInGP ?? recipeDraft.price;
            // Component and metatag should already be on recipeDraft, so no need to change them
            recipeDraft.qty = app.object.system?.quantity ?? recipeDraft.qty;
            // console.log("recipeDraftAfter", recipeDraft);
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

        // console.log("recipeDraft", recipeDraft);
        if(recipeDraft.components && recipeDraft.components.length > 0) {
            recipeDraft.component = recipeDraft.components[0].id; // Use the first component's id if available
            recipeDraft.componentName = recipeDraft.components[0].name;
            recipeDraft.componentImage = recipeDraft.components[0].img;
        }

        if(recipeDraft.link) {
            recipeDraft.item = recipeDraft.link; // Ensure the link is set to the item UUID
        }

        // console.log("icon", icon);
        // console.log("label", label);
        // console.log("recipeDraft", recipeDraft);

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




// let label, icon, recipeDraft;
//     if (recipeFromUUID) {
//         label = "Recipe Exists (Create Replacement)";
//         icon = "fa-brands fa-hire-a-helper";
//         recipeDraft = recipeFromUUID;
//     } else if (recipeFromName) {
//         label = "Similar Recipe Exists (Same Name) (Create Duplicate)";
//         icon = "fa-brands fa-hire-a-helper fa-fade";
//         recipeDraft = recipeFromName;
//     } else {
//         label = "Create New Recipe";
//         icon = "fa-brands fa-hackerrank fa-beat-fade";
//         recipeDraft = {
//             name: name,
//             item: uuid,
//             itemName: name,
//             rarity: app.object.system?.rarity ?? "",
//             price: app.object.system?.price?.valueInGP ?? 0,
//             component: "",
//             metatag: "",
//             qty: app.object.system?.quantity ?? 1
//         };
//     }

//     html.unshift({
//         label,
//         icon,
//         class: "custom-header-button",
//         onclick: () => {
//             const crw = new CreateRecipeWindow(name, app.object.img, recipeDraft);
//             crw.render(true);
//         }
//     });
// });
