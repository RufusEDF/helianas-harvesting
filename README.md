# Heliana's Harvesting Module

This module helps you harvest, craft and cook following the rule set from Heliana's Guide to Monster Hunting.

Works for Foundry versions 12 and 13.

## How to Harvest from a Creature

![The GM selects a creature you want to harvest then click the Harvest Creature button](/images/harvesting/step1.png)

![Fill in the creature name and type, the fill in the number of component](/images/harvesting/step2.png)

![Click the "Create Harvest Table" button](/images/harvesting/step3.png)

![Share the components with your players](/images/harvesting/step4.png)

![They can click a button to see which recipes these potential components can be used in](/images/harvesting/showrelevantrecipesbutton.png)

![If they have permission, a search bar will let them search the recipe database](/images/harvesting/search.png)

![Otherwise, the search bar will not be displayed](/images/harvesting/nosearch.png)

![Have the players decide what to harvest and what order](/images/harvesting/step5.png)

![Have players roll their checks then fill in the harvest check total](/images/harvesting/step6.png)

![Select the player to send the components to the complete your harvest!](/images/harvesting/step7.png)

## Crafting

![Click the Crafting Recipes button](/images/crafting/step1.png)

![Sort by Name, Rarity, Value or Metatag by clicking the table headers.  Filter only recipes you have materials for by clicking the Held Components header.  You can also toggle between AND/OR search logic (comma delimited)](/images/crafting/craftingfilterandsort.PNG)

![Select the item you want to create](/images/crafting/step2.png)

![There is a local "Display Held Components" setting to allow players to see which recipes they have the required components](/images/crafting/heldcomponentsunfiltered.png)

![The local "Display Held Components" setting also allows you to hide recipes you don't have components for.  It also supports the Foundry-Party-Inventory module. ](/images/crafting/heldcomponentsfiltered.png)

![Select the player to send the item to](/images/crafting/step3.png)

![A confirmation message will show in the chat!](/images/crafting/step4.png)

## Create Custom Recipes
Included is an example helianas-harvesting-custom-recipes-module which can be copied into your module folder and wont be overwritten when you update this module.

There is also a basic (and likely buggy) recipe creator which can be enabled in the settings.  Recipes created in this way will be stored in the settings page.  It is recomended to back these up in a JSON file.  The Recipe Creator can be opened by clicking compendium item's H Header Button.  If possible the details will be prefilled from the Compendium.

![Header Button and Create Recipe form](/images/customrecipes/recipeform.png)

If there is an existing recipe for that compendium item or one with the same name, the metatag and component details will be prefilled too.  Otherwise, click the magnifying glass icon to select a component.

![Component Select Window](/images/customrecipes/selectcomponent.png)

By default the priority for recipes will be This Module Recipes -> Other Module Recipes -> Settings Recipes.  This can be reversed by disabling "Prevent Recipe Replacement"

## Options / Features

![There are several settings which can be configured](/images/settings.png)
![Additional Create Custom Recipes Settings](/images/customrecipes/customrecipesettings.png)

## TODO

* Add automation around crafting
* Add cooking menu and automation
* Create a recipe JSON file for 2024 SRD items.

## Licenses

This module uses content licensed under the terms of the Open Gaming License v1.0a. A copy of the license can be found in the `OGL.md` document.

The software is distributed under the [MIT License](https://mit-license.org/).
