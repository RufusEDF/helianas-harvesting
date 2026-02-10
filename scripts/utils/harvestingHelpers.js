export function calculateHarvestingModifiers(actor, skill) {

    // The skill passed in may be the full skill name (eg. "survival") or it may be the abbreviated version (eg. "sur").  We need to check for both and convert to the abbreviated version if necessary.
    const skillAbbreviations = {
        "acrobatics": "acr",
        "arcana": "arc",
        "animal handling": "ani",
        "athletics": "ath",
        "deception": "dec",
        "history": "his",
        "insight": "ins",
        "intimidation": "itm",
        "investigation": "inv",
        "medicine": "med",
        "nature": "nat",
        "perception": "prc",
        "performance": "prf",
        "persuasion": "prs",
        "religion": "rel",
        "sleight of hand": "slt",
        "stealth": "ste",
        "survival": "sur"
    };

    if (skillAbbreviations[skill.toLowerCase()]) {
        skill = skillAbbreviations[skill.toLowerCase()];
    }

    let modifiers = {
        "name": actor?.name || "Unknown Actor",
        "skill": skill || "Unknown Skill",
        "proficiencyBonus": 0,
        "proficiencyMultiplier": 0,
        "dexHarvestBonus": 0,
        "intHarvestBonus": 0,
        "helpHarvestBonus": 0
    };

    if (!actor) {
        console.warn("No actor provided for harvesting modifiers.");
        return modifiers;
    }
    if (!skill) {
        console.warn("No skill provided for harvesting modifiers.");
        return modifiers;
    }

    // 1. We could get the bonus from the relevent skill check, minus that skills ability modifier and then add the appropriate ability modifier for the harvesting checkk (dex or int).
    // eg. Survival Check bonus - wisdom + dex or int.
    // We would still need to know the proficiency multiplier/bonus for the helping modifier.
    // system stores numbers as strings, so we need to convert them to numbers before doing any calculations.

    modifiers.proficiencyBonus = Number(actor.system.attributes.prof) || 0;
    modifiers.proficiencyMultiplier = Number(actor.system.skills[skill]?.value) || 0;
    let skillAbility = actor.system.skills[skill]?.ability || ""; //dex, int, etc.
    let skillBonus = Number(actor.system.skills[skill]?.total) || 0; // native bonus eg. survival wis.
    let dexModifier = Number(actor.system.abilities.dex.mod) || 0; // eg. dex of 12 would be +1
    let intModifier = Number(actor.system.abilities.int.mod) || 0; // eg. int of 18 would be +4

    let skillAbilityModifier = Number(actor.system.abilities[skillAbility]?.mod) || 0; // eg. if the skill is survival, this would be the wisdom modifier.

    //additional paramaters for debugging and future use.
    modifiers.skillAbility = skillAbility;
    modifiers.skillBonus = skillBonus;
    modifiers.skillAbilityModifier = skillAbilityModifier;
    modifiers.dexModifier = dexModifier;
    modifiers.intModifier = intModifier;


    modifiers.dexHarvestBonus = skillBonus - skillAbilityModifier + dexModifier;
    modifiers.intHarvestBonus = skillBonus - skillAbilityModifier + intModifier;
    modifiers.helpHarvestBonus = (modifiers.proficiencyBonus * modifiers.proficiencyMultiplier); // This is a simplification and may need to be adjusted based on how you want to handle helping.

    if (modifiers.helpHarvestBonus <= 0) {
        modifiers.helpHarvestBonus = modifiers.proficiencyBonus * 0.5; // If the actor is not proficient, they can still help at half the proficiency bonus.
    }



    //need to add support for the harvesting feats.
    // check if the actor has the "harvesting" feat and if so, add the appropriate modifiers to the harvesting roll.

    //Do we need to add support for the druid "Primal Order Magician" feature?  +wis to int checks. - No, this is already calculated in the skill bonus.
    console.log("Harvesting Modifiers:", modifiers);

    return modifiers;
}
