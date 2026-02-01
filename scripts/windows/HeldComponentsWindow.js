import { Config } from "../config.js";
import getPartyInventoryItems from "../utils/partyInventorySupport.js";


const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class HeldComponentsWindow extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "held-components-window",
        classes: ["helianas-harvesting-module", "themed", "theme-light"],
        position: { width: 400, height: 600 },
        window: {
            title: "HelianasHarvest.HeldComponentsWindowTitle",
            minimizable: true,
            maximizable: true,
            resizable: true,
        },
        tag: "div"
    };

    static PARTS = {
        main: { template: Config.HeldComponentsWindowTemplate }
    };

    async _prepareContext(options) {
        const { componentDatabase } = game.modules.get("helianas-harvesting").api;
        const partyItems = getPartyInventoryItems();
        console.log("HeldComponentsWindow | Component Database:", componentDatabase);
        console.log("HeldComponentsWindow | Party Items:", partyItems);

        

        return {};
    }

}
