"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class GeneralSettings extends FormattingSettingsCard {
    defaultValue = new formattingSettings.ItemDropdown({
        name: "defaultValue",
        displayName: "Default value",
        description: "Status of the checkbox when the report is loaded",
        items: [
            { value: "true", displayName: "Checked (True)" },
            { value: "false", displayName: "Unchecked (False)" }
        ],
        value: { value: "true", displayName: "Checked (True)" }
    });

    name: string = "general";
    displayName: string = "General";
    slices: Array<FormattingSettingsSlice> = [this.defaultValue];
}

class TitleSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Display the title",
        value: true
    });

    text = new formattingSettings.TextInput({
        name: "text",
        displayName: "Title text",
        placeholder: "Enter the title...",
        value: "Boolean filter"
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        value: 14,
        options: { minValue: { type: powerbi.visuals.ValidatorType.Min, value: 8 }, maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 40 } }
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        value: { value: "#333333" }
    });

    name: string = "title";
    displayName: string = "Title";
    slices: Array<FormattingSettingsSlice> = [this.show, this.text, this.fontSize, this.fontColor];
}

class CheckboxSettings extends FormattingSettingsCard {
    label = new formattingSettings.TextInput({
        name: "label",
        displayName: "Label",
        placeholder: "Ex: Active, Validated, Yes...",
        value: "Active"
    });

    checkColor = new formattingSettings.ColorPicker({
        name: "checkColor",
        displayName: "Color of the check",
        value: { value: "#0078d4" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        value: 12,
        options: { minValue: { type: powerbi.visuals.ValidatorType.Min, value: 8 }, maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 32 } }
    });

    name: string = "checkbox";
    displayName: string = "Check box";
    slices: Array<FormattingSettingsSlice> = [this.label, this.checkColor, this.fontSize];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    generalSettings = new GeneralSettings();
    titleSettings = new TitleSettings();
    checkboxSettings = new CheckboxSettings();

    cards = [this.generalSettings, this.titleSettings, this.checkboxSettings];
}
