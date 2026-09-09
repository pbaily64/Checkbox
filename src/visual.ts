"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { VisualFormattingSettingsModel } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private isChecked: boolean = true;
    private initialized: boolean = false;
    private currentDataView: powerbi.DataView | null = null;

    private container: HTMLDivElement;
    private titleEl: HTMLDivElement;
    private checkbox: HTMLInputElement;
    private labelEl: HTMLLabelElement;
    private dynamicStyle: HTMLStyleElement;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.buildUI();
    }

    private buildUI(): void {
        this.container = document.createElement("div");
        this.container.className = "cbf-container";

        this.dynamicStyle = document.createElement("style");
        this.container.appendChild(this.dynamicStyle);

        this.titleEl = document.createElement("div");
        this.titleEl.className = "cbf-title";
        this.container.appendChild(this.titleEl);

        const row = document.createElement("div");
        row.className = "cbf-row";

        this.checkbox = document.createElement("input");
        this.checkbox.type = "checkbox";
        this.checkbox.className = "cbf-checkbox";
        this.checkbox.id = "cbf-main-checkbox";

        this.labelEl = document.createElement("label");
        this.labelEl.htmlFor = this.checkbox.id;
        this.labelEl.className = "cbf-label";

        row.appendChild(this.checkbox);
        row.appendChild(this.labelEl);
        this.container.appendChild(row);
        this.target.appendChild(this.container);

        this.checkbox.addEventListener("change", () => {
            this.isChecked = this.checkbox.checked;
            this.applyFilter();
        });
    }

    private applyFilter(): void {
        if (!this.currentDataView) return;
        const categories = this.currentDataView?.categorical?.categories;
        if (!categories || categories.length === 0) return;
        const column = categories[0].source;
        const targetTable = (column.queryName || "").split(".")[0] || "";

        const filter = {
            $schema: "https://powerbi.com/product/schema#basic",
            target: { table: targetTable, column: column.displayName },
            operator: "In",
            values: [this.isChecked],   // booléen natif, pas string "True"/"False"
            filterType: 1
        };

        // Canal "reportLevelFilters" → le filtre persiste lors de la navigation entre pages
        this.host.applyJsonFilter(
            filter as unknown as powerbi.IFilter,
            "reportLevelFilters",
            "filter",
            powerbi.FilterAction.merge
        );
    }

    public update(options: VisualUpdateOptions): void {
        if (!options.dataViews || !options.dataViews[0]) return;

        this.currentDataView = options.dataViews[0];
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            this.currentDataView
        );

        const settings = this.formattingSettings;

        if (!this.initialized) {
            // Premier chargement : tenter de restaurer l'état depuis le filtre rapport actif.
            // Si un filtre existe déjà sur la colonne (navigation retour), on se synchronise
            // avec lui plutôt que d'appliquer la valeur par défaut.
            const restored = this.restoreFromFilters(options);
            if (!restored) {
                // Aucun filtre actif → appliquer la valeur par défaut configurée
                const def = (settings.generalSettings.defaultValue.value || "true").toString();
                this.isChecked = (def === "true");
                this.applyFilter();
            }
            this.initialized = true;
        }

        this.checkbox.checked = this.isChecked;

        const showTitle = settings.titleSettings.show.value;
        const titleText = (settings.titleSettings.text.value || "Filtre Bool\u00e9en").toString();
        const titleFontSize = settings.titleSettings.fontSize.value || 14;
        const titleColor = (settings.titleSettings.fontColor.value as any)?.value || "#333333";

        this.titleEl.style.display = showTitle ? "block" : "none";
        this.titleEl.textContent = titleText;

        const label = (settings.checkboxSettings.label.value || "Actif").toString();
        const checkFontSize = settings.checkboxSettings.fontSize.value || 12;
        const checkColor = (settings.checkboxSettings.checkColor.value as any)?.value || "#0078d4";

        this.labelEl.textContent = label;

        this.dynamicStyle.textContent = `
            .cbf-title { font-size: ${titleFontSize}pt; color: ${titleColor}; }
            .cbf-label { font-size: ${checkFontSize}pt; }
            .cbf-checkbox { accent-color: ${checkColor}; width: ${checkFontSize + 4}px; height: ${checkFontSize + 4}px; }
        `;
    }

    // Lit options.jsonFilters pour retrouver le filtre rapport actif sur la colonne booléenne.
    // Retourne true si un filtre a été trouvé et l'état restauré, false sinon.
    private restoreFromFilters(options: VisualUpdateOptions): boolean {
        try {
            const filters = options.jsonFilters as any[];
            if (!filters || !filters.length) return false;

            const categories = this.currentDataView?.categorical?.categories;
            if (!categories || !categories.length) return false;
            const column = categories[0].source;
            const targetTable  = (column.queryName || "").split(".")[0] || "";
            const targetColumn = column.displayName;

            for (const f of filters) {
                // Filtre Basic sur notre colonne ?
                if (
                    f?.target?.table  === targetTable &&
                    f?.target?.column === targetColumn &&
                    Array.isArray(f.values) &&
                    f.values.length > 0
                ) {
                    // La valeur stockée peut être un booléen natif ou la string "True"/"False"
                    const raw = f.values[0];
                    if (typeof raw === "boolean") {
                        this.isChecked = raw;
                    } else {
                        this.isChecked = String(raw).toLowerCase() === "true";
                    }
                    return true;
                }
            }
        } catch { /* noop */ }
        return false;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
