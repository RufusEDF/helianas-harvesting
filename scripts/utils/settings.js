export function setupSettings() {
    // Populate the settings page for the module
    // settings can be accessed with:
    // game.settings.get("helianas-harvesting", "playerRecipes"); // returns true
    game.settings.register("helianas-harvesting", "playerRecipes", {
        name: "HelianasHarvest.SettingsPlayerRecipes",
        hint: "HelianasHarvest.SettingsPlayerRecipesHint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });

    game.settings.register("helianas-harvesting", "playerCrafting", {
        name: "HelianasHarvest.SettingsPlayerCrafting",
        hint: "HelianasHarvest.SettingsPlayerCraftingHint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });

    game.settings.register("helianas-harvesting", "playerHarvesting", {
        name: "HelianasHarvest.SettingsPlayerHarvesting",
        hint: "HelianasHarvest.SettingsPlayerHarvestingHint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });
}
