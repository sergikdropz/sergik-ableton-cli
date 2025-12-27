/**
 * @fileoverview Energy Intelligence UI - Displays energy analysis intelligence
 * @module energy-intelligence-ui
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('EnergyIntelligenceUI');

/**
 * EnergyIntelligenceUI class handles energy intelligence visualization
 */
export class EnergyIntelligenceUI {
    /**
     * Create an EnergyIntelligenceUI instance
     */
    constructor() {
        this.containerId = 'energy-intelligence-display';
    }

    /**
     * Display energy intelligence data
     * @param {Object} intelligence - Energy intelligence data from analysis
     */
    display(intelligence) {
        if (!intelligence) {
            logger.warn('No intelligence data provided');
            return;
        }

        try {
            // Find or create container
            let container = document.getElementById(this.containerId);
            if (!container) {
                container = this._createContainer();
            }

            // Clear existing content
            container.innerHTML = '';

            // Display emotional intelligence
            if (intelligence.emotional) {
                container.appendChild(this._createEmotionalSection(intelligence.emotional));
            }

            // Display psychological intelligence
            if (intelligence.psychological) {
                container.appendChild(this._createPsychologicalSection(intelligence.psychological));
            }

            // Display sonic intelligence
            if (intelligence.sonic) {
                container.appendChild(this._createSonicSection(intelligence.sonic));
            }

            // Display intent intelligence
            if (intelligence.intent) {
                container.appendChild(this._createIntentSection(intelligence.intent));
            }

            logger.info('Energy intelligence displayed');
        } catch (error) {
            logger.error('Failed to display energy intelligence', error);
        }
    }

    /**
     * Create container element
     * @private
     */
    _createContainer() {
        const container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'energy-intelligence-container';
        
        // Try to find analyze tab to add it there
        const analyzeTab = document.getElementById('tab-section-analyze');
        if (analyzeTab) {
            analyzeTab.appendChild(container);
        } else {
            document.body.appendChild(container);
        }

        return container;
    }

    /**
     * Create emotional intelligence section
     * @private
     */
    _createEmotionalSection(emotional) {
        const section = document.createElement('div');
        section.className = 'intelligence-section emotional';
        section.innerHTML = `
            <div class="section-header">
                <h4>🎭 Emotional Intelligence</h4>
            </div>
            <div class="section-content">
                <div class="intelligence-item">
                    <span class="label">Category:</span>
                    <span class="value">${emotional.category || 'N/A'}</span>
                </div>
                <div class="intelligence-item">
                    <span class="label">Valence:</span>
                    <span class="value">${(emotional.valence || 0).toFixed(2)}</span>
                    <div class="bar">
                        <div class="bar-fill" style="width: ${((emotional.valence || 0) + 1) * 50}%"></div>
                    </div>
                </div>
                <div class="intelligence-item">
                    <span class="label">Arousal:</span>
                    <span class="value">${(emotional.arousal || 0).toFixed(2)}</span>
                    <div class="bar">
                        <div class="bar-fill" style="width: ${(emotional.arousal || 0) * 100}%"></div>
                    </div>
                </div>
                ${emotional.emotions ? `
                <div class="intelligence-item">
                    <span class="label">Emotions:</span>
                    <span class="value">${emotional.emotions.join(', ')}</span>
                </div>
                ` : ''}
            </div>
        `;
        return section;
    }

    /**
     * Create psychological intelligence section
     * @private
     */
    _createPsychologicalSection(psychological) {
        const section = document.createElement('div');
        section.className = 'intelligence-section psychological';
        section.innerHTML = `
            <div class="section-header">
                <h4>🧠 Psychological Intelligence</h4>
            </div>
            <div class="section-content">
                <div class="intelligence-item">
                    <span class="label">Primary Effect:</span>
                    <span class="value">${psychological.primary_effect || 'N/A'}</span>
                </div>
                <div class="intelligence-item">
                    <span class="label">Focus:</span>
                    <span class="value">${(psychological.focus || 0).toFixed(2)}</span>
                    <div class="bar">
                        <div class="bar-fill" style="width: ${(psychological.focus || 0) * 100}%"></div>
                    </div>
                </div>
                <div class="intelligence-item">
                    <span class="label">Relaxation:</span>
                    <span class="value">${(psychological.relaxation || 0).toFixed(2)}</span>
                    <div class="bar">
                        <div class="bar-fill" style="width: ${(psychological.relaxation || 0) * 100}%"></div>
                    </div>
                </div>
                <div class="intelligence-item">
                    <span class="label">Motivation:</span>
                    <span class="value">${(psychological.motivation || 0).toFixed(2)}</span>
                    <div class="bar">
                        <div class="bar-fill" style="width: ${(psychological.motivation || 0) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
        return section;
    }

    /**
     * Create sonic intelligence section
     * @private
     */
    _createSonicSection(sonic) {
        const section = document.createElement('div');
        section.className = 'intelligence-section sonic';
        section.innerHTML = `
            <div class="section-header">
                <h4>🎵 Sonic Intelligence</h4>
            </div>
            <div class="section-content">
                <div class="intelligence-item">
                    <span class="label">Timbre:</span>
                    <span class="value">${sonic.timbre || 'N/A'}</span>
                </div>
                <div class="intelligence-item">
                    <span class="label">Texture:</span>
                    <span class="value">${sonic.texture || 'N/A'}</span>
                </div>
                <div class="intelligence-item">
                    <span class="label">Spatial:</span>
                    <span class="value">${sonic.spatial || 'N/A'}</span>
                </div>
                <div class="intelligence-item">
                    <span class="label">Dynamics:</span>
                    <span class="value">${sonic.dynamics || 'N/A'}</span>
                </div>
                ${sonic.brightness ? `
                <div class="intelligence-item">
                    <span class="label">Brightness:</span>
                    <span class="value">${sonic.brightness} Hz</span>
                </div>
                ` : ''}
            </div>
        `;
        return section;
    }

    /**
     * Create intent intelligence section
     * @private
     */
    _createIntentSection(intent) {
        const section = document.createElement('div');
        section.className = 'intelligence-section intent';
        section.innerHTML = `
            <div class="section-header">
                <h4>🎯 Intent Intelligence</h4>
            </div>
            <div class="section-content">
                <div class="intelligence-item">
                    <span class="label">Primary Intent:</span>
                    <span class="value">${intent.primary || 'N/A'}</span>
                </div>
                ${intent.use_cases && intent.use_cases.length > 0 ? `
                <div class="intelligence-item">
                    <span class="label">Use Cases:</span>
                    <span class="value">${intent.use_cases.join(', ')}</span>
                </div>
                ` : ''}
                ${intent.suitable_for && intent.suitable_for.length > 0 ? `
                <div class="intelligence-item">
                    <span class="label">Suitable For:</span>
                    <span class="value">${intent.suitable_for.join(', ')}</span>
                </div>
                ` : ''}
            </div>
        `;
        return section;
    }
}

/**
 * Initialize energy intelligence UI
 * @returns {EnergyIntelligenceUI} UI instance
 */
export function initializeEnergyIntelligenceUI() {
    return new EnergyIntelligenceUI();
}

