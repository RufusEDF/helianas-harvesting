import { Config } from "../config.js";
import PlayerSelectWindow from "./PlayerSelectWindow.js";
import { RecipeDatabase } from "../RecipeDatabase.js";
import getPartyInventoryItems from "../utils/partyInventorySupport.js";
import HeldComponentsWindow from "./HeldComponentsWindow.js";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class CraftingWindow extends HandlebarsApplicationMixin(ApplicationV2) {
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
    searchText = "";

    /**
     * The column to sort by
     * @type {Number}
     *
     */
    sortBy = 0;

    /**
     * Whether to sort ascending or descending. True is descending.
     * @type {Boolean}
     */
    reverseSort = false;

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
    #listenerAbort;

    /**
     *
     * @param {RecipeDatabase} recipeDatabase
     * @param {ActorToken} token
     * @param {string} searchText
     */
    constructor(recipeDatabase, searchText = "", matchAll = false) {
        super();

        this.recipeDatabase = recipeDatabase;
        this.searchText = searchText
        this.matchAll = matchAll; // Default to false
    }

    static DEFAULT_OPTIONS = {
        id: "crafting-window",
        classes: ["helianas-harvesting-module", "themed", "theme-light"],
        get position() {
            let width = 800; // Default width
            try {
                const widthSetting = game.settings.get("helianas-harvesting", "craftingWindowWidth");
                if (widthSetting > 0 && widthSetting < 10000) {
                    width = widthSetting;
                }
            } catch (error) {
                console.warn("Error retrieving crafting window width setting, using default:", error);
            }
            return { width: width, height: 600 };
        },
        window: {
            title: "HelianasHarvest.CraftWindowTitle",
            resize: true,
            minimizable: true,
            maximizable: true,
            get controls(){
                if (game.settings.get("helianas-harvesting", "heldComponents")){
                    return [{
                        icon: "fas fa-sync",
                        label: "HelianasHarvest.ResetHeldComponentsButton",
                        action: "resetHeldComponents"
                    },
                    {
                        icon: "fas fa-suitcase",
                        label: "HelianasHarvest.ViewHeldComponentsButton",
                        action: "viewHeldComponents"
                    }];
                }
                return [];
            }
        },
        tag: "div",
        actions: {
            openRecipe: CraftingWindow.prototype._onOpenRecipe,
            toggleFilterComponentsHeld: CraftingWindow.prototype._onToggleFilterComponentsHeld,
            toggleSearchLogic: CraftingWindow.prototype._onToggleSearchLogic,
            sortBy: CraftingWindow.prototype._onSortBy,
            resetHeldComponents: CraftingWindow.prototype._onResetHeldComponents,
            viewHeldComponents: CraftingWindow.prototype._onOpenHeldComponentsWindow
        }
    };

    static PARTS = {
        main: { template: Config.CraftWindowTemplate }
    };

    updateForm(newValues) {
        if (typeof newValues.searchText === "string") {
            this.searchText = newValues.searchText;
        }
        if (typeof newValues.filterComponentsHeld === "boolean") {
            this.filterComponentsHeld = newValues.filterComponentsHeld;
        }
        if (typeof newValues.matchAll === "boolean") {
            this.matchAll = newValues.matchAll;
        }
        if (typeof newValues.sortBy === "number") {
            this.sortBy = newValues.sortBy;
        }
        if (typeof newValues.reverseSort === "boolean") {
            this.reverseSort = newValues.reverseSort;
        }
        if (this.rendered) this.render();
    }

    async _prepareContext(options) {
        //let data = await super._prepareContext(options);

        let displaySearchBar = game.user.isGM || game.settings.get("helianas-harvesting", "playerRecipes");

        if (!displaySearchBar) {
            this.matchAll = false; // If the search bar is not displayed, matchAll should be false
        }

        let recipes = this.recipeDatabase
            .searchItems(this.searchText, this.matchAll)
            .sort((a, b) => a.name.localeCompare(b.name));

        //if(game.settings.get("helianas-harvesting", "heldComponents")){recipes = this.mapHeldComponents(recipes);}

        if(this.filterComponentsHeld){recipes = this.filterOutRecipes(recipes)};
        recipes = this.sortRecipes(recipes, this.sortBy);

        return {
            rarityNames: game.system.config.itemRarity,
            recipes: recipes,
            searchText: this.searchText,
            filterComponentsHeld: this.filterComponentsHeld,
            showHeldComponents: this.showHeldComponents,
            displaySearchBar: displaySearchBar,
            matchAll: this.matchAll,
            reverseSort: this.reverseSort,
            sortBy: this.sortBy
        };
    }

    sortRecipes(recipes, sortBy) {
        switch (sortBy) {
            case 0: // Name
                recipes.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 1: // Rarity
                //lets ensure the rarity is in the correct order, from common to legendary.  all rarirties are in this.rarityNames
                let rarityOrder = Object.keys(game.system.config.itemRarity);
                recipes.sort((a, b) => {
                    let aIndex = rarityOrder.indexOf(a.rarity) !== -1 ? rarityOrder.indexOf(a.rarity) : rarityOrder.length;
                    let bIndex = rarityOrder.indexOf(b.rarity) !== -1 ? rarityOrder.indexOf(b.rarity) : rarityOrder.length;
                    return aIndex - bIndex;
                });
                //recipes.sort((a, b) => (a.rarity || "").localeCompare(b.rarity || ""));
                break;
            case 2: // Price
                recipes.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 3: // Metatag
                recipes.sort((a, b) => (a.metatag || "").localeCompare(b.metatag || ""));
                break;
            case 4: // First Component Name
                recipes.sort((a, b) => {
                    const aComp = a.components[0]?.name || "";
                    const bComp = b.components[0]?.name || "";
                    return aComp.localeCompare(bComp);
                });
                break;
            default:
                //console.warn("Returning without sorting due to unknown sortBy value:", sortBy);
                return recipes;
        }

        if (this.reverseSort) {
            recipes.reverse();
        }

        return recipes;
    }

    // mapHeldComponents(recipes){
    //     let characters = game.actors.filter(a => a.type === "character");

    //     let partyInventory = {items: {}, order: []};
    //     if(game.settings.get("helianas-harvesting", "heldComponents") && game.settings.get("helianas-harvesting", "partyInventorySupport")){
    //         partyInventory = getPartyInventoryItems();
    //     }

    //     //Is this logic best here or in ComponentDatabase.js?
    //     recipes.forEach(recipe => {
    //         let metatagLowerCase = recipe.metatag ? recipe.metatag.toLowerCase() : null;

    //         // Initialize array to track metatag matches per component on THIS recipe
    //         recipe.componentMetatagMatches = [];

    //         recipe.components.forEach((component, index) => {

    //             // Idea was to Only initialize component.held if it doesn't already exist (shared across recipes)
    //             //However, seems to not be the case making the new reset button redundant.
    //             if (!component.held) {
    //                 console.warn(`!component.held for component: ${component.name}`);
    //                 // component.held = {
    //                 //     items : [],
    //                 //     get count() {
    //                 //         let quantity = 0;
    //                 //         this.items.forEach(item => {quantity += item.system.quantity});
    //                 //         return quantity;
    //                 //     }
    //                 // };

    //                 // let componentLowerCase = component.name.toLowerCase()

    //                 // Collect items from all characters
    //                 // characters.forEach(character => {
    //                 //     component.held.items = component.held.items.concat(character.items.filter(item =>
    //                 //         item.name.toLowerCase().includes(componentLowerCase)));
    //                 // });

    //                 // Collect items from party inventory
    //                 // if(game.settings.get("helianas-harvesting", "heldComponents") && game.settings.get("helianas-harvesting", "partyInventorySupport")){
    //                 //     for (let order of partyInventory.order) {
    //                 //         let item = partyInventory.items[order];
    //                 //         try {
    //                 //             if (item.name.toLowerCase().includes(componentLowerCase)){
    //                 //                 component.held.items.push(item);
    //                 //             }
    //                 //         } catch (error) {
    //                 //             console.error("Issue checking item error", error);
    //                 //             console.warn("Issue checking item", item);
    //                 //         }
    //                 //     }
    //                 // }
    //             }

    //             // Check if any held item matches THIS RECIPE's metatag
    //             let matchesMetatag = false;
    //             if (metatagLowerCase) {
    //                 for (let item of component.held.items) {
    //                     if (item.name.toLowerCase().includes(metatagLowerCase)) {
    //                         matchesMetatag = true;
    //                         break;
    //                     }
    //                 }
    //             }

    //             // Store the result in the recipe's array
    //             recipe.componentMetatagMatches[index] = matchesMetatag;

    //         });
    //     });
    //     return recipes;
    // }

    filterOutRecipes(recipes) {
        return recipes.filter(recipe => {
            return recipe.components.every(component => component.held.count > 0);
        });
    }

    // Define the logic for activating listeners in the rendered HTML
    // Event Listeners
    _onFocusManaged(event, target) {
        this.#activeElementId = target.id;
        this.#cursorPosition = {
            start: target.selectionStart,
            end: target.selectionEnd
        };
    }

    _onBlurManaged(event, target) {
        this.#activeElementId = null;
        this.#cursorPosition = { start: 0, end: 0 };
    }

    _onInputManaged(event, target) {
        this.#activeElementId = target.id;
        this.#cursorPosition = {
            start: target.selectionStart,
            end: target.selectionEnd
        };

        if (this.#debounceSchedule) clearTimeout(this.#debounceSchedule);
        this.#debounceSchedule = setTimeout(() => this.#updateForm(target), 500);
    }

    _onChangeManaged(event, target) {
        this.#updateForm(target);
    }

    #updateForm(target) {
        const input = {};
        input[target.dataset.binding] = target.value;
        this.updateForm(input);
    }

    async _onOpenRecipe(event, target) {
        // Check if the user has permission to craft.
        if (!game.user.isGM && !game.settings.get("helianas-harvesting", "playerCrafting")) {
            ui.notifications.info(game.i18n.format("HelianasHarvest.Settings.PlayerCrafting.Denied"));
            return;
        }
        else {
            event.preventDefault();
            const { itemName, itemLink } = target.dataset;
            await this.send(itemName, itemLink);
        }
    }

    _onToggleFilterComponentsHeld(event, target) {
        this.updateForm({ filterComponentsHeld: !this.filterComponentsHeld });
    }

    _onToggleSearchLogic(event, target) {
        this.updateForm({ matchAll: !this.matchAll });
    }

    _onSortBy(event, target) {
        let clickedIndex = event.target.cellIndex;
        if(this.sortBy === clickedIndex){
            this.updateForm({ reverseSort: !this.reverseSort });
        }
        this.updateForm({ sortBy: clickedIndex });
        //this.updateForm({ sortBy: event.target.cellIndex });
    }

    _onResetHeldComponents(){
        console.log("Resetting held components in crafting window");
        game.modules.get("helianas-harvesting").api.componentDatabase.resetMappedHeldComponents();
        this.render();
    }

    _onOpenHeldComponentsWindow(){
        const hcw = new HeldComponentsWindow();
        hcw.render(true);
    }

    _onRender(ctx, opts) {
        // restore cursor

        //console.log(this.element);
        //console.log(ctx, opts);
        //console.log(this.#activeElementId);
        //console.log(this.#cursorPosition);

        if (this.#activeElementId) {
            const el = this.element.querySelector(`#${this.#activeElementId}`);
            if (el) {
                el.focus();
                el.setSelectionRange?.(this.#cursorPosition.start, this.#cursorPosition.end);
            }
        }

        // re-wire listeners safely each render
        this.#listenerAbort?.abort();
        this.#listenerAbort = new AbortController();
        const { signal } = this.#listenerAbort;

        this.element.querySelectorAll('#recipe-search').forEach(el => {
            el.addEventListener('focus', e => this._onFocusManaged(e, e.currentTarget), { signal });
            //el.addEventListener('blur', e => this._onBlurManaged(e, e.currentTarget), { signal });
            el.addEventListener('input', e => this._onInputManaged(e, e.currentTarget), { signal });
            el.addEventListener('change', e => this._onChangeManaged(e, e.currentTarget), { signal });
        });
    }

    close(options) {
        // ensure timers/listeners don’t leak
        this.#listenerAbort?.abort();
        if (this.#debounceSchedule) clearTimeout(this.#debounceSchedule);
        // clear any cached held component data to ensure it’s fresh next time
        game.modules.get("helianas-harvesting").api.componentDatabase.resetMappedHeldComponents();
        return super.close(options);
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
