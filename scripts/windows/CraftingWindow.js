import { Config } from "../config.js";
import PlayerSelectWindow from "./PlayerSelectWindow.js";
import { RecipeDatabase } from "../RecipeDatabase.js";

export default class CraftingWindow extends Application {
    /**
     *
     * @param {RecipeDatabase} recipeDatabase
     * @param {ActorToken} token
     */
    constructor(recipeDatabase) {
        super();

        this.recipeDatabase = recipeDatabase;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: Config.CraftWindowTemplate,
            classes: ['helianas-harvesting-module'],
            width: 800,
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
     */
    searchText = "";

    /**
     * Filter for components held by characters
     *
     * @type {boolean}
     */
    filterComponentsHeld = false;

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
        data.recipes = this.recipeDatabase
            .searchItems(this.searchText)
            .sort((a, b) => a.name.localeCompare(b.name));
        data.searchText = this.searchText;
        data.characters = game.actors.filter(a => a.type === "character")
        data = this.mapHeldComponents(data);
        data.filterComponentsHeld = this.filterComponentsHeld;
        if(this.filterComponentsHeld){data.recipes = this.filterOutRecipes(data.recipes)};
        return data;
    }

    mapHeldComponents(data) {

        let partyInventory = game.settings.get("party-inventory", 'scratchpad');
        console.log(partyInventory);

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
                // Search for components in the party-inventory module
                // https://github.com/teroparvinen/foundry-party-inventory
                // game.modules.get("party-inventory", 'scratchpad');

                // create a for loop to iterate through the properties of the partyInventory.items object
                // if the item has a source data property then it is likely dragged from an inventory and will have all the necessary data
                // if the item has a sourceData property compare the name of the sourceData.name to the component name
                // if the name includes the component name then add it to the component.held.items array
                for (let order of partyInventory.order) {
                    let item = partyInventory.items[order];
                    if (item.sourceData && item.sourceData.name.toLowerCase().includes(componentLowerCase)) {
                        component.held.items.push(item.sourceData);
                    }
                    else if (item.parent && item.system && item.name.toLowerCase().includes(componentLowerCase)) {
                        component.held.items.push(item);
                    }
                    else if (item.name.toLowerCase().includes(componentLowerCase)) {
                        console.log("manual item", item);
                        item.system = {quantity: 1};  // quantity may not actually be 1, need to look through how party-inventory calculates quantity
                        item.parent = {name: "Party-Inventory"};
                        console.log("manual item additional properties", item);
                        component.held.items.push(item);
                    }
                }


            });
        });
        console.log(data)
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
            event.preventDefault();
            const { itemName, itemLink } = event.currentTarget.dataset;
            await this.send(itemName, itemLink);
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
