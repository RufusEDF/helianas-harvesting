export function setupSettings() {
    // Populate the settings page for the module
    // settings can be accessed with:
    // game.settings.get("helianas-harvesting", "playerRecipes"); // returns true
    game.settings.register("helianas-harvesting", "playerRecipes", {
        name: "HelianasHarvest.SettingsPlayerRecipes",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });

    game.settings.register("helianas-harvesting", "playerCrafting", {
        name: "HelianasHarvest.SettingsPlayerCrafting",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });

    game.settings.register("helianas-harvesting", "playerHarvesting", {
        name: "HelianasHarvest.SettingsPlayerHarvesting",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });
}
