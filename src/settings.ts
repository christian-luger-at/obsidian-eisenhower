import { App, PluginSettingTab, Setting, TFolder, AbstractInputSuggest } from 'obsidian';
import FokusFirstPlugin from './main';
import { t } from './i18n';

export type TaskScope = 'all' | 'folder';

// Priority values as used by the Obsidian Tasks plugin
export const PRIORITY_OPTIONS = [
	{ value: '🔺', label: '🔺 Highest' },
	{ value: '⏫', label: '⏫ High' },
	{ value: '🔼', label: '🔼 Medium' },
	{ value: '🔽', label: '🔽 Low' },
	{ value: '⏬', label: '⏬ Lowest' },
] as const;

export type Priority = (typeof PRIORITY_OPTIONS)[number]['value'];

export interface FokusFirstSettings {
	mySetting: string;
	taskScope: TaskScope;
	taskFolder: string;
	urgencyDays: number;        // tasks due within this many days (or overdue) are urgent
	importantPriorities: Priority[]; // tasks with these priorities are considered important
}

export const DEFAULT_SETTINGS: FokusFirstSettings = {
	mySetting: 'default',
	taskScope: 'all',
	taskFolder: '',
	urgencyDays: 3,
	importantPriorities: ['🔺', '⏫'],
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

		new Setting(containerEl).setName(t().settings.taskSourcesHeading).setHeading();

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
			const folderSetting = new Setting(containerEl)
				.setName(t().settings.taskFolder.name)
				.setDesc(t().settings.taskFolder.desc)
				.addText((text) => {
					text
						.setPlaceholder(t().settings.taskFolder.placeholder)
						.setValue(this.plugin.settings.taskFolder)
						.onChange(async (value) => {
							const empty = value.trim() === '';
							text.inputEl.classList.toggle('is-invalid', empty);
							folderErrorEl.classList.toggle('focus-first-hidden', !empty);
							this.plugin.settings.taskFolder = value;
							await this.plugin.saveSettings();
						});
					new FolderSuggest(this.app, text.inputEl);
				});

			const folderErrorEl = containerEl.createEl('p', {
				text: t().settings.taskFolder.error,
				cls: 'focus-first-setting-error',
			});
			folderErrorEl.classList.toggle(
				'focus-first-hidden',
				this.plugin.settings.taskFolder.trim() !== '',
			);
			folderSetting.settingEl.after(folderErrorEl);
		}

		// --- Eisenhower matrix rules ---

		new Setting(containerEl).setName(t().settings.matrixHeading).setHeading();

		const urgencySetting = new Setting(containerEl)
			.setName(t().settings.urgencyDays.name)
			.setDesc(t().settings.urgencyDays.desc)
			.addText((text) => {
				text
					.setPlaceholder('3')
					.setValue(String(this.plugin.settings.urgencyDays))
					.onChange(async (value) => {
						const parsed = parseInt(value, 10);
						const valid = !isNaN(parsed) && parsed >= 0 && parsed < 365;
						text.inputEl.classList.toggle('is-invalid', !valid);
						errorEl.classList.toggle('focus-first-hidden', valid);
						if (valid) {
							this.plugin.settings.urgencyDays = parsed;
							await this.plugin.saveSettings();
						}
					});
				text.inputEl.setAttribute('type', 'number');
				text.inputEl.setAttribute('min', '0');
				text.inputEl.setAttribute('max', '364');
			});

		const errorEl = containerEl.createEl('p', {
			text: t().settings.urgencyDays.error,
			cls: 'focus-first-setting-error',
		});
		errorEl.classList.add('focus-first-hidden');
		urgencySetting.settingEl.after(errorEl);

		const prioritySetting = new Setting(containerEl)
			.setName(t().settings.importantPriorities.name)
			.setDesc(t().settings.importantPriorities.desc);

		const pillGroup = prioritySetting.controlEl.createDiv({ cls: 'focus-first-pill-group' });

		const priorityErrorEl = containerEl.createEl('p', {
			text: t().settings.importantPriorities.error,
			cls: 'focus-first-setting-error',
		});
		priorityErrorEl.classList.add('focus-first-hidden');
		prioritySetting.settingEl.after(priorityErrorEl);

		const updatePills = () => {
			const noneSelected = this.plugin.settings.importantPriorities.length === 0;
			priorityErrorEl.classList.toggle('focus-first-hidden', !noneSelected);
		};

		for (const option of PRIORITY_OPTIONS) {
			const pill = pillGroup.createEl('button', {
				text: option.label,
				cls: 'focus-first-pill',
			});
			if (this.plugin.settings.importantPriorities.includes(option.value)) {
				pill.classList.add('is-active');
			}
			pill.addEventListener('click', () => { void (async () => {
				const current = this.plugin.settings.importantPriorities;
				const isActive = current.includes(option.value);
				this.plugin.settings.importantPriorities = isActive
					? current.filter((p) => p !== option.value)
					: [...current, option.value];
				pill.classList.toggle('is-active', !isActive);
				await this.plugin.saveSettings();
				updatePills();
			})(); });
		}

		updatePills();
	}
}
