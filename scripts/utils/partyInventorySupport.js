// This function is used to detect the quantity of an item in a string.  Copied from the party-inventory module.
function detectQuantity(input) {
    if (input) {
        const re =/(?:(\d+)\s+)?(.+?)(?:\s+\((\d+)\)|$)/;
        const matches = input.match(re);

        if (matches) {
            if (matches[1]) {
                return { name: matches[2], quantity: parseInt(matches[1]), style: 'prefix' };
            } else if (matches[3]) {
                return { name: matches[2], quantity: parseInt(matches[3]), style: 'suffix' };
            }
        }
    }

    return { name: input, quantity: 1 };
}


export default function getPartyInventoryItems() {
    let partyInventoryAll
    try {
        partyInventoryAll = game.settings.get("party-inventory", 'scratchpad');
    }catch (error) {
        console.error("Unable to get party-inventory", error);
        console.warn("Party-Inventory module not found. Party-Inventory support setting must be disabled.");
        return {items: {}, order: []};
    }
    let partyInventory = {items: {}, order: []};

    for (let order of partyInventoryAll.order) {
        console.log("Party Inventory order", order);
        console.log("Party Inventory item", partyInventoryAll.items[order]);
        let item = partyInventoryAll.items[order];
        if (!item.name) {
            console.warn("Item without a name detected and skipped:", item);
        } else {
            if (!item.system){
                item.system = {};
            }
            item.system.quantity = detectQuantity(item.name).quantity;
            //if (!item.parent) {
            console.log("Item.parent", item.parent);
            item.parent = {name: "Party-Inventory2"};
            console.log("Item.parent.name", item.parent.name);
            //}

            partyInventory.order.push(order);
            partyInventory.items[order] = item;
        }
    }
    console.warn("Party Inventory", partyInventory);
    return partyInventory;
}
