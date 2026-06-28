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
	};
	modal: { content: string };
	settings: {
		setting1: { name: string; desc: string; placeholder: string };
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
		},
		modal: { content: 'Woah!' },
		settings: {
			setting1: {
				name: 'Settings #1',
				desc: "It's a secret",
				placeholder: 'Enter your secret',
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
		},
		modal: { content: 'Hallo!' },
		settings: {
			setting1: {
				name: 'Einstellung #1',
				desc: 'Das ist ein Geheimnis',
				placeholder: 'Geheimnis eingeben',
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
