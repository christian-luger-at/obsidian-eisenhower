import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Modal,
	Notice,
	Plugin,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	EisenhowerSettingTab,
	EisenhowerSettings,
} from './settings';
import { t } from './i18n';

export default class EisenhowerPlugin extends Plugin {
	settings!: EisenhowerSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('checkmark', t().ribbon.tooltip, (_evt: MouseEvent) => {
			new Notice(t().notice.clicked);
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText(t().statusBar.text);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: t().commands.openModalSimple.name,
			callback: () => {
				new EisenhowerModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'replace-selected',
			name: t().commands.replaceSelected.name,
			editorCallback: (
				editor: Editor,
				_ctx: MarkdownView | MarkdownFileInfo,
			) => {
				editor.replaceSelection(t().commands.replaceSelected.replacement);
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-modal-complex',
			name: t().commands.openModalComplex.name,
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new EisenhowerModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new EisenhowerSettingTab(this.app, this));

	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<EisenhowerSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class EisenhowerModal extends Modal {
	onOpen() {
		const { contentEl } = this;
		contentEl.setText(t().modal.content);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
