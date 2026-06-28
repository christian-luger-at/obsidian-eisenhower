import { ItemView, WorkspaceLeaf, MarkdownView, TFile, debounce } from 'obsidian';
import FocusFirstPlugin from './main';
import { scanTasks, TaskItem } from './taskScanner';
import { classifyTasks, MatrixTask, Quadrant } from './matrixClassifier';
import { SortField } from './settings';
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
			cell.style.borderTopColor = this.plugin.settings.quadrants[key].color;
			this.makeDropTarget(cell, key);
			const cellHeader = cell.createDiv({ cls: 'focus-first-quadrant-header' });
			cellHeader.createEl('span', { text: quadrant.title, cls: 'focus-first-quadrant-title' });
			cellHeader.createEl('span', { text: quadrant.subtitle, cls: 'focus-first-quadrant-subtitle' });
			cellHeader.createEl('span', { text: String(tasks.length), cls: 'focus-first-quadrant-count' });

			if (tasks.length === 0) {
				cell.createEl('p', { text: '—', cls: 'focus-first-quadrant-empty' });
				continue;
			}

			const list = cell.createEl('ul', { cls: 'focus-first-task-list' });
			const sorted = this.sortTasks(tasks, key);

			if (this.plugin.settings.groupByPrimary) {
				const primaryField = this.plugin.settings.quadrants[key].sort.primary;
				const groups = new Map<string, MatrixTask[]>();
				for (const task of sorted) {
					const gk = this.groupKey(task, primaryField);
					if (!groups.has(gk)) groups.set(gk, []);
					groups.get(gk)!.push(task);
				}
				const sortedKeys = [...groups.keys()].sort(this.groupOrder(primaryField));
				for (const gk of sortedKeys) {
					this.renderTaskGroup(list, this.groupLabel(gk, primaryField), groups.get(gk)!);
				}
			} else {
				for (const task of sorted) {
					this.renderTask(list, task);
				}
			}
		}
	}

	private renderTask(parent: HTMLElement, task: MatrixTask): void {
		const li = parent.createEl('li', { cls: 'focus-first-task-item' });
		this.makeDraggable(li, task);

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

	private static readonly PRIORITY_ORDER = ['🔺', '⏫', '🔼', '🔽', '⏬'];

	private compareFn(field: SortField): (a: MatrixTask, b: MatrixTask) => number {
		switch (field) {
			case 'priority':
				return (a, b) => {
					const ai = a.priority ? FocusFirstView.PRIORITY_ORDER.indexOf(a.priority) : 99;
					const bi = b.priority ? FocusFirstView.PRIORITY_ORDER.indexOf(b.priority) : 99;
					return ai - bi;
				};
			case 'dueDate':
				return (a, b) => {
					if (!a.dueDate && !b.dueDate) return 0;
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return a.dueDate.getTime() - b.dueDate.getTime();
				};
			case 'alpha':
				return (a, b) => {
					const textA = a.line.replace(/^[\s\-*]*\[.\]\s*/, '').toLowerCase();
					const textB = b.line.replace(/^[\s\-*]*\[.\]\s*/, '').toLowerCase();
					return textA.localeCompare(textB);
				};
		}
	}

	private sortTasks(tasks: MatrixTask[], quadrant: Quadrant): MatrixTask[] {
		const { primary, secondary } = this.plugin.settings.quadrants[quadrant].sort;
		const fns = [this.compareFn(primary), this.compareFn(secondary)];
		return [...tasks].sort((a, b) => {
			for (const fn of fns) {
				const r = fn(a, b);
				if (r !== 0) return r;
			}
			return 0;
		});
	}

	private groupKey(task: MatrixTask, field: SortField): string {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		switch (field) {
			case 'priority':
				return task.priority ?? '__none__';
			case 'dueDate': {
				if (!task.dueDate) return '__nodate__';
				const due = new Date(task.dueDate);
				due.setHours(0, 0, 0, 0);
				const diff = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
				if (diff < 0) return '__overdue__';
				if (diff === 0) return '__today__';
				const dayOfWeek = today.getDay();
				const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
				if (diff <= daysToSunday) return '__thisweek__';
				if (diff <= 14) return '__upcoming__';
				return '__later__';
			}
			case 'alpha': {
				const text = task.line.replace(/^[\s\-*]*\[.\]\s*/, '').trim();
				return text.charAt(0).toUpperCase() || '#';
			}
		}
	}

	private groupLabel(key: string, field: SortField): string {
		const g = t().groups;
		if (field === 'priority') {
			if (key === '__none__') return g.noPriority;
			return key;
		}
		if (field === 'dueDate') {
			const map: Record<string, string> = {
				'__overdue__':  g.overdue,
				'__today__':    g.today,
				'__thisweek__': g.thisWeek,
				'__upcoming__': g.upcoming,
				'__later__':    g.later,
				'__nodate__':   g.noDate,
			};
			return map[key] ?? key;
		}
		return key;
	}

	private groupOrder(field: SortField): (a: string, b: string) => number {
		if (field === 'priority') {
			const order = [...FocusFirstView.PRIORITY_ORDER, '__none__'];
			return (a, b) => order.indexOf(a) - order.indexOf(b);
		}
		if (field === 'dueDate') {
			const order = ['__overdue__', '__today__', '__thisweek__', '__upcoming__', '__later__', '__nodate__'];
			return (a, b) => order.indexOf(a) - order.indexOf(b);
		}
		return (a, b) => a.localeCompare(b);
	}

	private renderTaskGroup(list: HTMLElement, label: string, tasks: MatrixTask[]): void {
		list.createEl('li', { text: label, cls: 'focus-first-group-header' });
		for (const task of tasks) {
			this.renderTask(list, task);
		}
	}

	private makeDraggable(li: HTMLElement, task: MatrixTask): void {
		li.draggable = true;
		li.addEventListener('dragstart', (e) => {
			e.dataTransfer?.setData('application/json', JSON.stringify({
				filePath: task.file.path,
				lineNumber: task.lineNumber,
				quadrant: task.quadrant,
			}));
			li.classList.add('is-dragging');
		});
		li.addEventListener('dragend', () => {
			li.classList.remove('is-dragging');
		});
	}

	private makeDropTarget(cell: HTMLElement, targetQuadrant: Quadrant): void {
		cell.addEventListener('dragover', (e) => {
			e.preventDefault();
			cell.classList.add('is-drag-over');
		});
		cell.addEventListener('dragleave', (e) => {
			if (!cell.contains(e.relatedTarget as Node)) {
				cell.classList.remove('is-drag-over');
			}
		});
		cell.addEventListener('drop', (e) => {
			e.preventDefault();
			cell.classList.remove('is-drag-over');
			const raw = e.dataTransfer?.getData('application/json');
			if (!raw) return;
			const { filePath, lineNumber, quadrant: sourceQuadrant } = JSON.parse(raw) as {
				filePath: string;
				lineNumber: number;
				quadrant: Quadrant;
			};
			if (sourceQuadrant === targetQuadrant) return;
			void this.moveTaskToQuadrant(filePath, lineNumber, targetQuadrant);
		});
	}

	private async moveTaskToQuadrant(filePath: string, lineNumber: number, targetQuadrant: Quadrant): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) return;

		const content = await this.app.vault.read(file);
		const lines = content.split('\n');
		const line = lines[lineNumber];
		if (line === undefined) return;

		const quadrantTags = Object.values(this.plugin.settings.quadrants)
			.map((q) => q.tag.trim())
			.filter(Boolean);

		let newLine = line;
		for (const tag of quadrantTags) {
			const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			newLine = newLine.replace(new RegExp(`\\s*${escaped}(?=\\s|$)`, 'g'), '');
		}

		const targetTag = this.plugin.settings.quadrants[targetQuadrant].tag.trim();
		if (targetTag) {
			newLine = newLine.trimEnd() + ' ' + targetTag;
		}

		lines[lineNumber] = newLine;
		await this.app.vault.modify(file, lines.join('\n'));
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
