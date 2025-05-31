import { Config } from "../config.js";
import { ComponentDatabase } from "../ComponentDatabase.js";
import SelectComponentWindow from "./SelectComponentWindow.js";

export default class CreateRecipeWindow extends Application {
    /**
     * @param {Object} recipeDraft
     * @property {string} recipeDraft.name - recipe name (must be unique)
     * @property {string} recipeDraft.item - single string or array of strings eg. "Compendium.dnd5e.items.aXsfZvDCdpuv3Yvb"
     * @property {string} recipeDraft.rarity - Use "legendary" if rarity is undefined or inaccessible
     * @property {number} recipeDraft.price - Use 0 if price is undefined or inaccessible
     * @property {Object} recipeDraft.component - The component object, used to store the component details
     * @property {string} recipeDraft.componentCreatureType - The creature type of the component, used to filter components in the harvesting window
     * @property {string} recipeDraft.componentName - The name of the component, used to find the UUID of the component in the harvesting-component.json
     * @property {string} recipeDraft.componentImage - The image of the component, used to display the component in the harvesting window
     * @property {string} recipeDraft.componentUUID - UUID of the component, see harvesting-component.json
     * @property {string} recipeDraft.metatag
     * @property {number} recipeDraft.qty - Use 1 if quantity is undefined or inaccessible
     * @property {string} recipeDraft.variants - currently unsupported
     */
    constructor(recipeDraft = {}) {
        console.log("CreateRecipeWindow - recipeDraftbefore", recipeDraft);
        super();
        this.recipe = {
            name: recipeDraft?.name ?? "",
            item: recipeDraft?.item ?? "",
            rarity: recipeDraft?.rarity ?? "",
            price: recipeDraft?.price ?? 0,
            component: recipeDraft?.component ?? {},
            //componentCreatureType: recipeDraft?.componentCreatureType ?? "",
            //componentName: recipeDraft?.componentName ?? "",
            //componentImage: recipeDraft?.componentImage ?? "icons/magic/symbols/question-stone-yellow.webp",
            componentUUID: recipeDraft?.componentUUID ?? "",
            metatag: recipeDraft?.metatag ?? "",
            qty: recipeDraft?.qty ?? 1,
            variants: recipeDraft?.variants ?? ""
        };
        console.log("CreateRecipeWindow - recipeDraftafter", this.recipe);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: Config.CreateRecipeWindowTemplate,
            classes: ['helianas-harvesting-module'],
            width: 500,
            height: 450,
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
                    this.recipe.componentUUID = component.id;
                    this.recipe.componentName = component.name;
                    this.recipe.componentImage = component.img;
                    this.render();
                }
            }).render(true);
        });

        // Helper to save all current form values into this.recipe
        const saveFormValues = () => {
            // Get all input/select/textarea fields with a name attribute
            html.find('input[name], select[name], textarea[name]').each((_, el) => {
                const name = el.name;
                console.log("Saving field:", name, el);
                if (!name) return;
                let value = el.value;
                // Convert number fields
                if (el.type === "number") value = Number(value);
                this.recipe[name] = value;
            });
        };

        html.find('#componentUUID').on('change', event => {
            event.preventDefault();
            saveFormValues(); // Save all current values

            const UUID = event.target.value;
            // Update the recipe object
            this.recipe.componentUUID = UUID;

            // Update componentName and componentImage based on the input UUID
            const allComponents = game.modules.get('helianas-harvesting').api.componentDatabase.items;
            const selectedComponent = allComponents.find(item => item.id === UUID);
            if (selectedComponent) {
                this.recipe.componentName = selectedComponent.name;
                this.recipe.componentImage = selectedComponent.img;
            } else {
                console.warn(`Component with id ${UUID} not found.`);
                ui.notifications.error("Component UUID is not valid. Please select a valid component.");
                this.recipe.componentName = "";
                this.recipe.componentImage = "icons/magic/symbols/question-stone-yellow.webp";
            }
            // Re-render to update the select options
            this.render();
        });

        html.find('#create-recipe-form').on('submit', event => {
            event.preventDefault();
            saveFormValues(); // Save all current values

            // Remove previous invalid highlights
            html.find('.invalid').removeClass('invalid');



            // --- Recipe name uniqueness check ---
            const recipeDatabase = game.modules.get('helianas-harvesting').api.recipeDatabase;
            const nameExists = recipeDatabase._recipes.some(r => r.name === this.recipe.name);
            console.log("CreateRecipeWindow - recipe name", this.recipe.name);
            console.log("CreateRecipeWindow - nameExists", nameExists);
            if (nameExists) {
                const el = html.find('input[name="name"]');
                el.addClass('invalid');
                ui.notifications.error("A recipe with this name already exists. Please choose a unique name.");
                return;
            }
            // --- End recipe name uniqueness check ---

            // --- Component UUID validity check ---
            const allComponents = game.modules.get('helianas-harvesting').api.componentDatabase.items;
            const isComponentValid = allComponents.some(item => item.id === this.recipe.componentUUID);

            if (!isComponentValid) {
                const el = html.find('input[name="componentUUID"]');
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
                { key: "componentUUID", selector: 'input[name="componentUUID"]' }
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
                    console.log("Highlighting invalid field:", field.selector, el);
                    el.addClass('invalid');
                });
                ui.notifications.error("Please fill in all required fields.");
                console.warn("CreateRecipeWindow - Missing required fields in recipe", this.recipe);
                return;
            }
            // -- end validate required fields ---

            // console log the recipe object for debugging
            console.log("CreateRecipeWindow - create-recipe-form submitted with recipe", this.recipe);

            // Close the window
            this.close();
        });
    }

    getData() {
        let data = super.getData();
        data.rarityNames = game.system.config.itemRarity;
        data.recipe = this.recipe;
        console.log("CreateRecipeWindow getData - data", data);
        return data;
    }

}
