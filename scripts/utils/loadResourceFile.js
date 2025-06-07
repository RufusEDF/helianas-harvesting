/**
 * Loads a JSON array file of elements into a map indexed by `resourceKeyName`
 *
 * @param {string} filenameOrElements
 * @param {Map<string, any>} resourceMap
 * @param {string} resourceKeyName
 * @param {string} source
 *
 * @returns
 */
export async function loadResourceFile(filenameOrElements, resourceMap, resourceKeyName, source) {
    let elements;

    // If it's a string ending in .json, fetch and parse as the file.
    if (typeof filenameOrElements === "string" && filenameOrElements.endsWith(".json")) {
        const contents = await fetch(filenameOrElements);
        elements = await contents.json();
    } else if (Array.isArray(filenameOrElements)) {
        // If it's already an array, use it directly
        // I don't think an array will ever be passed here, but just in case
        elements = filenameOrElements;
    } else if (typeof filenameOrElements === "object" && filenameOrElements !== null) {
        // If it's a single object, wrap it in an array
        elements = [filenameOrElements];
    } else {
        throw new Error("Invalid resource input: must be a .json file path, array, or object", filenameOrElements);
    }

    const stats = { loaded: 0, replaced: 0, errors: 0 };

    const preventReplacement = game.settings.get("helianas-harvesting-custom-recipes", "preventRecipeReplacement");

    elements.forEach(element => {
        try {
            const key = element[resourceKeyName];
            element.source = source;
            stats.loaded++;  //Should this go here or after the check for preventOverwrite?


            if (preventReplacement) {
                if( resourceMap.has(key)) {
                    stats.errors++;
                    console.warn(`Preventing duplicate from ${source} from overwriting existing resource with key "${key}".`);
                    return; // Skip adding this duplicate
                }
            }

            if (resourceMap.has(key)) {
                stats.replaced++;
            }
            resourceMap.set(key, element);
        } catch (e) {
            stats.errors++;
            console.warn(`Failed to add resource "${element?.name || '[unknown]'}": ${e.message}`);
        }
    });

    return stats;
}
