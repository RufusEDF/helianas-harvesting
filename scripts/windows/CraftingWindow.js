import { Config } from "../config.js";
import PlayerSelectWindow from "./PlayerSelectWindow.js";
import { RecipeDatabase } from "../RecipeDatabase.js";
import getPartyInventoryItems from "../utils/partyInventorySupport.js";

export default class CraftingWindow extends Application {
    /**
     *
     * @param {RecipeDatabase} recipeDatabase
     * @param {ActorToken} token
     * @param {string} searchText
     */
    constructor(recipeDatabase, searchText = "") {
        super();

        this.recipeDatabase = recipeDatabase;
        this.searchText = searchText
    }

    static get defaultOptions() {
        try {
            let widthsetting = game.settings.get("helianas-harvesting", "craftingWindowWidth");
            if (widthsetting > 0 && widthsetting < 10000) {
                var width = widthsetting;
            }
        } catch (error) {
            let width = 800;
        }

        return foundry.utils.mergeObject(super.defaultOptions, {
            template: Config.CraftWindowTemplate,
            classes: ['helianas-harvesting-module'],
            width: width,
            height: 600,
            resizable: true,
            title: "HelianasHarvest.CraftWindowTitle"
        });
    }

    /**
     * Recipe Database
     *
     * @type {RecipeDatabase}
     */
    recipeDatabase = null;

    /**
     * Search Text Field
     * (This has been moved to the class constructor to allow the search text to be passed in from other functions)
     */
    //searchText = "";

    /**
     * Filter for components held by characters
     *
     * @type {boolean}
     */
    filterComponentsHeld = false;

    /**
     * Game settings used to determine if the held components column should be shown
     * @type {boolean}
     *
     */
    showHeldComponents = game.settings.get("helianas-harvesting", "heldComponents");

    #activeElementId = false;
    #cursorPosition = { start: 0, end: 0 };
    #debounceSchedule = false;

    updateForm(newValues) {
        if (typeof newValues.searchText === "string") {
            this.searchText = newValues.searchText;
        }
        if (typeof newValues.filterComponentsHeld === "boolean") {
            this.filterComponentsHeld = newValues.filterComponentsHeld;
        }
        if (this.rendered) this.render();
    }

    getData() {
        let data = super.getData();
        data.rarityNames = game.system.config.itemRarity;
        data.displaySearchBar = game.user.isGM || game.settings.get("helianas-harvesting", "playerRecipes");

        data.recipes = this.recipeDatabase
            .searchItems(this.searchText)
            .sort((a, b) => a.name.localeCompare(b.name));
        data.searchText = this.searchText;
        data.characters = game.actors.filter(a => a.type === "character")
        if(game.settings.get("helianas-harvesting", "heldComponents")){data = this.mapHeldComponents(data);}
        data.filterComponentsHeld = this.filterComponentsHeld;
        data.showHeldComponents = this.showHeldComponents;
        if(this.filterComponentsHeld){data.recipes = this.filterOutRecipes(data.recipes)};
        return data;
    }

    mapHeldComponents(data){
        let partyInventory = {items: {}, order: []};
        if(game.settings.get("helianas-harvesting", "heldComponents") && game.settings.get("helianas-harvesting", "partyInventorySupport")){
            partyInventory = getPartyInventoryItems();
        }

        //Is this logic best here or in ComponentDatabase.js?
        data.recipes.forEach(recipe => {
            recipe.components.forEach(component => {
                let componentLowerCase = component.name.toLowerCase()
                component.held = {
                    items : [],
                    get count() {
                        let quantity = 0;
                        this.items.forEach(item => {quantity += item.system.quantity});
                        return quantity;
                    }
                };
                data.characters.forEach(character => {
                    component.held.items = component.held.items.concat(character.items.filter(item =>
                        item.name.toLowerCase().includes(componentLowerCase)));
                });
                if(game.settings.get("helianas-harvesting", "heldComponents") && game.settings.get("helianas-harvesting", "partyInventorySupport")){
                    // create a for loop to iterate through the properties of the partyInventory.items object
                    // if the name includes the component name then add it to the component.held.items array

                    for (let order of partyInventory.order) {
                        let item = partyInventory.items[order];
                        try {
                            if (item.name.toLowerCase().includes(componentLowerCase)){
                                component.held.items.push(item);
                            }
                        } catch (error) {
                            console.error("Issue checking item error", error);
                            console.warn("Issue checking item", item);
                        }
                    }
                }


            });
        });
        return data;
    }

