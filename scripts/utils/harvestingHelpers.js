//This function is used to calculate the harvesting modifiers for a list of actors and a given skill. It returns an array of objects with the relevant modifiers for each actor that can be used in the harvesting roll.
export function calculateHarvestingModifiersForActors(actors, skill) {
    let modifiersArray = [];
    for (let actor of actors) {
        let modifiers = calculateHarvestingModifiersForActor(actor, skill);
        modifiersArray.push(modifiers);
    }
    console.log("Harvesting Modifiers for Actors:", modifiersArray);
    return modifiersArray;
}


// This function is used to calculate the harvesting modifiers for a single actor and skill. It returns an object with the relevant modifiers that can be used in the harvesting roll.
export function calculateHarvestingModifiersForActor(actor, skill) {

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

    //additional parameters for debugging and future use.
    modifiers.skillAbility = skillAbility;
    modifiers.skillBonus = skillBonus;
    modifiers.skillAbilityModifier = skillAbilityModifier;
    modifiers.dexModifier = dexModifier;
    modifiers.intModifier = intModifier;

    //Support for the harvesting feats.
    modifiers.feats = {
        "expertHarvester": actor.items.find(i => i.name.toLowerCase().includes("expert harvester")),
        "reapmaster": actor.items.find(i => i.name.toLowerCase().includes("reapmaster"))
    };

    modifiers.dexHarvestBonus = skillBonus - skillAbilityModifier + dexModifier;
    modifiers.intHarvestBonus = skillBonus - skillAbilityModifier + intModifier;
    // If the actor is not proficient, they can still help at half the proficiency bonus.
    modifiers.helpHarvestBonus = modifiers.proficiencyMultiplier === 0 ?  Math.floor(modifiers.proficiencyBonus * 0.5) : (modifiers.proficiencyBonus * modifiers.proficiencyMultiplier);

    if (modifiers.feats.expertHarvester) {
        if(modifiers.proficiencyMultiplier === 0){
            //When you attempt to to harvest a creature which you don't have the required skill proficiency, you can add your proficiencyy bonus to the result of the roll.
            // If you are helping you add the full proficiency bonus , regardless of whether you're proficient.
            modifiers.dexHarvestBonus += modifiers.proficiencyBonus;
            modifiers.intHarvestBonus += modifiers.proficiencyBonus;
            modifiers.helpHarvestBonus = modifiers.proficiencyBonus;
        } else if (modifiers.proficiencyMultiplier === 1) {
            // When you make a harvesting check using a skill with which you are proficient, your proficiency bonus is doubled.
            modifiers.dexHarvestBonus += modifiers.proficiencyBonus;
            modifiers.intHarvestBonus += modifiers.proficiencyBonus;
        } else {
            if (settings.get("helianas-harvesting", "superExpertiseFromFeats")) {
                //Homebrew - When you make a harvesting check using a skill with which you have expertise, your proficiency bonus is added again.
                modifiers.dexHarvestBonus += modifiers.proficiencyBonus;
                modifiers.intHarvestBonus += modifiers.proficiencyBonus;
            }
        }
    }

    console.log("Harvesting Modifiers:", modifiers);

    return modifiers;
}
