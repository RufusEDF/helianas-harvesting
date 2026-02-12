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

    game.settings.register("helianas-harvesting", "showHarvestingModifiers", {
        name: "HelianasHarvest.Settings.ShowHarvestingModifiers.Name",
        hint: "HelianasHarvest.Settings.ShowHarvestingModifiers.Hint",
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
        default: 1000,
        //type: new foundry.data.fields.NumberField(),
        type: Number,
        range: {
            min: 400,
            max: 1600,
            step: 50,
            initial : 1000,
            nullable: false
        },
        requiresReload: false
    });

    game.settings.register("helianas-harvesting", "fadingEssenceHomebrew", {
        name: "HelianasHarvest.Settings.FadingEssenceHomebrew.Name",
        hint: "HelianasHarvest.Settings.FadingEssenceHomebrew.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false,
        requiresReload: true,
    });

    const fadingEssenceDropRates = [
        { rarity: "common",   default: "1d4-1" },
        { rarity: "uncommon", default: "1d4-1" },
        { rarity: "rare",     default: "1d3-1" },
        { rarity: "veryRare", default: "1d4-2" },
        { rarity: "legendary",default: "1d2-1" },
        { rarity: "artifact", default: "0" },
    ];

    for (const { rarity, default: defaultValue } of fadingEssenceDropRates) {
        game.settings.register("helianas-harvesting", `fadingEssenceDropRate_${rarity}`, {
            name: `HelianasHarvest.Settings.FadingEssenceHomebrew.DropRate_${rarity}_Name`,
            hint: `HelianasHarvest.Settings.FadingEssenceHomebrew.DropRate_${rarity}_Hint`,
            scope: "world",
            config: true,
            type: new foundry.data.fields.StringField(),
            default: defaultValue,
            requiresReload: true,
        });
    }



    game.settings.register("helianas-harvesting-custom-recipes", "createCustomRecipes", {
        name: "HelianasHarvest.Settings.CreateCustomRecipes.Name",
        hint: "HelianasHarvest.Settings.CreateCustomRecipes.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.StringField({
            choices: {
                "off": "Disabled",
                "gm": "GM Only",
                "gmp": "GM + Players",
            },
        }),
        default: "off",
        requiresReload: true
    });

    game.settings.register("helianas-harvesting-custom-recipes", "customRecipes", {
        name: "HelianasHarvest.Settings.CustomRecipes.Name",
        hint: "HelianasHarvest.Settings.CustomRecipes.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.StringField(),
        default: "[]",
        requiresReload: true
    });

    game.settings.register("helianas-harvesting-custom-recipes", "customRecipesPriority", {
        name: "HelianasHarvest.Settings.CustomRecipesPriority.Name",
        hint: "HelianasHarvest.Settings.CustomRecipesPriority.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.NumberField(),
        default: -5,
        requiresReload: true
    });

    game.settings.register("helianas-harvesting-custom-recipes", "preventRecipeReplacement", {
        name: "HelianasHarvest.Settings.PreventRecipeReplacement.Name",
        hint: "HelianasHarvest.Settings.PreventRecipeReplacement.Hint",
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField(),
        default: false,
        requiresReload: true
    });


}
