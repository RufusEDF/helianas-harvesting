export function setupSettings() {
    // Populate the settings page for the module
    // settings can be accessed with:
    // game.settings.get("helianas-harvesting", "heldComponents"); // returns true

    game.settings.register("helianas-harvesting", "heldComponents", {
        name: "HelianasHarvest.Settings.HeldComponents.HeldComponentsName",
        hint: "HelianasHarvest.Settings.HeldComponents.HeldComponentsHint",
        scope: "client",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: true,
        requiresReload: true
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




}
