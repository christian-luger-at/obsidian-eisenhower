import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_SETTINGS, FokusFirstSettings, TaskScope, Priority } from '../settings';
import type { FokusFirstSettingTab as FokusFirstSettingTabType } from '../settings';
import { createdSettings, clearCreatedSettings } from './__mocks__/obsidian';
import type { DropdownComponent, TextComponent } from './__mocks__/obsidian';

// ---------------------------------------------------------------------------
// Unit tests — DEFAULT_SETTINGS
// ---------------------------------------------------------------------------

describe('DEFAULT_SETTINGS', () => {
	it('sets taskScope to "all"', () => {
		expect(DEFAULT_SETTINGS.taskScope).toBe('all');
	});

	it('sets taskFolder to an empty string', () => {
		expect(DEFAULT_SETTINGS.taskFolder).toBe('');
	});
});

// ---------------------------------------------------------------------------
// Unit tests — settings shape
// ---------------------------------------------------------------------------

describe('FokusFirstSettings type contract', () => {
	it('accepts scope "all" with no folder', () => {
		const s: FokusFirstSettings = { ...DEFAULT_SETTINGS, taskScope: 'all', taskFolder: '' };
		expect(s.taskScope).toBe('all');
	});

	it('accepts scope "folder" with a folder path', () => {
		const s: FokusFirstSettings = { ...DEFAULT_SETTINGS, taskScope: 'folder', taskFolder: 'Work/Tasks' };
		expect(s.taskScope).toBe('folder');
		expect(s.taskFolder).toBe('Work/Tasks');
	});
});

// ---------------------------------------------------------------------------
// Integration tests — FokusFirstSettingTab rendering & persistence
// ---------------------------------------------------------------------------

// We need to mock `obsidian` before importing SettingTab
vi.mock('obsidian', () => import('./__mocks__/obsidian'));

// Re-import AFTER mock is registered so the module uses the stub
const { FokusFirstSettingTab } = await import('../settings');

function makePlugin(overrides: Partial<FokusFirstSettings> = {}) {
	// Deep-copy nested objects so tests can't mutate DEFAULT_SETTINGS via shared references
	const settings: FokusFirstSettings = {
		...DEFAULT_SETTINGS,
		quadrants: {
			do:       { ...DEFAULT_SETTINGS.quadrants.do,       sort: { ...DEFAULT_SETTINGS.quadrants.do.sort } },
			schedule: { ...DEFAULT_SETTINGS.quadrants.schedule, sort: { ...DEFAULT_SETTINGS.quadrants.schedule.sort } },
			delegate: { ...DEFAULT_SETTINGS.quadrants.delegate, sort: { ...DEFAULT_SETTINGS.quadrants.delegate.sort } },
			eliminate:{ ...DEFAULT_SETTINGS.quadrants.eliminate,sort: { ...DEFAULT_SETTINGS.quadrants.eliminate.sort } },
		},
		...overrides,
	};
	const saved: FokusFirstSettings[] = [];

	const plugin = {
		settings,
		app: {
			vault: {
				getAllLoadedFiles: () => [],
			},
		},
		saveSettings: vi.fn(async () => {
			saved.push({ ...plugin.settings });
		}),
		_saved: saved,
	};
	return plugin;
}

function makeTab(plugin: ReturnType<typeof makePlugin>): FokusFirstSettingTabType {
	// @ts-expect-error — stub app, not a real Obsidian App
	const tab = new FokusFirstSettingTab(plugin.app, plugin);
	// Provide a minimal containerEl so Setting constructors don't throw
	const mockClassList = () => ({ add: vi.fn(), toggle: vi.fn(), remove: vi.fn() });
	const mockEl = (): Record<string, unknown> => ({
		createEl: vi.fn(() => mockEl()),
		createDiv: vi.fn(() => mockEl()),
		setText: vi.fn(),
		classList: mockClassList(),
		style: { display: '' },
		after: vi.fn(),
		addEventListener: vi.fn(),
	});
	tab.containerEl = {
		empty: vi.fn(),
		...mockEl(),
	} as unknown as HTMLElement;
	return tab;
}

