import { App, PluginSettingTab, Setting } from 'obsidian';
import FokusFirstPlugin from './main';
import { t } from './i18n';

export interface FokusFirstSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: FokusFirstSettings = {
	mySetting: 'default',
};

export class FokusFirstSettingTab extends PluginSettingTab {
	plugin: FokusFirstPlugin;

	constructor(app: App, plugin: FokusFirstPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// new Setting(containerEl)
		// 	.setName(t().settings.setting1.name)
		// 	.setDesc(t().settings.setting1.desc)
		// 	.addText((text) =>
		// 		text
		// 			.setPlaceholder(t().settings.setting1.placeholder)
		// 			.setValue(this.plugin.settings.mySetting)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.mySetting = value;
		// 				await this.plugin.saveSettings();
		// 			}),
		// 	);
	}
}
