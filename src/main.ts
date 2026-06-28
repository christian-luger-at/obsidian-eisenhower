import { Plugin, WorkspaceLeaf } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	FokusFirstSettingTab,
	FokusFirstSettings,
} from './settings';
import { t } from './i18n';
import { FocusFirstView, FOCUS_FIRST_VIEW_TYPE } from './TaskView';

export default class FocusFirstPlugin extends Plugin {
	settings!: FokusFirstSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			FOCUS_FIRST_VIEW_TYPE,
			(leaf) => new FocusFirstView(leaf, this),
		);

		this.addRibbonIcon('checkmark', t().ribbon.tooltip, async () => {
			await this.activateView();
		});

		this.addCommand({
			id: 'open-focus-first',
			name: t().commands.openView.name,
			callback: async () => await this.activateView(),
		});

		this.addSettingTab(new FokusFirstSettingTab(this.app, this));
	}

	onunload() {
		
	}

	async activateView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const existing = workspace.getLeavesOfType(FOCUS_FIRST_VIEW_TYPE);

		if (existing.length > 0) {
			leaf = existing[0] ?? null;
		} else {
			leaf = workspace.getRightLeaf(false) ?? null;
			await leaf?.setViewState({ type: FOCUS_FIRST_VIEW_TYPE, active: true });
		}

		if (leaf) await workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<FokusFirstSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
