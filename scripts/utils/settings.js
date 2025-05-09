export function setupSettings() {
    // Populate the settings page for the module
    // settings can be accessed with:
    // game.settings.get("helianas-harvesting", "playerRecipes"); // returns true
    game.settings.register("helianas-harvesting", "playerRecipes", {
        name: "HelianasHarvest.Settings.PlayerRecipes.Name",
        hint: "HelianasHarvest.Settings.PlayerRecipes.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: true
    });

    game.settings.register("helianas-harvesting", "showRelevantRecipesButton", {
        name: "HelianasHarvest.Settings.ShowRelevantRecipes.Name",
        hint: "HelianasHarvest.Settings.ShowRelevantRecipes.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: true
    });

    game.settings.register("helianas-harvesting", "playerCrafting", {
        name: "HelianasHarvest.Settings.PlayerCrafting.Name",
        hint: "HelianasHarvest.Settings.PlayerCrafting.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });

    game.settings.register("helianas-harvesting", "playerHarvesting", {
        name: "HelianasHarvest.Settings.PlayerHarvesting.Name",
        hint: "HelianasHarvest.Settings.PlayerHarvesting.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false
    });

    game.settings.register("helianas-harvesting", "heldComponents", {
        name: "HelianasHarvest.Settings.HeldComponents.HeldComponentsName",
        hint: "HelianasHarvest.Settings.HeldComponents.HeldComponentsHint",
        scope: "client",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: true,
        requiresReload: true,
    });

    if(game.modules.get("party-inventory")){
        game.settings.register("helianas-harvesting", "partyInventorySupport", {
            name: "HelianasHarvest.Settings.HeldComponents.PartyInventorySupportName",
            hint: "HelianasHarvest.Settings.HeldComponents.PartyInventorySupportHint",
            scope: "world",
            config: true,
            type: new foundry.data.fields.BooleanField(),
            default: game.modules.get("party-inventory").active
        });
    }else{
        game.settings.register("helianas-harvesting", "partyInventorySupport", {
            name: "HelianasHarvest.Settings.HeldComponents.PartyInventorySupportName",
            hint: "HelianasHarvest.Settings.HeldComponents.PartyInventorySupportHint",
            scope: "world",
            config: true,
            type: new foundry.data.fields.BooleanField(),
            default: false
        });
    }

    game.settings.register("helianas-harvesting", "craftingWindowWidth", {
        name: "HelianasHarvest.Settings.CraftingWindowWidth.Name",
        hint: "HelianasHarvest.Settings.CraftingWindowWidth.Hint",
        scope: "client",
        config: true,
        default: 800,
        //type: new foundry.data.fields.NumberField(),
        type: Number,
        range: {
            min: 400,
            max: 1600,
            step: 50,
            initial : 800,
            nullable: false
        },
        requiresReload: false
    });
}
