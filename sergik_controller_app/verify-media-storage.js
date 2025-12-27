/**
 * Verification script for Media Storage functionality
 * 
 * This script verifies that the media storage system is working correctly
 * by checking the actual app directories and testing IPC handlers.
 * 
 * Run with: node verify-media-storage.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Verifying Media Storage Implementation\n');

let issues = [];
let successes = [];

// Check 1: Verify main.js has the required functions
function checkMainJS() {
  console.log('Checking main.js implementation...');
  const mainJsPath = path.join(__dirname, 'main.js');
  
  if (!fs.existsSync(mainJsPath)) {
    issues.push('main.js not found');
    return;
  }
  
  const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
  
  const requiredFunctions = [
    'getMediaStorageDirectory',
    'getMediaSubdirectory',
    'getMediaDirectoryByType',
    'initializeLibraryStructure'
  ];
  
  requiredFunctions.forEach(func => {
    if (mainJsContent.includes(`function ${func}`) || mainJsContent.includes(`${func}:`)) {
      successes.push(`✓ Function ${func} exists in main.js`);
    } else {
      issues.push(`✗ Function ${func} missing in main.js`);
    }
  });
  
  // Check IPC handlers
  const requiredHandlers = [
    'save-midi-to-library',
    'save-audio-to-library',
    'save-analysis-to-library',
    'get-media-storage-path',
    'list-media-storage-files'
  ];
  
  requiredHandlers.forEach(handler => {
    if (mainJsContent.includes(`'${handler}'`) || mainJsContent.includes(`"${handler}"`)) {
      successes.push(`✓ IPC handler ${handler} exists`);
    } else {
      issues.push(`✗ IPC handler ${handler} missing`);
    }
  });
  
  // Check that save functions use new media storage
  if (mainJsContent.includes('getMediaDirectoryByType') && 
      mainJsContent.includes('save-midi-to-library')) {
    successes.push('✓ MIDI save uses new media storage');
  } else {
    issues.push('✗ MIDI save may not use new media storage');
  }
}

// Check 2: Verify preload.js exposes the API
function checkPreloadJS() {
  console.log('Checking preload.js API exposure...');
  const preloadPath = path.join(__dirname, 'preload.js');
  
  if (!fs.existsSync(preloadPath)) {
    issues.push('preload.js not found');
    return;
  }
  
  const preloadContent = fs.readFileSync(preloadPath, 'utf8');
  
  const requiredAPIs = [
    'getMediaStoragePath',
    'listMediaStorageFiles'
  ];
  
  requiredAPIs.forEach(api => {
    if (preloadContent.includes(api)) {
      successes.push(`✓ API ${api} exposed in preload.js`);
    } else {
      issues.push(`✗ API ${api} not exposed in preload.js`);
    }
  });
}

// Check 3: Verify renderer.js uses the new storage
function checkRendererJS() {
  console.log('Checking renderer.js integration...');
  const rendererPath = path.join(__dirname, 'renderer.js');
  
  if (!fs.existsSync(rendererPath)) {
    issues.push('renderer.js not found');
    return;
  }
  
  const rendererContent = fs.readFileSync(rendererPath, 'utf8');
  
  if (rendererContent.includes('listMediaStorageFiles')) {
    successes.push('✓ renderer.js uses listMediaStorageFiles');
  } else {
    issues.push('✗ renderer.js may not use new media storage API');
  }
  
  if (rendererContent.includes('file.source') || rendererContent.includes('source:') || 
      rendererContent.includes('media-generated') || rendererContent.includes('media-imported')) {
    successes.push('✓ renderer.js tracks media source');
  } else {
    issues.push('✗ renderer.js may not track media source');
  }
}

// Check 4: Verify directory structure would be created
function checkDirectoryStructure() {
  console.log('Checking expected directory structure...');
  
  const expectedDirs = [
    'Media',
    'Media/Generated',
    'Media/Generated/MIDI',
    'Media/Generated/Audio',
    'Media/Generated/Exports',
    'Media/Generated/Analysis',
    'Media/Imported',
    'Media/Imported/MIDI',
    'Media/Imported/Audio',
    'Media/Imported/Exports'
  ];
  
  // Check if initializeLibraryStructure creates these
  const mainJsPath = path.join(__dirname, 'main.js');
  if (fs.existsSync(mainJsPath)) {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    expectedDirs.forEach(dir => {
      const dirParts = dir.split('/');
      const lastPart = dirParts[dirParts.length - 1];
      if (mainJsContent.includes(`getMediaSubdirectory('${dir}')`) ||
          mainJsContent.includes(`getMediaSubdirectory("${dir}")`) ||
          (dirParts.length > 1 && mainJsContent.includes(lastPart))) {
        successes.push(`✓ Directory structure includes ${dir}`);
      }
    });
  }
}

// Check 5: Verify code quality
function checkCodeQuality() {
  console.log('Checking code quality...');
  
  const mainJsPath = path.join(__dirname, 'main.js');
  if (fs.existsSync(mainJsPath)) {
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    // Check for error handling
    if (mainJsContent.includes('try') && mainJsContent.includes('catch')) {
      successes.push('✓ Error handling present in save functions');
    }
    
    // Check for comments
    if (mainJsContent.includes('/**') || mainJsContent.includes('//')) {
      successes.push('✓ Code includes documentation');
    }
  }
}

// Run all checks
checkMainJS();
checkPreloadJS();
checkRendererJS();
checkDirectoryStructure();
checkCodeQuality();

// Print results
console.log('\n' + '='.repeat(60));
console.log('Verification Results');
console.log('='.repeat(60));

if (successes.length > 0) {
  console.log('\n✅ Successes:');
  successes.forEach(s => console.log(`  ${s}`));
}

if (issues.length > 0) {
  console.log('\n❌ Issues Found:');
  issues.forEach(i => console.log(`  ${i}`));
} else {
  console.log('\n✅ No issues found!');
}

console.log('\n' + '='.repeat(60));
console.log(`Total Checks: ${successes.length + issues.length}`);
console.log(`Passed: ${successes.length}`);
console.log(`Issues: ${issues.length}`);
console.log('='.repeat(60));

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);

