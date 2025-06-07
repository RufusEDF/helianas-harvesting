import { Config } from "../config.js";
import SelectComponentWindow from "./SelectComponentWindow.js";


export default class CreateRecipeWindow extends Application {
    /**
     * @param {Object} recipeDraft
     * @property {string} recipeDraft.name - a friendly name for the recipe to make the JSON human readable.  Code logic and the database will only use the name of the compendium item.
     * @property {string} recipeDraft.item - single string or array of strings eg. "Compendium.dnd5e.items.aXsfZvDCdpuv3Yvb"
     * @property {string} itemImage - Use "icons/magic/symbols/question-stone-yellow.webp" if image is undefined or inaccessible
     * @property {string} itemName - Use "Enter a compendium item UUID" if name is undefined or inaccessible
     * @property {string} recipeDraft.rarity - Use "" if rarity is undefined or inaccessible
     * @property {number} recipeDraft.price - Use 0 if price is undefined or inaccessible
     * @property {Object} component - The component object, used to store the component details
     * @property {string} componentCreatureType - The creature type of the component, used to filter components in the harvesting window
     * @property {string} componentName - The name of the component, used to find the UUID of the component in the harvesting-component.json
     * @property {string} componentImage - The image of the component, used to display the component in the harvesting window
     * @property {string} recipeDraft.component - UUID of the component, see harvesting-component.json
     * @property {string} recipeDraft.metatag
     * @property {number} recipeDraft.qty - Use 1 if quantity is undefined or inaccessible
     * @property {string} recipeDraft.variants - currently unsupported
     */
    constructor(itemName = "", itemImage = "", recipeDraft = {}) {
        super();
        this.recipe = {
            name: recipeDraft?.name ?? "",
            item: recipeDraft?.item ?? "",
            rarity: recipeDraft?.rarity ?? "",
            price: recipeDraft?.price ?? 0,
            component: recipeDraft?.component ?? "",
            metatag: recipeDraft?.metatag ?? "",
            qty: recipeDraft?.qty ?? 1,
            variants: recipeDraft?.variants ?? ""
        };
        this.itemName = itemName || "Enter a compendium item UUID";
        this.itemImage = itemImage || "icons/magic/symbols/question-stone-yellow.webp"; // Fallback image if item has no image
        this.componentImage = recipeDraft?.componentImage || "icons/magic/symbols/question-stone-yellow.webp"; // Fallback image if component has no image
        this.componentName = recipeDraft?.componentName || "Select a component"; // Default text if no component is selected

        Object.defineProperty(this, "isExistingRecipe", {
            get: function() {
                const result = game.modules.get('helianas-harvesting').api.recipeDatabase.getRecipeFromItemUuid(this.recipe.item);
                return !!result.recipeFromUUID;
                //return game.modules.get('helianas-harvesting').api.recipeDatabase.getRecipeFromItemUuid(this.recipe.item);
            },
            configurable: true,
            enumerable: true
        });
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: Config.CreateRecipeWindowTemplate,
            classes: ['helianas-harvesting-module'],
            width: 500,
            height: 500,
            resizable: false,
            title: "HelianasHarvest.CreateRecipeTitle"
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('#open-component-selector').on('click', event => {
            event.preventDefault();
            saveFormValues(); // Save all current values

            new SelectComponentWindow({
                onSelect: (component) => {
                    this.recipe.component = component.id;
                    this.componentName = component.name;
                    this.componentImage = component.img;
                    this.render();
                }
            }).render(true);
        });

        // Helper to save all current form values into this.recipe
        const saveFormValues = () => {
            // Get all input/select/textarea fields with a name attribute
            html.find('input[name], select[name], textarea[name]').each((_, el) => {
                const name = el.name;
                // console.log("Saving field:", name, el);
                if (!name) return;
                let value = el.value;
                // Convert number fields
                if (el.type === "number") value = Number(value);
                this.recipe[name] = value;
            });
        };

        html.find('#item').on('change', async event => {
            event.preventDefault();
            saveFormValues(); // Save all current values

            const UUID = event.target.value;
            // console.log("CreateRecipeWindow - 93 UUID = event.target.value", UUID);
            // Update the recipe object
            this.item = UUID;
            // console.log("CreateRecipeWindow - 96 this.item = UUID", this.item);

            // console.log("CreateRecipeWindow - item UUID", this.recipe.item);
            // console.log(fromUuidSync(this.recipe.item))

            // Update itemName and itemImage based on the input UUID
            const item = fromUuidSync(UUID);
            // console.log("CreateRecipeWindow - 103 item = fromUuidSync", item);
            if (item) {
                this.itemName = item.name || "unnamed item";
                this.recipe.name = item.name || "unnamed item";
                this.itemImage = item.img || "icons/magic/symbols/question-stone-yellow.webp"; // Fallback image if item has no image

                try {
                const itemData = await fromUuid(UUID);
                // console.log("CreateRecipeWindow - 111 itemData = fromUuid(UUID)", itemData);
                if (itemData) {
                    console.log("CreateRecipeWindow - itemData", itemData);
                    console.log("CreateRecipeWindow - thhis", this);
                    if (itemData.system?.rarity) {this.recipe.rarity = itemData.system.rarity; };
                    if (itemData.system?.price?.valueInGP) {this.recipe.price = itemData.system.price.valueInGP}
                    if (itemData.system?.quantity) {this.recipe.qty = itemData.system.quantity; }

                    if (this.isExistingRecipe || game.modules.get('helianas-harvesting').api.recipeDatabase.getRecipeFromItemUuid(UUID) ) {
                        // If this is an existing recipe, we can set the component to the existing component
                        const { recipeFromUUID } = game.modules.get('helianas-harvesting').api.recipeDatabase.getRecipeFromItemUuid(UUID);
                        console.log(" recipeFromUUID", recipeFromUUID);
                        const existingRecipe = recipeFromUUID || game.modules.get('helianas-harvesting').api.recipeDatabase.getRecipeFromName(item.name);

                        const componentArr =
                        Array.isArray(existingRecipe.component) ? existingRecipe.component
                        : Array.isArray(existingRecipe.components) ? existingRecipe.components
                        : existingRecipe.component ? [existingRecipe.component]
                        : existingRecipe.components ? [existingRecipe.components]
                        : [];

                        console.log("CreateRecipeWindow - existingRecipe", existingRecipe);

                        if (componentArr.length > 0 && componentArr[0]) {
                            this.recipe.component = componentArr[0].id || componentArr[0];
                            this.componentName = componentArr[0].name || "";
                            this.componentImage = componentArr[0].img || "icons/magic/symbols/question-stone-yellow.webp";
                        } else {
                            console.warn("CreateRecipeWindow - No existing component found for this recipe. Resetting component.");
                            this.recipe.component = "";
                            this.componentName = "";
                            this.componentImage = "icons/magic/symbols/question-stone-yellow.webp";
                        }


                        // if (existingRecipe && existingRecipe.component && existingRecipe.component.length > 0) {
                        //     this.recipe.component = existingRecipe.component[0].id; // Assuming component is an array, take the first one
                        //     this.componentName = existingRecipe.component[0].name;
                        //     this.componentImage = existingRecipe.component[0].img;
                        //     console.log("CreateRecipeWindow - this.recipe.component", this.recipe.component);
                        //     console.log("CreateRecipeWindow - this.componentName", this.componentName);
                        //     console.log("CreateRecipeWindow - this.componentImage", this.componentImage);
                        // } else {
                        //     console.warn("CreateRecipeWindow - No existing component found for this recipe. Resetting component.");
                        //     this.recipe.component = "";
                        //     this.componentName = "";
                        //     this.componentImage = "icons/magic/symbols/question-stone-yellow.webp"; // Fallback image
                        // }
                        if (existingRecipe && existingRecipe.metatag) {
                            console.log("CreateRecipeWindow - existingRecipe.metatag", existingRecipe.metatag);
                            this.recipe.metatag = existingRecipe.metatag;
                        } else {
                            console.warn("CreateRecipeWindow - No existing metatag found for this recipe. Resetting metatag.");
                            this.recipe.metatag = "";
                        }
                        // If this is not an existing recipe, reset the component and metatag

                        //warning if the item is already a recipe
                        ui.notifications.warn("This item is already a recipe.  If you create this recipe, it will overwrite the existing recipe");
                        const el = html.find('input[name="item"]');
                        el.addClass('warn');

                    }
                }
                } catch (error) {
                    console.error("CreateRecipeWindow - Error fetching item data:", error);
                    ui.notifications.error("Error fetching item data. Please check the console for details.");
                }
            } else {
                console.warn(`Item with UUID ${UUID} not found.`);
                ui.notifications.error("Item UUID is not valid. Please enter a valid item UUID.");
                this.itemImage = "icons/magic/symbols/question-stone-yellow.webp"; // Fallback image
            }

            // Re-render to update the select options
            this.render();
        });

        html.find('#component').on('change', event => {
            event.preventDefault();
            saveFormValues(); // Save all current values

            const UUID = event.target.value;
            // Update the recipe object
            this.componentUUID = UUID;

            // Update componentName and componentImage based on the input UUID
            const allComponents = game.modules.get('helianas-harvesting').api.componentDatabase.items;
            const selectedComponent = allComponents.find(item => item.id === UUID);
            if (selectedComponent) {
                this.componentName = selectedComponent.name;
                this.componentImage = selectedComponent.img;
            } else {
                console.warn(`Component with id ${UUID} not found.`);
                ui.notifications.error("Component UUID is not valid. Please select a valid component.");
                this.componentName = "";
                this.componentImage = "icons/magic/symbols/question-stone-yellow.webp";
            }
            // Re-render to update the select options
            this.render();
        });

        html.find('#create-recipe-form').on('submit', async event => {
            const preventReplacement = game.settings.get("helianas-harvesting-custom-recipes", "preventRecipeReplacement");
            event.preventDefault();
            saveFormValues(); // Save all current values

            // Remove previous invalid highlights
            html.find('.invalid').removeClass('invalid');
            html.find('.warn').removeClass('warn');



            // --- Recipe name uniqueness check ---
            //removing as it is not needed.  The recipe name is not used in the database, only the compendium item name is used.
            //const recipeDatabase = game.modules.get('helianas-harvesting').api.recipeDatabase;
            //const nameExists = recipeDatabase._recipes.some(r => r.name === this.recipe.name);
            //console.log("CreateRecipeWindow - recipe name", this.recipe.name);
            //console.log("CreateRecipeWindow - nameExists", nameExists);
            //if (nameExists) {
            //    const el = html.find('input[name="name"]');
            //    el.addClass('invalid');
            //    ui.notifications.warn("A recipe with this name already exists. Please choose a unique name.");
            //    // if
            //    //return;  // Uncomment this line to prevent submission if name is not unique
            //}
            // --- End recipe name uniqueness check ---


            // --- Item UUID validity check ---
            // console.log("CreateRecipeWindow - item UUID", this.recipe.item);
            // console.log(fromUuidSync(this.recipe.item))
            //Add a warning if there is an existing recipe with the same item UUID (as it will overwrite it depending on priorities on module.json)
            if(fromUuidSync(this.recipe.item) === null) {
                const el = html.find('input[name="item"]');
                el.addClass('invalid');
                ui.notifications.error("Item UUID is not valid. Please enter a valid item UUID.");
                return;
            }
            // Check if the item exists in the compendium
            //const item = fromUuidSync(this.recipe.item);

            if (this.isExistingRecipe && preventReplacement) {
                const el = html.find('input[name="item"]');
                el.addClass('warn');
                ui.notifications.warn("A recipe with this item already exists. Please choose a unique item UUID.");
                return;  // Prevent submission if item UUID is not unique
            }
            // --- End item UUID validity check ---

            // --- Component UUID validity check ---
            const allComponents = game.modules.get('helianas-harvesting').api.componentDatabase.items;
            const isComponentValid = allComponents.some(item => item.id === this.recipe.component);
            // console.log("CreateRecipeWindow - isComponentValid", isComponentValid);

            if (!isComponentValid) {
                const el = html.find('input[name="component"]');
                el.addClass('invalid');
                ui.notifications.error("Component UUID is not valid. Please select a valid component.");
                return;
            }
            // --- End component check ---

            // --- Validate required fields ---
            // List of required fields and their selectors
            const requiredFields = [
                { key: "name", selector: 'input[name="name"]' },
                { key: "item", selector: 'input[name="item"]' },
                { key: "rarity", selector: 'select[name="rarity"]' },
                { key: "price", selector: 'input[name="price"]' },
                { key: "component", selector: 'input[name="component"]' }
            ];



            // Collect missing fields
            const missing = requiredFields.filter(field => {
                const value = this.recipe[field.key];
                // Allow 0 for price, but not null/undefined/empty string
                if (field.key === "price") return value === null || value === undefined || value === "";
                return !this.recipe[field.key] || this.recipe[field.key].toString().trim() === "";
            });

            if (missing.length > 0) {
                // Highlight missing fields
                missing.forEach(field => {
                    const el = html.find(field.selector);
                    // console.log("Highlighting invalid field:", field.selector, el);
                    el.addClass('invalid');
                });
                ui.notifications.error("Please fill in all required fields.");
                console.warn("CreateRecipeWindow - Missing required fields in recipe", this.recipe);
                return;
            }
            // -- end validate required fields ---

            // console log the recipe object for debugging
            console.log("CreateRecipeWindow - create-recipe-form submitted with recipe", this.recipe);

            // Create the recipe object in a JSON format stored in a module setting or flag
            // Add a button to export the JSON to clipboard and a downloaded file.
            // Add the recipe to the recipe database
            //let newRecipe = game.modules.get('helianas-harvesting').api.recipeDatabase.addRecipe(this.recipe);
            //console.log("CreateRecipeWindow - newRecipe", newRecipe);

            let customRecipes = [];
            try {
                customRecipes = JSON.parse(game.settings.get("helianas-harvesting-custom-recipes", "customRecipes"));
            } catch (e) {
                console.warn("Could not parse customRecipes setting, resetting to empty array.");
            }
            customRecipes.push(this.recipe);
            let response = await game.settings.set("helianas-harvesting-custom-recipes", "customRecipes", JSON.stringify(customRecipes));
            // console.log("CreateRecipeWindow - customRecipes", customRecipes);
            // console.log("CreateRecipeWindow - response from setting customRecipes", response);


            //recipeDatabase.addRecipe(this.recipe);
            //console.log("CreateRecipeWindow - Recipe added to database", this.recipe);
            ui.notifications.info(`Recipe "${this.recipe.name}" created successfully!  A restart of Foundry is required for the recipe to be available in the crafting window.`);

            // Close the window
            this.close();
        });
    }

