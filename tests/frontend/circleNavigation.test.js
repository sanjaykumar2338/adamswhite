import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layoutPath = new URL('../../resources/js/Layouts/AuthenticatedLayout.jsx', import.meta.url);
const translationsPath = new URL('../../resources/js/i18n.js', import.meta.url);

test('Circle menu opens the clean external portal in a secured new tab', async () => {
    const source = await readFile(layoutPath, 'utf8');

    assert.match(source, /href: 'https:\/\/af\.uppromote\.com\/ik9dny-b4\/register', active: false, icon: 'circle', external: true/);
    assert.match(source, /<a href=\{item\.href\} target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(source, /[?&](email|id|customer)=/);
});

test('desktop and mobile sidebars share the Circle menu implementation', async () => {
    const source = await readFile(layoutPath, 'utf8');
    const sidebarUsages = source.match(/<SidebarContent\b/g) ?? [];

    assert.equal(sidebarUsages.length, 2);
    assert.match(source, /hidden w-72[\s\S]*lg:flex/);
    assert.match(source, /lg:hidden[\s\S]*<SidebarContent/);
});

test('Circle menu labels remain available in English and French', async () => {
    const source = await readFile(translationsPath, 'utf8');

    assert.match(source, /Object\.assign\(messages\.en\.nav, \{ circle: 'SHIFTRIX Circle' \}\)/);
    assert.match(source, /Object\.assign\(messages\.fr\.nav, \{ circle: 'Cercle SHIFTRIX' \}\)/);
});
