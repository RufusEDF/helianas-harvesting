export class RecipeDatabase {
    _recipes = [];
    _cb = null;

    constructor(componentDatabase) {
        this._cb = componentDatabase;
    }

    addRecipe(recipe) {
        const fields = ["name", "source", "item", "mod", "price", "rarity", "qty", "metatag", "component", "variants", "includeBasePrice", "note"];

        // Handle Variant Recipes by cloning
        const variants = recipe.variants
        if (Array.isArray(variants)) {
            for (const alterations of variants) {
                if (typeof alterations === "object") {
                    if (!alterations.item && !alterations.mod) {
                        throw new Error(`Heliana's Harvesting | For ${recipe.name} recipe variants must specify either an 'item' link or a 'mod'`);
                    }
                    let clone = {...recipe};

                    fields.forEach(f => {
                        if (alterations.hasOwnProperty(f)) {
                            clone[f] = alterations[f];
                        }
                    });

                    // Remove variants so that we don't recurse
                    delete clone.variants;

                    // Add variants
                    this.addRecipe(clone);
                }
            }
            return;
        }

        // Duplicate recipe for each item link, if we get an array of item links
        if (Array.isArray(recipe.item)) {
            for (const newItem of recipe.item) {
                let clone = {...recipe};
                clone.item = newItem;
                this.addRecipe(clone);
            }
            return;
        }

        Object.getOwnPropertyNames(recipe).forEach(name => {
            if (!fields.includes(name)) {
                throw new Error(`Heliana's Harvesting | Unknown property ${name} on recipe ${recipe.name}`);
            }
        });

        this.#addItemInternal(recipe);
    }

    #addItemInternal(recipe) {
        const item = fromUuidSync(recipe.item);
        if (!item) {
            console.error(`Heliana's Harvesting | Unable to find item uuid ${recipe.item} on recipe ${recipe.name}`);
            return;
        }

        // Normalize recipe components to arrays for easier handling
        if (!Array.isArray(recipe.component)) recipe.component = [recipe.component];

        const components = recipe.component.map(c => {
            const component = this._cb.get(c);
            if (!component) {
                console.error(`Heliana's Harvesting | Unable to find component ${c} on recipe ${recipe.name}`)
            }
            return component;
        });

        const nameExtension = recipe.mod ? ` (${recipe.mod})` : ''
        const name = item.name + nameExtension;
        const preventReplacement = game.settings.get("helianas-harvesting-custom-recipes", "preventRecipeReplacement");

        if (!preventReplacement && this.getRecipeFromItemUuid(recipe.item)) {
            console.warn(`Heliana's Harvesting | Recipe for item: ${name} already exists. Replacing.`);
            const existingIndex = this._recipes.findIndex(r => r.name === name);
            if (existingIndex !== -1) {
                console.warn(`Heliana's Harvesting | Removing existing recipe for item: ${name}, to be ready for replacement.`, this.getRecipeFromName(name));
                const replaced = this._recipes.splice(existingIndex, 1);
                console.warn(`Heliana's Harvesting | Removed recipe:`, replaced[0]);
            }
        }

        if (this.getRecipeFromName(name)) {
            throw new Error(`Heliana's Harvesting | Duplicated name for item: ${name}`)
        }

        this._recipes.push({
            name,
            img: item.img ?? "icons/svg/item-bag.svg",
            searchText: `${item.name} ${recipe.mod ?? ""} ${recipe.metatag ?? ""} ${components.map(c => c.name).join(" ")}`.toLowerCase(),
            metatag: recipe.metatag,
            rarity: recipe.rarity,
            price: recipe.price,
            link: recipe.item,
            qty: recipe.qty ?? 1,
            includeBasePrice: recipe.includeBasePrice === true,
            components
        });
    }

    /**
     * Searches all recipes to find.  Default behaviour returns all recipes if no search string is provided.
     *
     * @param {string} text Search string
     * @param {boolean} [matchAll=true] Whether to match all keywords (AND logic) or any keyword (OR logic)
     * @param {string} [delimiter=" "] Delimiter used to split the search string into keywords.  " " for AND logic, "," for OR logic
     *
     * @returns {any[]} results
     */
    searchItems(text, matchAll = false, delimiter = ",") {
        let keywords = text.toLowerCase().split(delimiter)
        keywords = keywords.map(word => word.trim()).filter(word => word.length > 0);
        if (keywords.length === 0) return this._recipes;
        return this._recipes.filter(r => {
            const searchText = r.searchText ?? "";
            const metatag = r.metatag?.toLowerCase() ?? "";
            const rarity = r.rarity?.toLowerCase() ?? "";

            // For searchText and metatag: AND/OR logic
            const textMatch = matchAll
                ? keywords.every(word => searchText.includes(word) || metatag.includes(word))
                : keywords.some(word => searchText.includes(word) || metatag.includes(word));

            // For rarity: OR logic, exact match only
            // This assumes rarity is a single word, e.g. "veryrare"
            // "very rare" will not match "veryrare"
            const rarityMatch = keywords.some(word => rarity === word);

            // Return true if either text/metatag match, or rarity matches exactly
            //console.log(`Heliana's Harvesting | Searching for: ${text}, Match All: ${matchAll}, Delimiter: ${delimiter}`);
            //console.log(`Heliana's Harvesting | Recipe: ${r.name}, Text Match: ${textMatch}, Rarity Match: ${rarityMatch}`);
            //console.log(`Heliana's Harvesting | Search Text: ${searchText}, Metatag: ${metatag}, Rarity: ${rarity}`);
            return textMatch || rarityMatch;
        });
    }

    /**
     * Searches all recipes to find.  Default behaviour returns all recipes if no search string is provided.
     *
     * @param {string} text Search string
     * @param {boolean} [matchAll=true] Whether to match all keywords (AND logic) or any keyword (OR logic)
     * @param {string} [delimiter=" "] Delimiter used to split the search string into keywords.  " " for AND logic, "," for OR logic
     *
     * @returns {any[]} results
     */
    // searchItems(text, matchAll = false, delimiter = ",") {
    //     let keywords = text.toLowerCase().split(delimiter)
    //     keywords = keywords.map(word => word.trim()).filter(word => word.length > 0);
    //     if (keywords.length === 0) return this._recipes;
    //     return this._recipes.filter(r => {
    //         if (matchAll) {
    //             return keywords.every(word => (r.searchText.includes(word)));
    //         } else {
    //             return keywords.some(word => (r.searchText.includes(word)));
    //         }
    //     });
    // }




    /**
     *
     * @param {*} name The recipe's name
     */
    getRecipeFromName(name) {
        return this._recipes.find((r => (r.name === name)));
    }


    /**
     * Returns the recipe that matches the given item UUID.
     * @param {string} uuid The UUID of the item
     * @return {object|null} The recipe object if found, otherwise null
     */
    getRecipeFromItemUuid(uuid) {
        function normalizeUuid(uuid) {
        // Remove ".Item." if present
            return uuid.replace(/\.Item\./, '.');
        }
        let recipeFromUUID = this._recipes.find((r => r.link === uuid));
        // If the recipe is not found, try again after stripping .Item to normalize the UUID
        if (recipeFromUUID) {
            let matchType = "exact";
            return { recipeFromUUID, matchType };
        } else {
            recipeFromUUID = this._recipes.find((r => r.link === normalizeUuid(uuid)));
            if (recipeFromUUID) {
                let matchType = "normalized";
                return { recipeFromUUID, matchType };
            } else {
                console.warn(`Heliana's Harvesting | Unable to find recipe for item UUID: ${uuid}`);
                let matchType = "none";
                return { recipeFromUUID: null, matchType };
            }
        }
    }
}
