import { Config } from "../config.js";

export default class SelectComponentWindow extends Application {
    /**
     * @property {string} componentCreatureType - The creature type of the component, used to filter component names to a manageable list
     * @property {string} componentName - The name of the component, used to find the UUID of the component in the harvesting-component.json
     * @property {string} componentImage - The image of the component
     * @property {string} componentUUID - UUID of the component, see harvesting-component.json
     * @property {Object} selectedComponent - Will hold the selected component object to be returned
     * @property {Function} onSelect - Callback function to be called when a component is selected
     *
     */
    constructor(options = {}) {
        super(options);
        this.componentCreatureType = options.componentCreatureType || "";  // Default to empty string if not provided
        this.componentName = options.componentName || "";  // Default to empty string if not provided
        this.componentImage = options.componentImage || "icons/magic/symbols/question-stone-yellow.webp";  // Default image if not provided
        this.componentUUID = options.componentUUID || "";  // Default to empty string if not provided
        this.selectedComponent = null;  // Will hold the selected component object
        this.onSelect = options.onSelect || (() => {});  // Default to a no-op function if no callback is provided
        console.log("CreateRecipeWindow - recipeDraftafter", this.recipe);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: Config.SelectComponentWindowTemplate,
            classes: ['helianas-harvesting-module'],
            width: 500,
            height: 300,
            resizable: false,
            title: "HelianasHarvest.SelectComponentTitle"
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('#componentCreatureType').on('change', event => {
            const selectedType = event.target.value;
            this.componentCreatureType = selectedType;
            // Update componentNames based on the selected type
            this.componentNames = this.getComponentNamesForType(selectedType);
            this.render();
        });

        html.find('#componentName').on('change', event => {
            const selectedName = event.target.value;
            this.componentName = selectedName;

            // Update componentUUID and componentImage based on the selected name
            const allComponents = game.modules.get('helianas-harvesting').api.componentDatabase.items;
            const selectedComponent = allComponents.find(item => item.name === selectedName);
            if (selectedComponent) {
                this.selectedComponent = selectedComponent;
                this.componentUUID = selectedComponent.id;
                this.componentImage = selectedComponent.img;
            } else {
                console.warn(`Component with name ${selectedName} not found.`);
                this.componentUUID = "${selectedComponent} not found}";
                this.componentImage = "icons/magic/symbols/question-stone-yellow.webp";
            }
            this.render();
        });

        // If the user clicks the "Select" button, return the current component and close the window
        html.find('#select-component-form').on('submit', event => {
            event.preventDefault();
            // call the onSelect callback with the selected component
            if (this.onSelect && this.selectedComponent) {
                this.onSelect(this.selectedComponent);
            }
            // Close the window
            this.close();
        });
    }

    // Helper to get component names for a type
    getComponentNamesForType(type) {
        const allComponents = game.modules.get('helianas-harvesting').api.componentDatabase.items;
        if (!type || !allComponents) {
            return [];
        }
        return allComponents
        .filter(item => item.creatureType === type)
        .map(item => item.name);
    }

    getData() {
        let data = super.getData();
        data.componentCreatureTypes = game.modules.get('helianas-harvesting').api.componentDatabase.creatureTypes;
        data.componentCreatureType = this.componentCreatureType;
        data.componentName = this.componentName;
        data.componentUUID = this.componentUUID;
        data.componentImage = this.componentImage;
        data.componentNames = this.getComponentNamesForType(this.componentCreatureType);
        return data;
    }

}
