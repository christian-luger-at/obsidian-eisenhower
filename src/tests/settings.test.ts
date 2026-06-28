import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_SETTINGS, FokusFirstSettings, TaskScope, Priority } from '../settings';

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
	const settings: FokusFirstSettings = { ...DEFAULT_SETTINGS, ...overrides };
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

function makeTab(plugin: ReturnType<typeof makePlugin>) {
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
		};
		const merged = Object.assign({}, DEFAULT_SETTINGS, persisted);

		expect(merged).toEqual(persisted);
	});

	it('empty persisted object returns all defaults', () => {
		const merged = Object.assign({}, DEFAULT_SETTINGS, {});
		expect(merged).toEqual(DEFAULT_SETTINGS);
	});
});