    filterOutRecipes(recipes) {
        return recipes.filter(recipe => {
            return recipe.components.every(component => component.held.count > 0);
        });
    }

    // Define the logic for activating listeners in the rendered HTML
    activateListeners(html) {
        super.activateListeners(html);

        if (this.#activeElementId) {
            const element = html.find(`#${this.#activeElementId}`);
            if (element) {
                element.focus();
                element.each((_, element) => {
                    element.setSelectionRange(this.#cursorPosition.start, this.#cursorPosition.end);
                });
            }
        }

        // filter toggle
        const filterToggle = html.find('#filterComponentsHeld');
        filterToggle.on('click', event => {
            this.updateForm({ filterComponentsHeld: !this.filterComponentsHeld });
        });

        // Numeric and text inputs
        const managedInputs = html.find('.managed-input');
        managedInputs.on('focus blur', event => {
            if (event.type === "blur") {
                this.#activeElementId = null;
                this.#cursorPosition = { start: 0, end: 0 }; // Reset cursor position when focus is lost
            }
            else if (event.type === "focus") {
                this.#activeElementId = event.currentTarget.getAttribute('id');
                // Save the current cursor position
                this.#cursorPosition = {
                    start: event.currentTarget.selectionStart,
                    end: event.currentTarget.selectionEnd
                };
            }
        });
        managedInputs.on('input change', event => {
            if (event.type === "input") {
                this.#activeElementId = event.currentTarget.getAttribute('id');
                // Save the current cursor position
                this.#cursorPosition = {
                    start: event.currentTarget.selectionStart,
                    end: event.currentTarget.selectionEnd
                };

                if (this.#debounceSchedule) {
                    clearTimeout(this.#debounceSchedule);
                }
                this.#debounceSchedule = setTimeout(updateForm.bind(this), 500);
            }
            else {
                updateForm.bind(this)();
            }

            function updateForm() {
                const input = {};
                input[event.target.dataset.binding] = event.target.value;
                this.updateForm(input);
            }
        });

        const itemLinks = html.find(".recipe-item-name");
        itemLinks.on("click", async (event) => {
            // Check if the user has permission to craft.
            if (!game.user.isGM && !game.settings.get("helianas-harvesting", "playerCrafting")) {
                ui.notifications.info(game.i18n.format("HelianasHarvest.Settings.PlayerCrafting.Denied"));
                return;
            }
            else {
                event.preventDefault();
                const { itemName, itemLink } = event.currentTarget.dataset;
                await this.send(itemName, itemLink);
            }
        });
    }

    async send(itemName, itemLink) {
        const psw = new PlayerSelectWindow(`Select a player to send ${itemName}`);
        const playerSelect = await psw.selectPlayer();
        const actor = game.actors.get(playerSelect);
        const craftedItem = await fromUuid(itemLink);
        if (actor && craftedItem) {
            const recipe = this.recipeDatabase.getRecipeFromName(itemName);
            const createdItems = await actor.createEmbeddedDocuments("Item", [craftedItem]);
            const updates = [{
                "_id": createdItems[0].id,
                "name": recipe.name,
                "system.quantity": recipe.qty,
                "system.rarity": recipe.rarity,
                "system.price": { value: recipe.price, denomination: 'gp' }
            }];
            await actor.updateEmbeddedDocuments("Item", updates);

            this.sendChatMessage(game.i18n.format("HelianasHarvest.CraftingCreatedItemNotice", { actorName: actor.name, itemName: craftedItem.name }));
        }
    }

    sendChatMessage(message) {
        let chatMessage = {
            user: game.userId,
            speaker: ChatMessage.getSpeaker(),
            content: message
        };

        ChatMessage.create(chatMessage);
    }
}
