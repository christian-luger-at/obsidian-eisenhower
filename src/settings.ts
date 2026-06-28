import { App, PluginSettingTab, Setting, TFolder, AbstractInputSuggest } from 'obsidian';
import FokusFirstPlugin from './main';
import { t } from './i18n';

export type TaskScope = 'all' | 'folder';

export type SortField = 'priority' | 'dueDate' | 'alpha';

export interface QuadrantSort {
	primary: SortField;
	secondary: SortField;
}

export interface QuadrantSettings {
	tag: string;
	color: string;
	sort: QuadrantSort;
}

export interface QuadrantConfig {
	do: QuadrantSettings;
	schedule: QuadrantSettings;
	delegate: QuadrantSettings;
	eliminate: QuadrantSettings;
}

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
	urgencyDays: number;
	importantPriorities: Priority[];
	quadrants: QuadrantConfig;
	groupByPrimary: boolean;
	focusTag: string;
}

export const DEFAULT_SETTINGS: FokusFirstSettings = {
	mySetting: 'default',
	taskScope: 'all',
	taskFolder: '',
	urgencyDays: 3,
	importantPriorities: ['🔺', '⏫'],
	quadrants: {
		do:       { tag: '#do',       color: '#e03131', sort: { primary: 'priority', secondary: 'dueDate' } },
		schedule: { tag: '#schedule', color: '#1971c2', sort: { primary: 'dueDate',  secondary: 'priority' } },
		delegate: { tag: '#delegate', color: '#e8590c', sort: { primary: 'dueDate',  secondary: 'priority' } },
		eliminate:{ tag: '#eliminate',color: '#868e96', sort: { primary: 'priority', secondary: 'alpha'    } },
	},
	groupByPrimary: false,
	focusTag: '#focus',
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

		// --- Focus task ---

		new Setting(containerEl).setName(t().settings.focusHeading).setHeading();

		new Setting(containerEl)
			.setName(t().settings.focusTag.name)
			.setDesc(t().settings.focusTag.desc)
			.addText((text) =>
				text
					// eslint-disable-next-line obsidianmd/ui/sentence-case
					.setPlaceholder('#focus')
					.setValue(this.plugin.settings.focusTag)
					.onChange(async (value) => {
						this.plugin.settings.focusTag = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		// --- Eisenhower matrix rules ---

		new Setting(containerEl).setName(t().settings.matrixHeading).setHeading();

		containerEl.createEl('p', { text: t().settings.matrixDesc, cls: 'focus-first-setting-hint' });

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

		// --- Quadrant settings (one section per quadrant) ---

		new Setting(containerEl).setName(t().settings.quadrantsHeading).setHeading();

		new Setting(containerEl)
			.setName(t().settings.groupByPrimary.name)
			.setDesc(t().settings.groupByPrimary.desc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.groupByPrimary)
					.onChange(async (value) => {
						this.plugin.settings.groupByPrimary = value;
						await this.plugin.saveSettings();
					}),
			);

		const sortFieldOptions: Record<SortField, string> = {
			priority: t().settings.sortField.priority,
			dueDate:  t().settings.sortField.dueDate,
			alpha:    t().settings.sortField.alpha,
		};

		const quadrantDefs: { key: keyof QuadrantConfig; label: string }[] = [
			{ key: 'do',       label: t().view.quadrants.do.title },
			{ key: 'schedule', label: t().view.quadrants.schedule.title },
			{ key: 'delegate', label: t().view.quadrants.delegate.title },
			{ key: 'eliminate',label: t().view.quadrants.eliminate.title },
		];

		for (const def of quadrantDefs) {
			const q = this.plugin.settings.quadrants[def.key];

			new Setting(containerEl)
				.setName(`${def.label} — ${t().view.quadrants[def.key].subtitle}`)
				.setHeading();

			new Setting(containerEl)
				.setName(t().settings.quadrantColor.name)
				.setDesc(t().settings.quadrantColor.desc)
				.addText((text) => {
					text.inputEl.type = 'color';
					text.inputEl.value = q.color;
					text.inputEl.classList.add('focus-first-color-input');
					text.inputEl.addEventListener('input', () => {
						this.plugin.settings.quadrants[def.key].color = text.inputEl.value;
						void this.plugin.saveSettings();
					});
				});

			new Setting(containerEl)
				.setName(t().settings.quadrantTag.name)
				.setDesc(t().settings.quadrantTag.desc)
				.addText((text) =>
					text
						.setPlaceholder(`#${def.key}`)
						.setValue(q.tag)
						.onChange(async (value) => {
							this.plugin.settings.quadrants[def.key].tag = value.trim();
							await this.plugin.saveSettings();
						}),
				);

			new Setting(containerEl)
				.setName(t().settings.sortPrimary.name)
				.setDesc(t().settings.sortPrimary.desc)
				.addDropdown((drop) => {
					for (const [value, label] of Object.entries(sortFieldOptions)) {
						drop.addOption(value, label);
					}
					return drop
						.setValue(q.sort.primary)
						.onChange(async (value) => {
							this.plugin.settings.quadrants[def.key].sort.primary = value as SortField;
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName(t().settings.sortSecondary.name)
				.setDesc(t().settings.sortSecondary.desc)
				.addDropdown((drop) => {
					for (const [value, label] of Object.entries(sortFieldOptions)) {
						drop.addOption(value, label);
					}
					return drop
						.setValue(q.sort.secondary)
						.onChange(async (value) => {
							this.plugin.settings.quadrants[def.key].sort.secondary = value as SortField;
							await this.plugin.saveSettings();
						});
				});
		}
	}
}
