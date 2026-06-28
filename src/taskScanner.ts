import { App, TFile } from 'obsidian';
import { FokusFirstSettings } from './settings';

export interface TaskItem {
	file: TFile;
	line: string;
	lineNumber: number;
	completed: boolean;
}

export async function scanTasks(app: App, settings: FokusFirstSettings): Promise<TaskItem[]> {
	const files = app.vault.getMarkdownFiles().filter((f) => {
		if (settings.taskScope === 'folder' && settings.taskFolder) {
			const folder = settings.taskFolder.endsWith('/')
				? settings.taskFolder
				: settings.taskFolder + '/';
			return f.path.startsWith(folder);
		}
		return true;
	});

	const results: TaskItem[] = [];

	for (const file of files) {
		const cache = app.metadataCache.getFileCache(file);
		const listItems = cache?.listItems;
		if (!listItems) continue;

		const taskItems = listItems.filter((item) => item.task !== undefined);
		if (taskItems.length === 0) continue;

		const content = await app.vault.cachedRead(file);
		const lines = content.split('\n');

		for (const item of taskItems) {
			const lineNumber = item.position.start.line;
			const line = lines[lineNumber] ?? '';
			results.push({
				file,
				line,
				lineNumber,
				completed: item.task === 'x' || item.task === 'X',
			});
		}
	}

	return results;
}