    getData() {
        let data = super.getData();
        data.rarityNames = game.system.config.itemRarity;
        data.recipe = this.recipe;
        data.itemImage = this.itemImage || "icons/magic/symbols/question-stone-yellow.webp";
        data.itemName = this.itemName || "Enter a compendium item UUID";
        data.componentImage = this.componentImage || "icons/magic/symbols/question-stone-yellow.webp";
        data.componentName = this.componentName || "Select a component";
        // console.log("CreateRecipeWindow getData - data", data);
        return data;
    }

}


//[{"name":"Acid","item":"Compendium.dnd5e.equipment24.Item.phbagAcid0000000","rarity":"common","price":25,"component":"","componentUUID":"ocvVlUOFfBxY4JB6","metatag":"","qty":1,"variants":"","componentName":"Aberration Flesh","componentImage":"icons/consumables/meat/ribs-glowing-purple.webp"},
//    {"name":"Antitoxin","item":"Compendium.dnd5e.equipment24.Item.phbagAntitoxin00","rarity":"uncommon","price":50,"component":"","componentUUID":"6j0yj0EAdskYL9Xu","metatag":"","qty":1,"variants":"","componentName":"Volatile Mote of Elemental Air","componentImage":"icons/magic/air/air-burst-spiral-blue-gray.webp"},
//    {"name":"Antitoxin","item":"Compendium.dnd5e.equipment24.Item.phbagAntitoxin00","rarity":"common","price":50,"component":"","componentUUID":"ocvVlUOFfBxY4JB6","metatag":"","qty":1,"variants":"","componentName":"Aberration Flesh","componentImage":"icons/consumables/meat/ribs-glowing-purple.webp"}]
