export class ComponentDatabase {
    _items = new Map();
    bosses = new Map();
    creatureTypes = [
        "Aberration",
        "Beast",
        "Celestial",
        "Construct",
        "Dragon",
        "Elemental",
        "Fey",
        "Fiend",
        "Giant",
        "Humanoid",
        "Monstrosity",
        "Ooze",
        "Plant",
        "Undead"
    ];

    addItem(input) {
        // We test and sanitize the input
        const item = this.#sanitizeItem(input);

        this._items.set(item.id, item);

        if (item.bossDrop) {
            const bossList = this.bosses.get(item.creatureType) ?? new Set();
            item.bosses.forEach(boss => bossList.add(boss));
            this.bosses.set(item.creatureType, bossList);
        }
    }

    #sanitizeItem(input) {
        if (!(/^[a-zA-Z0-9]{16}$/.test(input.id))) {
            console.error("Heliana's Harvesting | Invalid Item ID for ", item);
            throw new Error("Heliana's Harvesting | Invalid Item ID");
        }

        const item = {
            id: input.id
        };

        item.crafting = input.crafting === true;
        item.edible = input.edible === true;
        item.volatile = input.volatile === true;

        // Convert singular boss name to an array
        if (typeof input.bosses === "string") input.bosses = [input.bosses];

        if (Array.isArray(input.bosses) && input.bosses.every(boss => typeof boss === 'string')) {
            item.bosses = input.bosses;
        }
        else {
            item.bosses = [];
        }

        item.bossDrop = item.bosses.length > 0;

        item.dc = typeof input.dc === "number" ? input.dc : 5;
        item.name = typeof input.name === "string" ? input.name : "Unnamed Item";
        item.img = typeof input.img === "string" ? input.img : "icons/svg/item-bag.svg";
        item.source = typeof input.source === "string" ? input.source : "";
        item.creatureType = this.creatureTypes.includes(input.creatureType) ? input.creatureType : "All"

        item.crMin = typeof input.crMin === "number" ? input.crMin : 0;
        item.crMax = typeof input.crMax === "number" ? input.crMax : 40;

        item.value = typeof input.value === "number" ? input.value : item.dc * 4;
        item.rarity = typeof input.rarity === "string" ? input.rarity : "common";

        if (game.settings.get("helianas-harvesting", "heldComponents")){
            item.held = {
                _itemsCache: null,
                _countCache: null,
                get items() {
                    if (this._itemsCache) return this._itemsCache;
                    let _items = [];

                    let partyInventory = {items: {}, order: []};
                    if(game.settings.get("helianas-harvesting", "partyInventorySupport")){
                        partyInventory = getPartyInventoryItems();
                    }

                    let componentLowerCase = item.name.toLowerCase()

                    // Collect items from all characters
                    let characters = game.actors.filter(a => a.type === "character");

                    characters.forEach(character => {
                        _items = _items.concat(character.items.filter(item =>
                            item.name.toLowerCase().includes(componentLowerCase)));
                    });

                    // Collect items from party inventory
                    if(game.settings.get("helianas-harvesting", "heldComponents") && game.settings.get("helianas-harvesting", "partyInventorySupport")){
                        for (let order of partyInventory.order) {
                            let item = partyInventory.items[order];
                            try {
                                if (item.name.toLowerCase().includes(componentLowerCase)){
                                    _items.push(item);
                                }
                            } catch (error) {
                                console.error("Issue checking item error", error);
                                console.warn("Issue checking item", item);
                            }
                        }
                    }
                    this._itemsCache = _items;
                    return _items;
                },







                //     console.log("Calculating held items for component:", item.name);
                //     let characterItems = game.actors.filter(a => a.type === "character").map(a => a.items).flat();
                //     console.log("Character items:", characterItems);
                //     let allItems = characterItems.concat(
                //         game.settings.get("helianas-harvesting", "partyInventorySupport") ?
                //         getPartyInventoryItems().items : []
                //     );
                //     console.log("All relevant items:", allItems);
                //     this._itemsCache = allItems.filter(i => i.name.toLowerCase().includes(item.name.toLowerCase()));
                //     console.log("Filtered held items for component:", this._itemsCache);
                //     return this._itemsCache;
                // },
                get count() {
                    if (this._countCache !== null) return this._countCache;
                    let quantity = 0;
                    this.items.forEach(item => {quantity += item.system.quantity});
                    console.log(`Total held count for component "${item.name}":`, quantity);
                    this._countCache = quantity;
                    return quantity;
                }
            };
        };

        return item;
    }

    get items() {
        return Array.from(this._items.values());
    }

    hasBoss(creatureType) {
        return this.bosses.has(creatureType);
    }

    getBossNames(creatureType) {
        const ct = this.bosses.get(creatureType);
        return ct ? Array.from(ct).sort() : [];
    }

    get(itemId) {
        return this._items.get(itemId);
    }

    async exportBasicItems() {
        const rootFolder = (await Folder.create({name: "Components", type: "Item" })).id;
        const subFolders = {};

        for (const item of this.items) {
            let folderId = rootFolder;
            if (subFolders[item.creatureType]) {
                folderId = subFolders[item.creatureType];
            }
            else {
                folderId = (await Folder.create({ name: item.creatureType, type: "Item", folder: rootFolder })).id;
                subFolders[item.creatureType] = folderId;
            }

            const out = this.createGenericItem5e(item);
            out.folder = folderId;
            await Item.create(out);
        }
    }

    createItem5e(creatureName, item) {
        return {
            "name": `${item.name} (${creatureName})`,
            "type": "loot",
            "img": item.img,
            "system": {
                "rarity": item.rarity,
                "description": {
                    "value": `<p>A ${item.name.toLowerCase()} harvested from a ${creatureName}. It may be useful in crafting!</p>`,
                },
                "source": item.source,
                "quantity": item.count,
                "weight": 0,
                "price": {
                    "value": item.value,
                    "denomination": "gp"
                },
                "identified": true
            },
            "flags": {
                "helianas-harvesting": {
                    "id": item.id,
                    "name": item.name,
                    "source": creatureName
                }
            }
        };
    }

    createGenericItem5e(item) {
        return {
            "name": `${item.name}`,
            "type": "loot",
            "img": item.img,
            "system": {
                "rarity": item.rarity,
                "description": {
                    "value": `<p>A ${item.name.toLowerCase()} harvested from a ${item.creatureType.toLowerCase()}. It may be useful in crafting!</p>`,
                },
                "source": item.source,
                "quantity": 1,
                "weight": 0,
                "price": {
                    "value": item.value,
                    "denomination": "gp"
                },
                "identified": true
            },
            "flags": {
                "helianas-harvesting": {
                    "id": item.id,
                }
            }
        };
    }

    //resetMappedHeldComponents
    //for each component in the database, reset the held components cache
    //doesn't do anything to the actual items, just resets the cache so it will be recalculated next time
    resetMappedHeldComponents(){
        this._items.forEach((component) => {
            console.log(`Resetting held components cache for component: ${component.name}`);
            // Reset held components for all components
            component.held._itemsCache = null;
            component.held._countCache = null;
        });
    }



}
