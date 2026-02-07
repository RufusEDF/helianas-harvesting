//takes an array of items, and adds fading essence to the array based on the per-rarity drop rate and number of regular essences in the array
export async function addFadingEssence(items) {
    let _items = [...items];

    // for each item with essence in the name, roll the rarity-specific droprate and add that many fading essence to the harvest
    const essenceItems = items.filter(i => i.name.toLowerCase().includes("essence"));

    for (const item of essenceItems) {
        const rarity = item.rarity ?? "common";
        const dropRate = game.settings.get("helianas-harvesting", `fadingEssenceDropRate_${rarity}`);

        // Skip if drop rate is "0" or empty
        if (!dropRate || dropRate === "0") continue;

        const roll = await new Roll(dropRate).evaluate();

        await roll.toMessage({
        speaker: { alias: "Heliana's Harvesting" },
        flavor: `Fading ${item.name} Drop Rate (${rarity})`,
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC
        });

        if (roll.total > 0){
            const fadingItem = {
                ...item,
                name: `Fading ${item.name}`,
                count: roll.total,
                fading: true
            };
            _items.push(fadingItem);
        };
    }
    return _items;
}
