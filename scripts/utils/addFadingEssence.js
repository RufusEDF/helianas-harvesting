//takes an array of items, and adds fading essence to the array based on the drop rate and number of regular essences in the array
export async function addFadingEssence(items) {
    let dropRate = game.settings.get("helianas-harvesting", "fadingEssenceHomebrewDropRate");
    console.log(`Adding fading essence with drop rate ${dropRate}`);

    let _items = [...items];

    // for each item with essence in the name, roll 1d4-1 and add that many fading essence to the harvest
    const essenceItems = items.filter(i => i.name.toLowerCase().includes("essence"));

    for (const item of essenceItems) {
        const roll = await new Roll(dropRate).evaluate();
        console.log(`Rolled ${roll.total} fading essence for ${item.name}`);
        if (roll.total > 0){
            const fadingItem = {
                ...item,
                name: `Fading ${item.name}`,
                count: roll.total,
                fading: true
            };
            _items.push(fadingItem);
        };
        //console log the modified item
        console.log(`Modified item: ${item.name} x ${item.count}`, item);
    }
    return _items;
}
