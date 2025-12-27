/**
 * @fileoverview Analysis Handlers - Handles analysis button functionality
 * @module analysis-handlers
 */

import { createLogger } from './utils/logger.ts';
import { setCurrentAnalysisData } from './state-helpers.js';

const logger = createLogger('AnalysisHandlers');

/**
 * AnalysisHandlers class handles all analysis-related operations
 */
export class AnalysisHandlers {
    /**
     * Create an AnalysisHandlers instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Analyze an uploaded file
     * @param {File} file - File to analyze
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeFile(file) {
        try {
            logger.debug('Analyzing file', { filename: file.name, size: file.size });

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiBaseUrl}/api/analyze/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Analysis failed');
            }

            const result = await response.json();
            logger.info('File analysis complete', { status: result.status });
            
            // Store result for export
            setCurrentAnalysisData(result);
            
            return result;
        } catch (error) {
            logger.error('File analysis failed', error);
            throw error;
        }
    }

    /**
     * Analyze audio from URL
     * @param {string} url - URL to analyze (YouTube, SoundCloud, or direct audio)
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeURL(url) {
        try {
            logger.debug('Analyzing URL', { url });

            const response = await fetch(`${this.apiBaseUrl}/api/analyze/url?url=${encodeURIComponent(url)}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'URL analysis failed');
            }

            const result = await response.json();
            logger.info('URL analysis complete', { status: result.status });
            
            // Store result for export
            setCurrentAnalysisData(result);
            
            return result;
        } catch (error) {
            logger.error('URL analysis failed', error);
            throw error;
        }
    }

    /**
     * Match file against SERGIK DNA
     * @param {File} file - File to match
     * @returns {Promise<Object>} DNA match result
     */
    async dnaMatch(file) {
        try {
            logger.debug('Matching DNA', { filename: file.name });

            // First analyze the file
            const analysisResult = await this.analyzeFile(file);
            
            // Then get DNA match from GPT analyze endpoint
            const response = await fetch(`${this.apiBaseUrl}/api/gpt/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: `Analyze this track and match it against SERGIK DNA profile`,
                    file_path: analysisResult.file || file.name,
                    analysis_data: analysisResult
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'DNA match failed');
            }

            const result = await response.json();
            logger.info('DNA match complete', { match_score: result.sergik_dna?.match_score });
            
            return {
                ...analysisResult,
                dna_match: result.sergik_dna,
                suggestions: result.suggestions
            };
        } catch (error) {
            logger.error('DNA match failed', error);
            throw error;
        }
    }

    /**
     * Export analysis data as JSON
     * @param {Object} data - Analysis data to export
     */
    exportAnalysis(data) {
        try {
            if (!data) {
                throw new Error('No analysis data to export');
            }

            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sergik-analysis-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            logger.info('Analysis exported', { filename: a.download });
        } catch (error) {
            logger.error('Export failed', error);
            throw error;
        }
    }

    /**
     * Batch analyze multiple files
     * @param {File[]} files - Files to analyze
     * @returns {Promise<Object>} Batch analysis result
     */
    async batchAnalyze(files) {
        try {
            logger.debug('Batch analyzing files', { count: files.length });

            const results = [];
            const errors = [];

            for (let i = 0; i < files.length; i++) {
                try {
                    const result = await this.analyzeFile(files[i]);
                    results.push({
                        file: files[i].name,
                        result: result
                    });
                } catch (error) {
                    errors.push({
                        file: files[i].name,
                        error: error.message
                    });
                }
            }

            const batchResult = {
                total: files.length,
                successful: results.length,
                failed: errors.length,
                results: results,
                errors: errors
            };

            logger.info('Batch analysis complete', batchResult);
            return batchResult;
        } catch (error) {
            logger.error('Batch analysis failed', error);
            throw error;
        }
    }
}

