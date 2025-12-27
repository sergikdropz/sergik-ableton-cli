/**
 * @fileoverview Workflow Handlers - Handles workflow automation
 * @module workflow-handlers
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('WorkflowHandlers');

/**
 * WorkflowHandlers class handles workflow automation
 */
export class WorkflowHandlers {
    /**
     * Create a WorkflowHandlers instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Show auto-organize dialog and run workflow
     * @returns {Promise<Object|null>} User selections or null if cancelled
     */
    async showOrganizeDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'workflow-modal';
            modal.innerHTML = `
                <div class="workflow-modal-content">
                    <div class="workflow-modal-header">
                        <h3>Auto-Organize Workflow</h3>
                        <button class="workflow-modal-close">&times;</button>
                    </div>
                    <div class="workflow-modal-body">
                        <div class="form-group">
                            <label>Source Directories (comma-separated):</label>
                            <input type="text" id="organize-sources"
                                    placeholder="/path/to/source1, /path/to/source2"
                                   value="/Users/machd/Desktop/SERGIKDROPZ">
                        </div>
                        <div class="form-group">
                            <label>Target Base Directory:</label>
                            <input type="text" id="organize-target"
                                    placeholder="/path/to/organized"
                                   value="/Users/machd/Desktop/SERGIK_Organized">
                        </div>
                        <div class="form-group">
                            <label>Organize By:</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="organize-by" value="genre" checked> Genre</label>
                                <label><input type="checkbox" name="organize-by" value="bpm" checked> BPM</label>
                                <label><input type="checkbox" name="organize-by" value="key"> Key</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Action:</label>
                            <select id="organize-action">
                                <option value="copy">Copy Files</option>
                                <option value="move">Move Files</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="organize-dry-run" checked>
                                 Preview Only (Dry Run)
                            </label>
                        </div>
                    </div>
                    <div class="workflow-modal-footer">
                        <button class="btn btn-secondary" id="organize-cancel">Cancel</button>
                        <button class="btn btn-primary" id="organize-run">Run Workflow</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const closeModal = () => {
                document.body.removeChild(modal);
                resolve(null);
            };

            modal.querySelector('.workflow-modal-close').onclick = closeModal;
            modal.querySelector('#organize-cancel').onclick = closeModal;

            modal.querySelector('#organize-run').onclick = async () => {
                const sources = modal.querySelector('#organize-sources').value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s);

                const target = modal.querySelector('#organize-target').value.trim();
                const organizeBy = Array.from(
                    modal.querySelectorAll('input[name="organize-by"]:checked')
                ).map(cb => cb.value);

                const action = modal.querySelector('#organize-action').value;
                const dryRun = modal.querySelector('#organize-dry-run').checked;

                if (!sources.length || !target || !organizeBy.length) {
                    alert('Please fill in all required fields');
                    return;
                }

                closeModal();

                resolve({
                    sourceDirs: sources,
                    targetBase: target,
                    organizeBy: organizeBy,
                    action: action,
                    dryRun: dryRun
                });
            };
        });
    }

    /**
     * Run auto-organize workflow
     * @param {Object} options - Organization options
     * @returns {Promise<Object>} Organization result
     */
    async autoOrganize(options) {
        try {
            logger.debug('Starting auto-organize workflow', options);

            const response = await fetch(`${this.apiBaseUrl}/api/organize/auto-organize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_dirs: options.sourceDirs,
                    target_base: options.targetBase,
                    organize_by: options.organizeBy,
                    action: options.action,
                    dry_run: options.dryRun
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Organization failed');
            }

            const result = await response.json();
            logger.info('Auto-organize completed', result);
            return result;
        } catch (error) {
            logger.error('Auto-organize failed', error);
            throw error;
        }
    }

    /**
     * Show batch export dialog
     * @returns {Promise<Object|null>} User selections or null if cancelled
     */
    async showBatchExportDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'workflow-modal';
            modal.innerHTML = `
                <div class="workflow-modal-content">
                    <div class="workflow-modal-header">
                        <h3>Batch Export Workflow</h3>
                        <button class="workflow-modal-close">&times;</button>
                    </div>
                    <div class="workflow-modal-body">
                        <div class="form-group">
                            <label>Export Format:</label>
                            <select id="export-format">
                                <option value="wav">WAV</option>
                                <option value="mp3">MP3</option>
                                <option value="aif">AIFF</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Export Location:</label>
                            <input type="text" id="export-location"
                                    placeholder="/path/to/exports"
                                   value="/Users/machd/Desktop/SERGIK_Exports">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="export-stems" checked>
                                 Export Stems
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Track Selection:</label>
                            <select id="export-tracks" multiple>
                                <option value="all">All Tracks</option>
                            </select>
                        </div>
                    </div>
                    <div class="workflow-modal-footer">
                        <button class="btn btn-secondary" id="export-cancel">Cancel</button>
                        <button class="btn btn-primary" id="export-run">Run Export</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const closeModal = () => {
                document.body.removeChild(modal);
                resolve(null);
            };

            modal.querySelector('.workflow-modal-close').onclick = closeModal;
            modal.querySelector('#export-cancel').onclick = closeModal;

            modal.querySelector('#export-run').onclick = async () => {
                const format = modal.querySelector('#export-format').value;
                const location = modal.querySelector('#export-location').value.trim();
                const exportStems = modal.querySelector('#export-stems').checked;
                const tracks = Array.from(modal.querySelector('#export-tracks').selectedOptions)
                    .map(opt => opt.value);

                if (!location) {
                    alert('Please specify export location');
                    return;
                }

                closeModal();

                resolve({
                    format: format,
                    location: location,
                    exportStems: exportStems,
                    tracks: tracks
                });
            };
        });
    }

    /**
     * Run batch export workflow
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export result
     */
    async batchExport(options) {
        try {
            logger.debug('Starting batch export', options);

            const response = await fetch(`${this.apiBaseUrl}/api/export/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    format: options.format,
                    location: options.location,
                    export_stems: options.exportStems,
                    tracks: options.tracks
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Batch export failed');
            }

            const result = await response.json();
            logger.info('Batch export completed', result);
            return result;
        } catch (error) {
            logger.error('Batch export failed', error);
            throw error;
        }
    }

    /**
     * Show DNA analysis dialog
     * @returns {Promise<Object|null>} User selections or null if cancelled
     */
    async showDNAAnalysisDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'workflow-modal';
            modal.innerHTML = `
                <div class="workflow-modal-content">
                    <div class="workflow-modal-header">
                        <h3>DNA Analysis Workflow</h3>
                        <button class="workflow-modal-close">&times;</button>
                    </div>
                    <div class="workflow-modal-body">
                        <div class="form-group">
                            <label>Source Directory:</label>
                            <input type="text" id="dna-source"
                                    placeholder="/path/to/tracks"
                                   value="/Users/machd/Desktop/SERGIKDROPZ">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="dna-include-musicbrainz" checked>
                                 Include MusicBrainz Data
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="dna-generate-profiles" checked>
                                 Generate DNA Profiles
                            </label>
                        </div>
                    </div>
                    <div class="workflow-modal-footer">
                        <button class="btn btn-secondary" id="dna-cancel">Cancel</button>
                        <button class="btn btn-primary" id="dna-run">Run Analysis</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const closeModal = () => {
                document.body.removeChild(modal);
                resolve(null);
            };

            modal.querySelector('.workflow-modal-close').onclick = closeModal;
            modal.querySelector('#dna-cancel').onclick = closeModal;

            modal.querySelector('#dna-run').onclick = async () => {
                const source = modal.querySelector('#dna-source').value.trim();
                const includeMusicBrainz = modal.querySelector('#dna-include-musicbrainz').checked;
                const generateProfiles = modal.querySelector('#dna-generate-profiles').checked;

                if (!source) {
                    alert('Please specify source directory');
                    return;
                }

                closeModal();

                resolve({
                    sourceDir: source,
                    includeMusicBrainz: includeMusicBrainz,
                    generateProfiles: generateProfiles
                });
            };
        });
    }

    /**
     * Run DNA analysis workflow
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Analysis result
     */
    async dnaAnalysis(options) {
        try {
            logger.debug('Starting DNA analysis', options);

            const response = await fetch(`${this.apiBaseUrl}/api/analyze/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_dir: options.sourceDir,
                    include_musicbrainz: options.includeMusicBrainz,
                    generate_profiles: options.generateProfiles
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'DNA analysis failed');
            }

            const result = await response.json();
            logger.info('DNA analysis completed', result);
            return result;
        } catch (error) {
            logger.error('DNA analysis failed', error);
            throw error;
        }
    }

    /**
     * Create custom workflow (future feature)
     * @returns {Promise<void>}
     */
    async createWorkflow() {
        // Future implementation
        alert('Workflow builder coming soon!');
    }
}

