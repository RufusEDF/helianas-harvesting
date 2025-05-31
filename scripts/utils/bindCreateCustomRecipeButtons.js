import CreateRecipeWindow from "../windows/CreateRecipeWindow.js";

export function bindCreateCustomRecipeButtons(controls) {

    async function getCompendiumUUID(packref, itemid){
        let pack = await game.packs.get(packref);
        let index = await pack.getIndex(itemid);
        let uuid = await index.find(i => i._id === itemid).uuid;
        return uuid;
        }

    Hooks.on("getItemSheetHeaderButtons", (app, html, data) => {
        console.log("getItemSheetHeaderButtons", app, html, data);
        // Check if a recipe already exists
        let name = app.object.name
        let packref = app.object.pack
        let id = app.object.id
        let recipeDatabase = game.modules.get("helianas-harvesting").api.recipeDatabase
        let recipe = recipeDatabase._recipes.find(recipe => recipe.name === name);
        console.log("recipe", recipe);

        let newButton = null


        if (!packref) {
            console.log("Item is not a compendium item");
            return;
        }else if (recipe) {
            // if it does, add a button which does nothing or opens the recipe
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
                            console.log("compendiumItem", compendiumItem);

                            let recipeDraft = {
                                name: name,  // recipe name (must be unique)
                                item: uuid,  // single string or array of strings eg. "Compendium.dnd5e.items.aXsfZvDCdpuv3Yvb"
                                rarity: compendiumItem?.system?.rarity ?? "", // Use "" if rarity is undefined or inaccessible
                                price: compendiumItem?.system?.price?.valueInGP ?? 0, // Use 0 if price is undefined or inaccessible
                                component: "", // UUID of the component, see harvesting-component.json
                                metatag: "",
                                qty: compendiumItem?.system?.quantity ?? 1 // Use 1 if quantity is undefined or inaccessible
                                //variants: "currently unsupported"
                            }

                            console.log("recipeDraft", recipeDraft);
                            // Open the CreateRecipeWindow with the recipeDraft
                            const crw = new CreateRecipeWindow(recipeDraft);
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

// Recipes need the following properties:
// - recipe name (must be unique)
// - item (UUID of the item)
// - rarity (string)
// - price (number)
// - component (UUID of the component)
// - metatag (string)

// Optional properties:
// - qty (number, default 1)
// - variants (array of objects with item, price, rarity, metatag)


//    [{
//        "name": "Amulet of Health",
//        "item": "Compendium.dnd5e.items.iiQxTvDOhPGW5spF",
//        "rarity": "rare",
//        "price": 7000,
//        "component": "0bibGJfScx8Kh2Wv",
//        "metatag": "Mammoth"
//    },
//    {
//        "name": "+1 Ammunition",
//        "item": [
//            "Compendium.dnd5e.items.tEWhsb2lYF4uvF0z",
//            "Compendium.dnd5e.items.ZjUOHSyND2VFXQeP",
//            "Compendium.dnd5e.items.NYIib9KEYDUFe9GY"
//        ],
//        "rarity": "uncommon",
//        "qty": 10,
//        "price": 25,
//       "component": "EmhhpOFAHtZEO3hb"
//    },
//    {
//        "name": "Belt of Giant Strength",
//        "component": "2ugxh5VDYE9BSQyn",
//        "variants": [
//            {
//                "item": "Compendium.dnd5e.items.bq9YKwEHLQ7p7ric",
//                "price": 24000,
//                "rarity": "veryRare",
//                "metatag": "Fire"
//            },
//            {
//                "item": "Compendium.dnd5e.items.ORKf6RRcalrdD6Qp",
//                "price": 16000,
//                "rarity": "veryRare",
//                "metatag": "Frost"
//            }]]
//
