import { ItemView, WorkspaceLeaf, MarkdownView, TFile, debounce } from 'obsidian';
import FocusFirstPlugin from './main';
import { scanTasks, TaskItem } from './taskScanner';
import { classifyTasks, MatrixTask, Quadrant } from './matrixClassifier';
import { t } from './i18n';

export const FOCUS_FIRST_VIEW_TYPE = 'focus-first-view';

const QUADRANT_ORDER: Quadrant[] = ['do', 'schedule', 'delegate', 'eliminate'];

export class FocusFirstView extends ItemView {
	private plugin: FocusFirstPlugin;
	private tasks: TaskItem[] = [];
	private searchQuery = '';
	private debouncedRefresh = debounce(() => this.refresh(), 500, true);

	constructor(leaf: WorkspaceLeaf, plugin: FocusFirstPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return FOCUS_FIRST_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t().view.title;
	}

	getIcon(): string {
		return 'checkmark';
	}

	async onOpen(): Promise<void> {
		this.registerEvent(
			this.app.metadataCache.on('changed', (_file: TFile) => {
				this.debouncedRefresh();
			}),
		);
		await this.refresh();
	}

	async refresh(): Promise<void> {
		this.tasks = await scanTasks(this.app, this.plugin.settings);
		this.render();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		const header = contentEl.createDiv({ cls: 'focus-first-header' });
		header.createEl('h4', { text: t().view.title });
		const refreshBtn = header.createEl('button', { text: t().view.refresh, cls: 'focus-first-refresh-btn' });
		refreshBtn.addEventListener('click', () => { void this.refresh(); });

		const searchBar = contentEl.createDiv({ cls: 'focus-first-search-bar' });
		const searchInput = searchBar.createEl('input', {
			cls: 'focus-first-search-input',
			attr: {
				type: 'text',
				placeholder: t().view.searchPlaceholder,
				value: this.searchQuery,
			},
		});
		searchInput.addEventListener('input', () => {
			this.searchQuery = searchInput.value;
			this.renderMatrix(contentEl, matrixContainer);
		});

		const matrixContainer = contentEl.createDiv({ cls: 'focus-first-matrix-container' });
		this.renderMatrix(contentEl, matrixContainer);
	}

	private renderMatrix(contentEl: HTMLElement, container: HTMLElement): void {
		container.empty();

		const query = this.searchQuery.toLowerCase();
		const open = this.tasks
			.filter((task) => !task.completed)
			.filter((task) => {
				if (!query) return true;
				const text = task.line.replace(/^[\s\-*]*\[.\]\s*/, '').toLowerCase();
				return text.includes(query) || task.file.basename.toLowerCase().includes(query);
			});

		if (open.length === 0) {
			container.createEl('p', { text: t().view.empty, cls: 'focus-first-empty' });
			return;
		}

		const quadrants = classifyTasks(open, this.plugin.settings);
		const matrix = container.createDiv({ cls: 'focus-first-matrix' });

		for (const key of QUADRANT_ORDER) {
			const tasks = quadrants[key];
			const quadrant = t().view.quadrants[key];

			const cell = matrix.createDiv({ cls: `focus-first-quadrant focus-first-quadrant--${key}` });
			const cellHeader = cell.createDiv({ cls: 'focus-first-quadrant-header' });
			cellHeader.createEl('span', { text: quadrant.title, cls: 'focus-first-quadrant-title' });
			cellHeader.createEl('span', { text: quadrant.subtitle, cls: 'focus-first-quadrant-subtitle' });
			cellHeader.createEl('span', { text: String(tasks.length), cls: 'focus-first-quadrant-count' });

			if (tasks.length === 0) {
				cell.createEl('p', { text: '—', cls: 'focus-first-quadrant-empty' });
				continue;
			}

			const list = cell.createEl('ul', { cls: 'focus-first-task-list' });
			for (const task of tasks) {
				this.renderTask(list, task);
			}
		}
	}

	private renderTask(parent: HTMLElement, task: MatrixTask): void {
		const li = parent.createEl('li', { cls: 'focus-first-task-item' });

		const text = task.line.replace(/^[\s\-*]*\[.\]\s*/, '').replace(/(🔺|⏫|🔼|🔽|⏬)\s*/g, '').replace(/📅\s*\d{4}-\d{2}-\d{2}/g, '').trim();

		const info = li.createDiv({ cls: 'focus-first-task-info' });
		const titleEl = info.createEl('span', { text, cls: 'focus-first-task-text' });
		titleEl.addEventListener('click', () => { void this.openTask(task); });

		const meta = info.createEl('span', { cls: 'focus-first-task-meta' });
		if (task.manual) meta.createEl('span', { text: '📌', cls: 'focus-first-task-pinned', attr: { title: t().view.manualTag } });
		if (task.priority) meta.createEl('span', { text: task.priority, cls: 'focus-first-task-priority' });
		if (task.dueDate) {
			meta.createEl('span', {
				text: `📅 ${task.dueDate.toLocaleDateString()}`,
				cls: 'focus-first-task-due',
			});
		}
		meta.createEl('span', { text: task.file.basename, cls: 'focus-first-task-source' });
	}

	private async openTask(task: TaskItem): Promise<void> {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(task.file);
		const view = leaf.view;
		if (view instanceof MarkdownView) {
			view.editor.setCursor({ line: task.lineNumber, ch: 0 });
			view.editor.scrollIntoView(
				{ from: { line: task.lineNumber, ch: 0 }, to: { line: task.lineNumber, ch: 0 } },
				true,
			);
		}
	}
}
