/**
 * Test script for Media Storage functionality
 * 
 * Run with: node test-media-storage.js
 */

const fs = require('fs');
const path = require('path');

// Mock Electron app for testing (when not in Electron context)
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      // Use a test directory
      return path.join(__dirname, 'test-user-data');
    }
    return path.join(__dirname, 'test-user-data');
  }
};

// Import the functions we need to test
// Since we can't directly import from main.js, we'll replicate the logic here for testing
function getMediaStorageDirectory() {
  const userDataPath = mockApp.getPath('userData');
  const mediaPath = path.join(userDataPath, 'Media');
  
  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath, { recursive: true });
  }
  
  return mediaPath;
}

function getMediaSubdirectory(subdir) {
  const mediaPath = getMediaStorageDirectory();
  const subPath = path.join(mediaPath, subdir);
  
  if (!fs.existsSync(subPath)) {
    fs.mkdirSync(subPath, { recursive: true });
  }
  
  return subPath;
}

function getMediaDirectoryByType(type, source = 'Generated') {
  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (normalizedType === 'Midi') {
    return getMediaSubdirectory(path.join(source, 'MIDI'));
  } else if (normalizedType === 'Audio') {
    return getMediaSubdirectory(path.join(source, 'Audio'));
  } else {
    return getMediaSubdirectory(path.join(source, normalizedType));
  }
}

// Test suite
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    testResults.push({ name, status: 'PASS', error: null });
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    testResults.push({ name, status: 'FAIL', error: error.message });
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Clean up test directory before starting
const testUserDataPath = path.join(__dirname, 'test-user-data');
if (fs.existsSync(testUserDataPath)) {
  fs.rmSync(testUserDataPath, { recursive: true, force: true });
}

console.log('🧪 Testing Media Storage Functionality\n');

// Test 1: Media storage directory creation
test('Media storage directory is created', () => {
  const mediaPath = getMediaStorageDirectory();
  assert(fs.existsSync(mediaPath), 'Media directory should exist');
  assert(fs.statSync(mediaPath).isDirectory(), 'Media path should be a directory');
});

// Test 2: Subdirectories creation
test('Media subdirectories are created', () => {
  const generatedMidi = getMediaSubdirectory('Generated/MIDI');
  const generatedAudio = getMediaSubdirectory('Generated/Audio');
  const importedMidi = getMediaSubdirectory('Imported/MIDI');
  
  assert(fs.existsSync(generatedMidi), 'Generated/MIDI should exist');
  assert(fs.existsSync(generatedAudio), 'Generated/Audio should exist');
  assert(fs.existsSync(importedMidi), 'Imported/MIDI should exist');
});

// Test 3: Type-based directory retrieval
test('Media directory by type works correctly', () => {
  const midiDir = getMediaDirectoryByType('MIDI', 'Generated');
  const audioDir = getMediaDirectoryByType('Audio', 'Generated');
  const importedMidiDir = getMediaDirectoryByType('midi', 'Imported');
  
  assert(fs.existsSync(midiDir), 'MIDI directory should exist');
  assert(fs.existsSync(audioDir), 'Audio directory should exist');
  assert(fs.existsSync(importedMidiDir), 'Imported MIDI directory should exist');
  
  // Verify paths are correct
  assert(midiDir.includes('Generated'), 'MIDI dir should be in Generated');
  assert(midiDir.includes('MIDI'), 'MIDI dir should contain MIDI');
  assert(audioDir.includes('Generated'), 'Audio dir should be in Generated');
  assert(audioDir.includes('Audio'), 'Audio dir should contain Audio');
  assert(importedMidiDir.includes('Imported'), 'Imported MIDI dir should be in Imported');
});

// Test 4: File saving simulation
test('Files can be saved to media storage', () => {
  const midiDir = getMediaDirectoryByType('MIDI', 'Generated');
  const testFile = path.join(midiDir, 'test.mid');
  const testContent = Buffer.from('test midi content');
  
  fs.writeFileSync(testFile, testContent);
  assert(fs.existsSync(testFile), 'Test file should be created');
  assertEqual(fs.readFileSync(testFile).toString(), testContent.toString(), 'File content should match');
  
  // Clean up
  fs.unlinkSync(testFile);
});

// Test 5: Directory structure verification
test('Complete directory structure exists', () => {
  // Initialize all directories first
  getMediaSubdirectory('Generated');
  getMediaSubdirectory('Generated/MIDI');
  getMediaSubdirectory('Generated/Audio');
  getMediaSubdirectory('Generated/Exports');
  getMediaSubdirectory('Generated/Analysis');
  getMediaSubdirectory('Imported');
  getMediaSubdirectory('Imported/MIDI');
  getMediaSubdirectory('Imported/Audio');
  getMediaSubdirectory('Imported/Exports');
  
  const mediaPath = getMediaStorageDirectory();
  const expectedDirs = [
    'Generated',
    'Generated/MIDI',
    'Generated/Audio',
    'Generated/Exports',
    'Generated/Analysis',
    'Imported',
    'Imported/MIDI',
    'Imported/Audio',
    'Imported/Exports'
  ];
  
  expectedDirs.forEach(dir => {
    const dirPath = path.join(mediaPath, dir);
    assert(fs.existsSync(dirPath), `${dir} should exist`);
    assert(fs.statSync(dirPath).isDirectory(), `${dir} should be a directory`);
  });
});

// Test 6: Multiple file types
test('Different file types can be saved', () => {
  const midiDir = getMediaDirectoryByType('MIDI', 'Generated');
  const audioDir = getMediaDirectoryByType('Audio', 'Generated');
  
  const midiFile = path.join(midiDir, 'test.mid');
  const audioFile = path.join(audioDir, 'test.wav');
  
  fs.writeFileSync(midiFile, Buffer.from('MIDI'));
  fs.writeFileSync(audioFile, Buffer.from('AUDIO'));
  
  assert(fs.existsSync(midiFile), 'MIDI file should exist');
  assert(fs.existsSync(audioFile), 'Audio file should exist');
  
  // Clean up
  fs.unlinkSync(midiFile);
  fs.unlinkSync(audioFile);
});

// Test 7: Path consistency
test('Paths are consistent across calls', () => {
  const path1 = getMediaDirectoryByType('MIDI', 'Generated');
  const path2 = getMediaDirectoryByType('MIDI', 'Generated');
  assertEqual(path1, path2, 'Paths should be consistent');
});

// Test 8: Case insensitivity
test('Type parameter is case-insensitive', () => {
  const path1 = getMediaDirectoryByType('midi', 'Generated');
  const path2 = getMediaDirectoryByType('MIDI', 'Generated');
  const path3 = getMediaDirectoryByType('Midi', 'Generated');
  
  assertEqual(path1, path2, 'Lowercase and uppercase should match');
  assertEqual(path2, path3, 'Mixed case should match');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('Test Summary');
console.log('='.repeat(50));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\nFailed Tests:');
  testResults.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.name}: ${t.error}`);
  });
}

// Clean up test directory
if (fs.existsSync(testUserDataPath)) {
  fs.rmSync(testUserDataPath, { recursive: true, force: true });
}

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);

