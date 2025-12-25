/**
 * Verification script to check all modules are properly set up
 */

import { GenreManager } from './js/genre-manager.js';
import { UIController } from './js/ui-controller.js';
import { StateManager } from './js/state-manager.js';
import { VirtualDOM, h } from './js/virtual-dom.js';
import { getGenreInfo } from './js/genre-info.js';

console.log('🔍 Verifying Genre System Setup...\n');

// Test 1: GenreManager
console.log('1. Testing GenreManager...');
try {
    const manager = new GenreManager();
    const subGenres = manager.getSubGenres('house');
    console.log(`   ✅ GenreManager works - House has ${subGenres.length} sub-genres`);
} catch (error) {
    console.error('   ❌ GenreManager failed:', error.message);
}

// Test 2: StateManager
console.log('2. Testing StateManager...');
try {
    const stateManager = new StateManager();
    stateManager.selectGenre('techno');
    const state = stateManager.getState();
    console.log(`   ✅ StateManager works - Current genre: ${state.selectedGenre}`);
} catch (error) {
    console.error('   ❌ StateManager failed:', error.message);
}

// Test 3: Virtual DOM
console.log('3. Testing VirtualDOM...');
try {
    const container = document.createElement('div');
    const vdom = new VirtualDOM(container);
    vdom.render(h('div', { className: 'test' }, 'Hello'));
    console.log('   ✅ VirtualDOM works - Can create and render nodes');
} catch (error) {
    console.error('   ❌ VirtualDOM failed:', error.message);
}

// Test 4: Genre Info
console.log('4. Testing Genre Info...');
try {
    const info = getGenreInfo('house');
    if (info) {
        console.log(`   ✅ Genre Info works - House BPM: ${info.bpmRange}`);
    } else {
        console.log('   ⚠️  Genre Info - No info for house (may need to add)');
    }
} catch (error) {
    console.error('   ❌ Genre Info failed:', error.message);
}

// Test 5: Check all modules exist
console.log('5. Checking module files...');
const modules = [
    'js/config.js',
    'js/genre-manager.js',
    'js/ui-controller.js',
    'js/genre-system.js',
    'js/genre-search.js',
    'js/recent-selections.js',
    'js/genre-tooltips.js',
    'js/genre-info.js',
    'js/genre-visuals.js',
    'js/state-manager.ts',
    'js/virtual-dom.ts',
    'js/genre-system-enhanced.ts'
];

let allExist = true;
for (const module of modules) {
    try {
        const fs = await import('fs');
        const exists = fs.existsSync(module);
        if (exists) {
            console.log(`   ✅ ${module}`);
        } else {
            console.log(`   ❌ ${module} - Missing`);
            allExist = false;
        }
    } catch (error) {
        // Skip file system check in browser
    }
}

console.log('\n✨ Verification complete!');
console.log('\n📚 Next steps:');
console.log('   1. Run: npm run dev');
console.log('   2. Open: http://localhost:8000/SERGIK_AI_Controller_Preview.html');
console.log('   3. Test the genre dropdown system');

