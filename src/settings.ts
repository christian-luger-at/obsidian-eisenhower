import { App, PluginSettingTab, Setting, TFolder, AbstractInputSuggest } from 'obsidian';
import FokusFirstPlugin from './main';
import { t } from './i18n';

export type TaskScope = 'all' | 'folder';

export interface FokusFirstSettings {
	mySetting: string;
	taskScope: TaskScope;
	taskFolder: string;
}

export const DEFAULT_SETTINGS: FokusFirstSettings = {
	mySetting: 'default',
	taskScope: 'all',
	taskFolder: '',
};

class FolderSuggest extends AbstractInputSuggest<TFolder> {
	private inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
	}

	getSuggestions(query: string): TFolder[] {
		const lower = query.toLowerCase();
		return this.app.vault
			.getAllLoadedFiles()
			.filter((f): f is TFolder => f instanceof TFolder && f.path.toLowerCase().contains(lower))
			.slice(0, 20);
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder): void {
		this.inputEl.value = folder.path;
		this.inputEl.trigger('input');
		this.close();
	}
}

export class FokusFirstSettingTab extends PluginSettingTab {
	plugin: FokusFirstPlugin;

	constructor(app: App, plugin: FokusFirstPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t().settings.taskScope.name)
			.setDesc(t().settings.taskScope.desc)
			.addDropdown((drop) =>
				drop
					.addOption('all', t().settings.taskScope.optionAll)
					.addOption('folder', t().settings.taskScope.optionFolder)
					.setValue(this.plugin.settings.taskScope)
					.onChange(async (value: string) => {
						this.plugin.settings.taskScope = value as TaskScope;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (this.plugin.settings.taskScope === 'folder') {
			new Setting(containerEl)
				.setName(t().settings.taskFolder.name)
				.setDesc(t().settings.taskFolder.desc)
				.addText((text) => {
					text
						.setPlaceholder(t().settings.taskFolder.placeholder)
						.setValue(this.plugin.settings.taskFolder)
						.onChange(async (value) => {
							this.plugin.settings.taskFolder = value;
							await this.plugin.saveSettings();
						});
					new FolderSuggest(this.app, text.inputEl);
				});
		}
	}
}