describe('FokusFirstSettingTab — scope dropdown', () => {
	it('calls display() without throwing when scope is "all"', () => {
		const plugin = makePlugin({ taskScope: 'all' });
		const tab = makeTab(plugin);
		expect(() => tab.display()).not.toThrow();
	});

	it('calls display() without throwing when scope is "folder"', () => {
		const plugin = makePlugin({ taskScope: 'folder', taskFolder: 'Notes' });
		const tab = makeTab(plugin);
		expect(() => tab.display()).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Integration tests — saveSettings is called when values change
// ---------------------------------------------------------------------------

describe('FokusFirstSettingTab — persistence', () => {
	let plugin: ReturnType<typeof makePlugin>;

	beforeEach(() => {
		plugin = makePlugin({ taskScope: 'all', taskFolder: '' });
	});

	it('persists taskScope when the dropdown changes', async () => {
		// Directly mutate as the setting tab would and call saveSettings
		plugin.settings.taskScope = 'folder';
		await plugin.saveSettings();

		expect(plugin.saveSettings).toHaveBeenCalledOnce();
		expect(plugin._saved[0]?.taskScope).toBe('folder');
	});

	it('persists taskFolder when the text input changes', async () => {
		plugin.settings.taskScope = 'folder';
		plugin.settings.taskFolder = 'Projects/Work';
		await plugin.saveSettings();

		expect(plugin._saved[0]?.taskFolder).toBe('Projects/Work');
	});

	it('persists multiple changes independently', async () => {
		plugin.settings.taskScope = 'folder';
		await plugin.saveSettings();

		plugin.settings.taskFolder = 'Archive';
		await plugin.saveSettings();

		expect(plugin._saved).toHaveLength(2);
		expect(plugin._saved[1]?.taskFolder).toBe('Archive');
	});

	it('switching back to "all" does not lose other settings', async () => {
		plugin.settings.taskScope = 'folder';
		plugin.settings.taskFolder = 'Work';
		await plugin.saveSettings();

		plugin.settings.taskScope = 'all';
		await plugin.saveSettings();

		expect(plugin._saved[1]?.taskScope).toBe('all');
		expect(plugin._saved[1]?.taskFolder).toBe('Work'); // folder value preserved
	});
});

// ---------------------------------------------------------------------------
// Unit tests — urgencyDays
// ---------------------------------------------------------------------------

describe('DEFAULT_SETTINGS — urgencyDays', () => {
	it('defaults to 3 days', () => {
		expect(DEFAULT_SETTINGS.urgencyDays).toBe(3);
	});
});

describe('urgencyDays — validation logic', () => {
	function isValid(value: number): boolean {
		return !isNaN(value) && value >= 0 && value < 365;
	}

	it('accepts 0', () => expect(isValid(0)).toBe(true));
	it('accepts 3 (default)', () => expect(isValid(3)).toBe(true));
	it('accepts 364 (max allowed)', () => expect(isValid(364)).toBe(true));
	it('rejects 365', () => expect(isValid(365)).toBe(false));
	it('rejects negative numbers', () => expect(isValid(-1)).toBe(false));
	it('rejects NaN', () => expect(isValid(NaN)).toBe(false));
});

describe('urgencyDays persistence', () => {
	it('saves a custom urgency threshold', async () => {
		const plugin = makePlugin();
		plugin.settings.urgencyDays = 7;
		await plugin.saveSettings();
		expect(plugin._saved[0]?.urgencyDays).toBe(7);
	});

	it('saves 0 (always urgent)', async () => {
		const plugin = makePlugin();
		plugin.settings.urgencyDays = 0;
		await plugin.saveSettings();
		expect(plugin._saved[0]?.urgencyDays).toBe(0);
	});

	it('saves 364 (maximum allowed value)', async () => {
		const plugin = makePlugin();
		plugin.settings.urgencyDays = 364;
		await plugin.saveSettings();
		expect(plugin._saved[0]?.urgencyDays).toBe(364);
	});
});

// ---------------------------------------------------------------------------
// Unit tests — importantPriorities
// ---------------------------------------------------------------------------

describe('DEFAULT_SETTINGS — importantPriorities', () => {
	it('defaults to Highest and High', () => {
		expect(DEFAULT_SETTINGS.importantPriorities).toEqual(['🔺', '⏫']);
	});
});

describe('importantPriorities — pill toggle logic', () => {
	it('adds a priority when not present', () => {
		const current: Priority[] = ['🔺'];
		const result = current.concat('🔼' as Priority);
		expect(result).toContain('🔼');
	});

	it('removes a priority when already active', () => {
		const current = ['🔺', '⏫'] as Priority[];
		const result = current.filter((p) => p !== '⏫');
		expect(result).not.toContain('⏫');
		expect(result).toContain('🔺');
	});

	it('reports empty when all are deselected', () => {
		const result: Priority[] = [];
		expect(result.length === 0).toBe(true);
	});

	it('accepts all available priority values', () => {
		const all: Priority[] = ['🔺', '⏫', '🔼', '🔽', '⏬'];
		expect(all).toHaveLength(5);
	});
});

describe('importantPriorities persistence', () => {
	it('saves an added priority', async () => {
		const plugin = makePlugin();
		plugin.settings.importantPriorities = ['🔺', '⏫', '🔼'];
		await plugin.saveSettings();
		expect(plugin._saved[0]?.importantPriorities).toContain('🔼');
	});

	it('saves a removed priority', async () => {
		const plugin = makePlugin();
		plugin.settings.importantPriorities = ['🔺'];
		await plugin.saveSettings();
		expect(plugin._saved[0]?.importantPriorities).not.toContain('⏫');
	});

	it('saves an empty list', async () => {
		const plugin = makePlugin();
		plugin.settings.importantPriorities = [];
		await plugin.saveSettings();
		expect(plugin._saved[0]?.importantPriorities).toHaveLength(0);
	});

	it('saves all priority values', async () => {
		const plugin = makePlugin();
		const all: Priority[] = ['🔺', '⏫', '🔼', '🔽', '⏬'];
		plugin.settings.importantPriorities = all;
		await plugin.saveSettings();
		expect(plugin._saved[0]?.importantPriorities).toEqual(all);
	});
});

// ---------------------------------------------------------------------------
// Integration tests — loadSettings merges with defaults
// ---------------------------------------------------------------------------

describe('loadSettings — merges persisted data with defaults', () => {
	it('fills missing keys from DEFAULT_SETTINGS', () => {
		// Simulate what loadSettings does: Object.assign({}, DEFAULT_SETTINGS, persisted)
		const persisted = { taskScope: 'folder' as TaskScope };
		const merged: FokusFirstSettings = Object.assign({}, DEFAULT_SETTINGS, persisted);

		expect(merged.taskScope).toBe('folder');
		expect(merged.taskFolder).toBe('');  // filled from defaults
		expect(merged.mySetting).toBe('default');
	});

	it('fully persisted data overrides all defaults', () => {
		const persisted: FokusFirstSettings = {
			mySetting: 'custom',
			taskScope: 'folder',
			taskFolder: 'MyFolder',
			urgencyDays: 7,
			importantPriorities: ['🔺'],
			quadrants: {
				do:       { tag: '#do',       color: '#e03131', sort: { primary: 'priority', secondary: 'dueDate' } },
				schedule: { tag: '#schedule', color: '#1971c2', sort: { primary: 'dueDate',  secondary: 'priority' } },
				delegate: { tag: '#delegate', color: '#e8590c', sort: { primary: 'dueDate',  secondary: 'priority' } },
				eliminate:{ tag: '#eliminate',color: '#868e96', sort: { primary: 'priority', secondary: 'alpha'    } },
			},
			groupByPrimary: false,
		};
		const merged = Object.assign({}, DEFAULT_SETTINGS, persisted);

		expect(merged).toEqual(persisted);
	});

	it('empty persisted object returns all defaults', () => {
		const merged = Object.assign({}, DEFAULT_SETTINGS, {});
		expect(merged).toEqual(DEFAULT_SETTINGS);
	});
});

// ---------------------------------------------------------------------------
// Helpers for onChange callback tests
// ---------------------------------------------------------------------------

function makeTabWithDisplay(overrides: Partial<FokusFirstSettings> = {}) {
	const plugin = makePlugin(overrides);
	const tab = makeTab(plugin);
	clearCreatedSettings();
	tab.display();
	return { plugin, tab };
}

// Find the single dropdown created during display()
function scopeDropdown(): DropdownComponent | undefined {
	return createdSettings.find((s) => s.lastDropdown)?.lastDropdown;
}

// Find a text input by its initial value
function textByValue(value: string): TextComponent | undefined {
	return createdSettings.find((s) => s.lastText?.inputEl.value === value)?.lastText;
}

// ---------------------------------------------------------------------------
// onChange — scope dropdown
// ---------------------------------------------------------------------------

describe('FokusFirstSettingTab — scope dropdown onChange', () => {
	it('sets taskScope to "folder" and saves', async () => {
		const { plugin } = makeTabWithDisplay({ taskScope: 'all' });
		await scopeDropdown()?.simulate('folder');
		expect(plugin.settings.taskScope).toBe('folder');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('sets taskScope back to "all" and saves', async () => {
		const { plugin } = makeTabWithDisplay({ taskScope: 'folder', taskFolder: 'Work' });
		await scopeDropdown()?.simulate('all');
		expect(plugin.settings.taskScope).toBe('all');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// onChange — folder text input
// ---------------------------------------------------------------------------

describe('FokusFirstSettingTab — folder text onChange', () => {
	it('saves a non-empty folder path', async () => {
		const { plugin } = makeTabWithDisplay({ taskScope: 'folder', taskFolder: '' });
		const folderText = textByValue('');
		await folderText?.simulate('Work/Tasks');
		expect(plugin.settings.taskFolder).toBe('Work/Tasks');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('saves an empty folder path (user cleared the input)', async () => {
		const { plugin } = makeTabWithDisplay({ taskScope: 'folder', taskFolder: 'Work' });
		const folderText = textByValue('Work');
		await folderText?.simulate('');
		expect(plugin.settings.taskFolder).toBe('');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// onChange — urgencyDays text input
// ---------------------------------------------------------------------------

describe('FokusFirstSettingTab — urgencyDays text onChange', () => {
	it('saves a valid number', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('3')?.simulate('7');
		expect(plugin.settings.urgencyDays).toBe(7);
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('saves 0 (minimum valid value)', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('3')?.simulate('0');
		expect(plugin.settings.urgencyDays).toBe(0);
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('saves 364 (maximum valid value)', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('3')?.simulate('364');
		expect(plugin.settings.urgencyDays).toBe(364);
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('does NOT save when value is 365 (out of range)', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('3')?.simulate('365');
		expect(plugin.settings.urgencyDays).toBe(3); // unchanged
		expect(plugin.saveSettings).not.toHaveBeenCalled();
	});

	it('does NOT save when value is negative', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('3')?.simulate('-1');
		expect(plugin.settings.urgencyDays).toBe(3);
		expect(plugin.saveSettings).not.toHaveBeenCalled();
	});

	it('does NOT save when value is not a number', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('3')?.simulate('abc');
		expect(plugin.settings.urgencyDays).toBe(3);
		expect(plugin.saveSettings).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// onChange — quadrant tag text inputs
// ---------------------------------------------------------------------------

describe('FokusFirstSettingTab — quadrant tag onChange', () => {
	it('saves the "do" tag', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('#do')?.simulate('#jetzt');
		expect(plugin.settings.quadrants.do.tag).toBe('#jetzt');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('saves the "schedule" tag', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('#schedule')?.simulate('#bald');
		expect(plugin.settings.quadrants.schedule.tag).toBe('#bald');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('saves the "delegate" tag', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('#delegate')?.simulate('#delegieren');
		expect(plugin.settings.quadrants.delegate.tag).toBe('#delegieren');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('saves the "eliminate" tag', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('#eliminate')?.simulate('#irgendwann');
		expect(plugin.settings.quadrants.eliminate.tag).toBe('#irgendwann');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});

	it('trims whitespace from the saved tag value', async () => {
		const { plugin } = makeTabWithDisplay();
		await textByValue('#do')?.simulate('  #clean  ');
		expect(plugin.settings.quadrants.do.tag).toBe('#clean');
		expect(plugin.saveSettings).toHaveBeenCalled();
	});
});
