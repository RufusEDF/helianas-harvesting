import { Config } from "../config.js";
import { ComponentDatabase } from "../ComponentDatabase.js";
import { HarvestWindowForm } from "./HarvestWindowForm.js";
import StatisticsWindow from "./StatisticsWindow.js";
import { addFadingEssence } from "../utils/addFadingEssence.js";
import { calculateHarvestingModifiersForActors } from "../utils/harvestingHelpers.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class HarvestWindow extends HandlebarsApplicationMixin(ApplicationV2) {

  /**
   * Component database reference
   * @type {ComponentDatabase}
   */
  itemData = null;

  /**
   * Form state manager
   * @type {HarvestWindowForm}
   */
  formData = null;

  /**
   * AbortController for cleaning up DOM event listeners between renders
   * @type {AbortController}
   */
  #listenerAbort;

  constructor(componentDatabase, token) {
    super();

    this.itemData = componentDatabase;
    this.formData = new HarvestWindowForm(this.itemData);

    if (token) {
      this.updateFromToken(token);
    } else {
      this.updateForm({
        creatureType: "Aberration",
        isBoss: false
      });
    }
  }

  static DEFAULT_OPTIONS = {
    id: "harvest-window",
    classes: ["helianas-harvesting-module"],
    position: { width: 800, height: 600 },
    window: {
      title: "HelianasHarvest.HarvestWindowTitle",
      resize: false,
      minimizable: true,
      controls: [
        {
          icon: "fas fa-chart-bar",
          label: "HelianasHarvest.StatisticsLabel",
          action: "openStatistics"
        }
      ]
    },
    tag: "div",
    actions: {
      createHarvestTable: HarvestWindow.prototype._onCreateHarvestTable,
      shareComponents: HarvestWindow.prototype._onShareComponents,
      showTable: HarvestWindow.prototype._onShowTable,
      completeHarvest: HarvestWindow.prototype._onCompleteHarvest,
      openStatistics: HarvestWindow.prototype._onOpenStatistics
    }
  };

  static PARTS = {
    main: { template: Config.HarvestWindowTemplate }
  };

  // ---------------------------------------------------------------------------
  // State management
  // ---------------------------------------------------------------------------

  updateForm(options) {
    this.formData.updateForm(options);
    if (this.rendered) this.render();
  }

  updateFromToken(token) {
    const actor = token.actor;
    const creatureType = this.itemData.creatureTypes
      .find(t => t.toLowerCase() === actor.system.details.type.value) ?? "Aberration";

    const bosses = this.itemData.getBossNames(creatureType);
    this.updateForm({
      creatureName: actor.name,
      creatureType: creatureType,
      creatureCR: actor.system?.details?.cr ?? 1,
      isBoss: bosses.includes(actor.name),
      // Bosses are auto validated
      bossName: actor.name
    });
  }

  // ---------------------------------------------------------------------------
  // ApplicationV2 data preparation (replaces getData)
  // ---------------------------------------------------------------------------

  async _prepareContext(options) {
    const data = {};

    data.creatureName = this.formData.creatureName;
    data.selectedType = this.formData.creatureType;
    data.creatureTypes = this.itemData.creatureTypes.map(t => ({ value: t, label: t }));
    data.creatureCR = this.formData.creatureCR;

    data.hasBoss = this.itemData.hasBoss(data.selectedType);

    if (data.hasBoss) {
      data.isBoss = this.formData.isBoss;

      data.selectedBoss = this.formData.bossName;
      data.bossNames = this.itemData.getBossNames(data.selectedType).map(t => ({ value: t, label: t }));
    }

    data.items = this.formData.getItemCount(data.selectedType, data.selectedBoss, data.creatureCR);

    data.itemsByDc = this.getItemDCs(data.items);

    data.harvest = this.formData.harvestItems;
    data.harvestEmpty = data.harvest.length === 0;

    data.harvestCheckTotal = this.formData.harvestCheckTotal;

    data.players = [{ value: '', label: "HelianasHarvest.HarvestCharacterOptionNone" }];
    this.getPlayerCharacters().map(p => ({ value: p.id, label: p.name })).forEach(o => data.players.push(o));

    data.harvestingCharacter = this.formData.harvestingCharacter;

    const _actors = this.getPlayerCharacters()

    // calculate the harvest modifiers and cache them in the form data so they can be used in the chat message when sharing components
    this.formData.harvestModifiers = calculateHarvestingModifiersForActors(_actors, this.getAssessmentSkill());
    // Also include the modifiers in the context data for use in the template (eg. to show in the harvesting window)
    data.harvestModifiers = this.formData.harvestModifiers;

    return data;
  }

  // ---------------------------------------------------------------------------
  // ApplicationV2 render hook (replaces activateListeners)
  // ---------------------------------------------------------------------------

  _onRender(ctx, opts) {
    // Abort any previous listeners to prevent duplication
    this.#listenerAbort?.abort();
    this.#listenerAbort = new AbortController();
    const { signal } = this.#listenerAbort;

    // Managed inputs (text, number, select) – update form state on change
    this.element.querySelectorAll('.managed-input').forEach(el => {
      el.addEventListener('change', event => {
        const input = {};
        input[event.target.dataset.binding] = event.target.value;
        this.updateForm(input);
      }, { signal });
    });

    // Is Boss checkbox
    const isBossEl = this.element.querySelector('#is-boss');
    if (isBossEl) {
      isBossEl.addEventListener('change', event => {
        this.updateForm({ isBoss: event.target.checked });
      }, { signal });
    }

    // Harvest Attempt checkboxes
    this.element.querySelectorAll('.harvest-attempt-checkbox').forEach(el => {
      el.addEventListener('change', event => {
        const index = parseInt(event.target.dataset.harvestIndex);
        this.formData.harvestItems[index].attempt = event.target.checked;
        this.updateForm();
      }, { signal });
    });

    // Harvest Table Reordering – Drag & Drop
    this.element.querySelectorAll('.harvest-table-row').forEach(row => {
      row.addEventListener('dragstart', event => {
        event.dataTransfer.setData("harvestOrder", event.currentTarget.dataset.harvestOrder);
      }, { signal });

      row.addEventListener('drop', event => {
        event.preventDefault();
        const sourceIndex = parseInt(event.dataTransfer.getData("harvestOrder"));
        if (Number.isInteger(sourceIndex)) {
          const targetIndex = parseInt(event.currentTarget.dataset.harvestOrder);
          this.formData.reorderHarvestTable(sourceIndex, targetIndex);
          this.updateForm();
        }
      }, { signal });

      // Cosmetic reaction to improve readability of drop action
      row.addEventListener('dragenter', event => {
        event.currentTarget.style.borderTop = "3px solid black";
      }, { signal });

      row.addEventListener('dragleave', event => {
        event.currentTarget.style.borderTop = "";
      }, { signal });

      // Allow drop by preventing default on dragover
      row.addEventListener('dragover', event => {
        event.preventDefault();
      }, { signal });
    });
  }

  close(options) {
    this.#listenerAbort?.abort();
    return super.close(options);
  }

  // ---------------------------------------------------------------------------
  // Action handlers (wired via data-action attributes in the template)
  // ---------------------------------------------------------------------------

  _onCreateHarvestTable(event, target) {
    event.preventDefault();
    const itemCount = {};

    this.element.querySelectorAll('.item-count-input').forEach(el => {
      const id = el.dataset.itemId;
      const count = parseInt(el.value);

      if (count > 0) {
        itemCount[id] = count;
      }
    });

    this.updateForm({ itemCount });
  }

  _onShareComponents(event, target) {
    event.preventDefault();
    this.shareComponents();
  }

  _onShowTable(event, target) {
    event.preventDefault();
    this.showTable();
  }

  _onCompleteHarvest(event, target) {
    event.preventDefault();
    this.completeHarvest();
  }

  _onOpenStatistics(event, target) {
    const sw = new StatisticsWindow();
    sw.render(true);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  getItemDCs(items) {
    const itemsByDc = {};

    for (let i of items) {
      let arr = itemsByDc[i.dc] ?? [];
      arr.push(i);
      itemsByDc[i.dc] = arr;
    }

    return itemsByDc;
  }

  getPlayerCharacters() {
    return game.actors
      .filter(a => a.type === "character")
      .sort((a, b) => a.name < b.name);
  }

  // ---------------------------------------------------------------------------
  // Business logic
  // ---------------------------------------------------------------------------

  shareComponents() {
    let searchQuery = "";

    let message = `<p>${game.i18n.format("HelianasHarvest.ChatComponentsMessage", { creatureName: this.formData.creatureName })}</p>`;
    message += `<ul>`;

    this.formData.getHarvestComponents().forEach(item => {
      message += `<li> ${item.name} (DC ${item.dc}) x ${item.count}`;
      searchQuery += item.name + ",";
    });

    message += `</ul>
      <p>${game.i18n.localize("HelianasHarvest.ChatComponentsInstructions")}</p>
      `;

    if (game.settings.get("helianas-harvesting", "showRelevantRecipesButton")) {
      message += `<button class="helianas-harvest-relevant-recipes-button" title="${searchQuery}">${game.i18n.localize("HelianasHarvest.ShowRelevantRecipes")}</button>`;
    }

    if (game.settings.get("helianas-harvesting", "showHarvestingModifiers")) {

      let modifiersTable = `
        <br>
          <h5>${game.i18n.localize(`HelianasHarvest.HarvestModifiers.Title`)} for ${this.formData.creatureType}</h5>
          <table>
            <thead>
              <th scope="col">${game.i18n.localize("HelianasHarvest.HarvestModifiers.Name")}</th>
              <th scope="col">${game.i18n.localize("HelianasHarvest.HarvestModifiers.Dex")}</th>
              <th scope="col">${game.i18n.localize("HelianasHarvest.HarvestModifiers.Int")}</th>
              <th scope="col">${game.i18n.localize("HelianasHarvest.HarvestModifiers.Help")}</th>
            </thead>
      `;

      for (const modifier of this.formData.harvestModifiers) {
        // Build feat indicator HTML matching the harvest-window.hbs template pattern
        let featIndicator = '';
        if (modifier.feats?.reapmaster) {
          const reapDesc = modifier.feats.reapmaster.system?.description?.chat
            || modifier.feats.reapmaster.system?.description?.value || '';
          let tooltipContent = `<strong>${modifier.feats.reapmaster.name}</strong><br>${reapDesc}`;
          if (modifier.feats.expertHarvester) {
            const ehDesc = modifier.feats.expertHarvester.system?.description?.chat
              || modifier.feats.expertHarvester.system?.description?.value || '';
            tooltipContent += `<hr><strong>${modifier.feats.expertHarvester.name}</strong>${ehDesc}`;
          }
          featIndicator = `<span class="harvest-feat-indicator reapmaster" tabindex="0"><i class="fa-solid fa-star"></i><span class="harvest-feat-tooltip">${tooltipContent}</span></span>`;
        } else if (modifier.feats?.expertHarvester) {
          const ehDesc = modifier.feats.expertHarvester.system?.description?.chat
            || modifier.feats.expertHarvester.system?.description?.value || '';
          const tooltipContent = `<strong>${modifier.feats.expertHarvester.name}</strong><br>${ehDesc}`;
          featIndicator = `<span class="harvest-feat-indicator expert-harvester" tabindex="0"><i class="fa-solid fa-star-half-stroke"></i><span class="harvest-feat-tooltip">${tooltipContent}</span></span>`;
        }

        modifiersTable += `
          <tr>
            <td>${modifier.name}${featIndicator}</td>
            <td>${modifier.dexHarvestBonus}</td>
            <td>${modifier.intHarvestBonus}</td>
            <td>${modifier.helpHarvestBonus}</td>
          </tr> `;
      }

      modifiersTable += `
        </tbody>
        </table>
      `;

      message += modifiersTable
    };

    this.sendChatMessage(message);
    this.formData.getHarvestComponents();
  }

  getAssessmentSkill() {
    const skillTable = {
      "Aberration": "Arcana",
      "Beast": "Survival",
      "Celestial": "Religion",
      "Construct": "Investigation",
      "Dragon": "Survival",
      "Elemental": "Arcana",
      "Fey": "Arcana",
      "Fiend": "Religion",
      "Giant": "Medicine",
      "Humanoid": "Medicine",
      "Monstrosity": "Survival",
      "Ooze": "Nature",
      "Plant": "Nature",
      "Undead": "Medicine",
    };

    return skillTable[this.formData.creatureType] ?? "Other";
  }

  showTable() {
    let message = `<p>${game.i18n.format("HelianasHarvest.ChatHarvestTableMessage", { creatureName: this.formData.creatureName })}</p>`;
    message += `<ul>`;

    this.formData.harvestItems.forEach(harvest => {
      if (harvest.attempt) {
        message += `<li> DC ${harvest.DC} - ${harvest.item.name} (+${harvest.item.dc})`;
      }
    });

    message += `</ul>
      <p>${game.i18n.localize("HelianasHarvest.ChatRollCheckInstructions")}</p>`;

    message += `<p>Assessment check: Intelligence (${this.getAssessmentSkill()})</p>`;

    this.sendChatMessage(message);
  }

  async completeHarvest() {
    const actor = game.actors.get(this.formData.harvestingCharacter);
    let items = this.formData.getHarvestComponents(this.formData.harvestCheckTotal);
    let message = `<p>${game.i18n.format("HelianasHarvest.ConfirmHarvestDialog", { name: actor.name })}</p><ul>`;

    if (game.settings.get("helianas-harvesting", "fadingEssenceHomebrew")) {
      items = await addFadingEssence(items);
    }

    items.forEach(item => {
      message += `<li> ${item.name} x ${item.count}`;
    });

    message += "</ul>";

    // Use DialogV2 when available (Foundry v13+), fall back to Dialog.confirm for v12
    const DialogV2 = foundry.applications.api?.DialogV2;
    if (DialogV2) {
      DialogV2.confirm({
        window: { title: game.i18n.localize("HelianasHarvest.ConfirmHarvestTitle") },
        content: message,
        yes: {
          callback: () => {
            const items5e = items
              .map(item => this.itemData.createItem5e(this.formData.creatureName, item));
            actor.createEmbeddedDocuments("Item", items5e);
          }
        }
      });
    } else {
      Dialog.confirm({
        title: game.i18n.localize("HelianasHarvest.ConfirmHarvestTitle"),
        content: message,
        yes: () => {
          const items5e = items
            .map(item => this.itemData.createItem5e(this.formData.creatureName, item));
          actor.createEmbeddedDocuments("Item", items5e);
        }
      });
    }
  }

  sendChatMessage(message) {
    let chatMessage = {
      user: game.userId,
      speaker: ChatMessage.getSpeaker(),
      content: message
    };

    ChatMessage.create(chatMessage);
  }
}
