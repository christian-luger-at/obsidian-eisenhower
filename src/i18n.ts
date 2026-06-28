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
		searchPlaceholder: string;
		manualTag: string;
		scope: string;
		scopeAll: string;
		open: string;
		done: string;
		empty: string;
		quadrants: {
			do: { title: string; subtitle: string };
			schedule: { title: string; subtitle: string };
			delegate: { title: string; subtitle: string };
			eliminate: { title: string; subtitle: string };
		};
	};
	settings: {
		setting1: { name: string; desc: string; placeholder: string };
		taskSourcesHeading: string;
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
			error: string;
		};
		matrixHeading: string;
		urgencyDays: { name: string; desc: string; error: string };
		importantPriorities: { name: string; desc: string; error: string };
		quadrantsHeading: string;
		quadrantTagsDesc: string;
		quadrantColor: string;
		quadrantTag: string;
		groupByPrimary: { name: string; desc: string };
		sortPrimary: string;
		sortSecondary: string;
		sortField: { priority: string; dueDate: string; alpha: string };
	};
	groups: {
		noPriority: string;
		overdue: string;
		today: string;
		thisWeek: string;
		upcoming: string;
		later: string;
		noDate: string;
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
			searchPlaceholder: 'Search tasks…',
			manualTag: 'Manually assigned via tag',
			scope: 'Scope',
			scopeAll: 'Entire vault',
			open: 'open',
			done: 'done',
			empty: 'No open tasks found.',
			quadrants: {
				do:       { title: 'Do',       subtitle: 'Urgent · Important' },
				schedule: { title: 'Schedule', subtitle: 'Not urgent · Important' },
				delegate: { title: 'Delegate', subtitle: 'Urgent · Not important' },
				eliminate:{ title: 'Eliminate',subtitle: 'Not urgent · Not important' },
			},
		},
		settings: {
			setting1: {
				name: 'Settings #1',
				desc: "It's a secret",
				placeholder: 'Enter your secret',
			},
			taskSourcesHeading: 'Task Sources',
			taskScope: {
				name: 'Scan scope',
				desc: 'Define where Focus First looks for tasks. Choose "Entire vault" to include all notes, or "Specific folder" to limit the search to one location.',
				optionAll: 'Entire vault',
				optionFolder: 'Specific folder',
			},
			taskFolder: {
				name: 'Folder',
				desc: 'Only tasks inside this folder (and its sub-folders) will appear in Focus First.',
				placeholder: 'e.g. Projects/Work',
				error: 'Please select a folder.',
			},
			matrixHeading: 'Eisenhower Matrix',
			urgencyDays: {
				name: 'Urgency threshold (days)',
				desc: 'A task is considered urgent when its due date is within this many days — or already past. Set to 0 to mark only overdue tasks as urgent.',
				error: 'Please enter a whole number between 0 and 364.',
			},
			importantPriorities: {
				name: 'Important priorities',
				desc: 'Tasks carrying any of the selected priority levels are placed in the "Important" axis of the matrix. Select at least one.',
				error: 'At least one priority must be selected.',
			},
			quadrantsHeading: 'Quadrants',
			quadrantTagsDesc: 'Add one of these tags to any task to pin it to a specific quadrant, overriding the automatic classification.',
			quadrantColor: 'Color',
			quadrantTag: 'Tag (manual override)',
			groupByPrimary: {
				name: 'Group by primary criterion',
				desc: 'When enabled, tasks in each quadrant are visually grouped by their primary sort field.',
			},
			sortPrimary: 'Primary sort',
			sortSecondary: 'Secondary sort',
			sortField: { priority: 'Priority', dueDate: 'Due date', alpha: 'Alphabetical' },
		},
		groups: {
			noPriority: 'No priority',
			overdue: 'Overdue',
			today: 'Today',
			thisWeek: 'This week',
			upcoming: 'Next 14 days',
			later: 'Later',
			noDate: 'No due date',
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
			searchPlaceholder: 'Aufgaben suchen…',
			manualTag: 'Manuell per Tag zugewiesen',
			scope: 'Bereich',
			scopeAll: 'Gesamter Vault',
			open: 'offen',
			done: 'erledigt',
			empty: 'Keine offenen Aufgaben gefunden.',
			quadrants: {
				do:       { title: 'Erledigen',  subtitle: 'Dringend · Wichtig' },
				schedule: { title: 'Einplanen',  subtitle: 'Nicht dringend · Wichtig' },
				delegate: { title: 'Delegieren', subtitle: 'Dringend · Nicht wichtig' },
				eliminate:{ title: 'Eliminieren',subtitle: 'Nicht dringend · Nicht wichtig' },
			},
		},
		settings: {
			setting1: {
				name: 'Einstellung #1',
				desc: 'Das ist ein Geheimnis',
				placeholder: 'Geheimnis eingeben',
			},
			taskSourcesHeading: 'Aufgabenquellen',
			taskScope: {
				name: 'Suchbereich',
				desc: 'Legt fest, wo Focus First nach Aufgaben sucht. „Gesamter Vault" durchsucht alle Notizen; „Bestimmter Ordner" begrenzt die Suche auf einen Bereich.',
				optionAll: 'Gesamter Vault',
				optionFolder: 'Bestimmter Ordner',
			},
			taskFolder: {
				name: 'Ordner',
				desc: 'Nur Aufgaben in diesem Ordner (und seinen Unterordnern) werden in Focus First angezeigt.',
				placeholder: 'z.B. Projekte/Arbeit',
				error: 'Bitte einen Ordner auswählen.',
			},
			matrixHeading: 'Eisenhower-Matrix',
			urgencyDays: {
				name: 'Dringlichkeitsschwelle (Tage)',
				desc: 'Eine Aufgabe gilt als dringend, wenn das Fälligkeitsdatum innerhalb dieser Anzahl von Tagen liegt oder bereits überschritten wurde. Wert 0 markiert nur überfällige Aufgaben als dringend.',
				error: 'Bitte eine ganze Zahl zwischen 0 und 364 eingeben.',
			},
			importantPriorities: {
				name: 'Wichtige Prioritäten',
				desc: 'Aufgaben mit einer der gewählten Prioritätsstufen werden auf der „Wichtig"-Achse der Matrix eingeordnet. Mindestens eine Priorität muss ausgewählt sein.',
				error: 'Es muss mindestens eine Priorität ausgewählt sein.',
			},
			quadrantsHeading: 'Quadranten',
			quadrantTagsDesc: 'Füge einer Aufgabe einen dieser Tags hinzu, um sie einem bestimmten Quadranten zuzuweisen. Dieser Tag überschreibt die automatische Klassifizierung.',
			quadrantColor: 'Farbe',
			quadrantTag: 'Tag (manuelle Zuweisung)',
			groupByPrimary: {
				name: 'Nach erstem Kriterium gruppieren',
				desc: 'Wenn aktiviert, werden Aufgaben in jedem Quadranten nach dem primären Sortierfeld visuell gruppiert.',
			},
			sortPrimary: 'Primäre Sortierung',
			sortSecondary: 'Sekundäre Sortierung',
			sortField: { priority: 'Priorität', dueDate: 'Fälligkeitsdatum', alpha: 'Alphabetisch' },
		},
		groups: {
			noPriority: 'Keine Priorität',
			overdue: 'Überfällig',
			today: 'Heute',
			thisWeek: 'Diese Woche',
			upcoming: 'Nächste 14 Tage',
			later: 'Später',
			noDate: 'Kein Datum',
		},
	},
};

function getLocale(): Lang {
	return moment.locale().startsWith('de') ? 'de' : 'en';
}

export function t(): Translations {
	return translations[getLocale()];
}
