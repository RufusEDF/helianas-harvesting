import { Config } from "../config.js";
import CraftingWindow from "./CraftingWindow.js";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class HeldComponentsWindow extends HandlebarsApplicationMixin(ApplicationV2) {

    /**
     * The column index to sort regular components by.
     * 0 = Name, 1 = Properties, 2 = DC, 3 = Creature Type, 4 = Held
     * @type {number}
     */
    sortBy = 0;

    /**
     * Whether to reverse the sort order. True = descending.
     * @type {boolean}
     */
    reverseSort = false;

    static DEFAULT_OPTIONS = {
        id: "held-components-window",
        classes: ["helianas-harvesting-module", "themed", "theme-light"],
        position: { width: 800, height: 600 },
        window: {
            title: "HelianasHarvest.HeldComponentsWindowTitle",
            minimizable: true,
            maximizable: true,
            resizable: true,
        },
        tag: "div",
        actions: {
            sortBy: HeldComponentsWindow.prototype._onSortBy,
            openFilteredCrafting: HeldComponentsWindow.prototype._onOpenFilteredCrafting
        }
    };

    static PARTS = {
        main: { template: Config.HeldComponentsWindowTemplate }
    };

    /**
     * Checks if a component is an Essence (universal crafting component).
     * @param {object} component
     * @returns {boolean}
     */
    static isEssence(component) {
        return component.name.toLowerCase().includes("essence");
    }

    /**
     * Finds all recipes that use a given component.
     * @param {object} component - The component to search for.
     * @param {object[]} allRecipes - All recipes from the RecipeDatabase.
     * @returns {object[]} Array of recipe objects that use this component.
     */
    static findRecipesForComponent(component, allRecipes) {
        return allRecipes.filter(recipe =>
            recipe.components.some(c => c.id === component.id)
        );
    }

    /**
     * Sorts regular components based on the current sortBy column and reverseSort flag.
     * @param {object[]} components
     * @param {number} sortBy
     * @param {boolean} reverse
     * @returns {object[]}
     */
    static sortComponents(components, sortBy, reverse) {
        const sorted = [...components];

        sorted.sort((a, b) => {
            let result = 0;
            switch (sortBy) {
                case 0: // Name
                    result = a.name.localeCompare(b.name);
                    break;
                case 1: // Properties (sort by number of true properties descending)
                    result = (Number(b.crafting) + Number(b.edible) + Number(b.volatile))
                           - (Number(a.crafting) + Number(a.edible) + Number(a.volatile));
                    break;
                case 2: // DC
                    result = a.dc - b.dc;
                    break;
                case 3: // Creature Type
                    result = a.creatureType.localeCompare(b.creatureType);
                    break;
                case 4: // Held count
                    result = a.held.count - b.held.count;
                    break;
                default:
                    result = a.name.localeCompare(b.name);
            }
            return reverse ? -result : result;
        });

        return sorted;
    }

    async _prepareContext(options) {
        const api = game.modules.get("helianas-harvesting").api;
        const { componentDatabase, recipeDatabase } = api;
        const allRecipes = recipeDatabase._recipes;

        const playerRecipes = game.user.isGM || game.settings.get("helianas-harvesting", "playerRecipes");

        // Get all components that are held by at least one character or party inventory
        const heldComponents = componentDatabase.items.filter(c => c.held && c.held.count > 0);

        // Split into essences and regular components
        const essencesRaw = heldComponents.filter(c => HeldComponentsWindow.isEssence(c));
        const regularRaw = heldComponents.filter(c => !HeldComponentsWindow.isEssence(c));

        // Essences: sorted by DC descending (highest rarity first)
        const essences = [...essencesRaw].sort((a, b) => b.dc - a.dc);

        // Regular components: sorted by current user selection, default alphabetical
        const regularComponents = HeldComponentsWindow.sortComponents(regularRaw, this.sortBy, this.reverseSort);

        // Attach recipe info to each component for tooltip display.
        // We create lightweight wrapper objects so we don't pollute shared component objects.
        // Cap displayed recipes at 15 to prevent enormous tooltips.
        const MAX_TOOLTIP_RECIPES = 15;

        // Essences don't need recipe lookups — they match hundreds of recipes
        // and the tooltip/click-through was removed from the essences table.
        const essenceData = essences.map(c => ({ component: c }));

        const componentData = regularComponents.map(c => {
            const allMatching = HeldComponentsWindow.findRecipesForComponent(c, allRecipes);
            return {
                component: c,
                recipes: allMatching.slice(0, MAX_TOOLTIP_RECIPES),
                recipeCount: allMatching.length,
                hasMoreRecipes: allMatching.length > MAX_TOOLTIP_RECIPES
            };
        });

        return {
            essences: essenceData,
            components: componentData,
            rarityNames: game.system.config.itemRarity,
            sortBy: this.sortBy,
            reverseSort: this.reverseSort,
            playerRecipes: playerRecipes
        };
    }

    /**
     * Handle clicking a sortable column header in the regular components table.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    _onSortBy(event, target) {
        const thead = target.closest("thead");
        if (!thead) return;
        const th = event.target.closest("th");
        if (!th) return;
        const clickedIndex = Array.from(th.parentElement.children).indexOf(th);
        if (clickedIndex === this.sortBy) {
            this.reverseSort = !this.reverseSort;
        } else {
            this.reverseSort = false;
        }
        this.sortBy = clickedIndex;
        this.render();
    }

    /**
     * Handle clicking a component name/img to open crafting window filtered to that component.
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    _onOpenFilteredCrafting(event, target) {
        const componentName = target.dataset.componentName;
        if (!componentName) return;

        const playerRecipes = game.user.isGM || game.settings.get("helianas-harvesting", "playerRecipes");
        if (!playerRecipes) return;

        const { recipeDatabase } = game.modules.get("helianas-harvesting").api;
        const cw = new CraftingWindow(recipeDatabase, componentName);
        cw.render(true);
    }

}
