import { App, PluginSettingTab, Setting } from 'obsidian';
import EisenhowerPlugin from './main';
import { t } from './i18n';

export interface EisenhowerSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: EisenhowerSettings = {
	mySetting: 'default',
};

export class EisenhowerSettingTab extends PluginSettingTab {
	plugin: EisenhowerPlugin;

	constructor(app: App, plugin: EisenhowerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(t().settings.setting1.name)
			.setDesc(t().settings.setting1.desc)
			.addText((text) =>
				text
					.setPlaceholder(t().settings.setting1.placeholder)
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
