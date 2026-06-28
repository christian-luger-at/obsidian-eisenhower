import { moment } from 'obsidian';

type Lang = 'en' | 'de';

interface Translations {
	ribbon: { tooltip: string };
	notice: { clicked: string };
	statusBar: { text: string };
	commands: {
		openModalSimple: { name: string };
		replaceSelected: { name: string; replacement: string };
		openModalComplex: { name: string };
		openView: { name: string };
	};
	modal: { content: string };
	view: {
		title: string;
		refresh: string;
		scope: string;
		scopeAll: string;
		open: string;
		done: string;
		empty: string;
	};
	settings: {
		setting1: { name: string; desc: string; placeholder: string };
		taskScope: {
			name: string;
			desc: string;
			optionAll: string;
			optionFolder: string;
		};
		taskFolder: {
			name: string;
			desc: string;
			placeholder: string;
		};
	};
}

const translations: Record<Lang, Translations> = {
	en: {
		ribbon: { tooltip: 'Focus first' },
		notice: { clicked: 'This is a notice!' },
		statusBar: { text: 'Status bar text' },
		commands: {
			openModalSimple: { name: 'Open modal (simple)' },
			replaceSelected: {
				name: 'Replace selected content',
				replacement: 'Sample editor command',
			},
			openModalComplex: { name: 'Open modal (complex)' },
			openView: { name: 'Open Focus First' },
		},
		modal: { content: 'Woah!' },
		view: {
			title: 'Focus First',
			refresh: 'Refresh',
			scope: 'Scope',
			scopeAll: 'Entire vault',
			open: 'open',
			done: 'done',
			empty: 'No open tasks found.',
		},
		settings: {
			setting1: {
				name: 'Settings #1',
				desc: "It's a secret",
				placeholder: 'Enter your secret',
			},
			taskScope: {
				name: 'Task scope',
				desc: 'Choose whether to scan the entire vault or only a specific folder.',
				optionAll: 'Entire vault',
				optionFolder: 'Specific folder',
			},
			taskFolder: {
				name: 'Folder',
				desc: 'Scan this folder and all its sub-folders for tasks.',
				placeholder: 'e.g. Projects/Work',
			},
		},
	},
	de: {
		ribbon: { tooltip: 'Focus First' },
		notice: { clicked: 'Das ist eine Benachrichtigung!' },
		statusBar: { text: 'Statusleisten-Text' },
		commands: {
			openModalSimple: { name: 'Modal öffnen (einfach)' },
			replaceSelected: {
				name: 'Ausgewählten Text ersetzen',
				replacement: 'Beispiel-Editorbefehl',
			},
			openModalComplex: { name: 'Modal öffnen (komplex)' },
			openView: { name: 'Focus First öffnen' },
		},
		modal: { content: 'Hallo!' },
		view: {
			title: 'Focus First',
			refresh: 'Aktualisieren',
			scope: 'Bereich',
			scopeAll: 'Gesamter Vault',
			open: 'offen',
			done: 'erledigt',
			empty: 'Keine offenen Aufgaben gefunden.',
		},
		settings: {
			setting1: {
				name: 'Einstellung #1',
				desc: 'Das ist ein Geheimnis',
				placeholder: 'Geheimnis eingeben',
			},
			taskScope: {
				name: 'Aufgabenbereich',
				desc: 'Wähle, ob der gesamte Vault oder nur ein bestimmter Ordner durchsucht werden soll.',
				optionAll: 'Gesamter Vault',
				optionFolder: 'Bestimmter Ordner',
			},
			taskFolder: {
				name: 'Ordner',
				desc: 'Diesen Ordner und alle Unterordner nach Aufgaben durchsuchen.',
				placeholder: 'z.B. Projekte/Arbeit',
			},
		},
	},
};

function getLocale(): Lang {
	return moment.locale().startsWith('de') ? 'de' : 'en';
}

export function t(): Translations {
	return translations[getLocale()];
}
