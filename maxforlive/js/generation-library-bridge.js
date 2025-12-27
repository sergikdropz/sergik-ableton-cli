/**
 * Generation Library Bridge
 * Bridges generation system with library system for seamless integration
 */

export class GenerationLibraryBridge {
    constructor() {
        this.apiBaseUrl = window.sergikAPI?.apiBaseUrl || 'http://127.0.0.1:8000';
    }

    /**
     * Save generated file with metadata to library
     * @param {Object} fileData - File data (buffer, blob, or path)
     * @param {Object} metadata - File metadata
     * @param {string} type - File type ('audio' or 'midi')
     * @returns {Promise<Object>} Save result with metadata
     */
    async saveGeneratedFileWithMetadata(fileData, metadata, type = 'audio') {
        try {
            // 1. Generate smart filename
            const filename = this.generateSmartFilename(metadata, type);
            
            // 2. Save file (organization handled by main process)
            let saveResult;
            if (type === 'audio') {
                // Convert fileData to array if needed
                let audioData = fileData;
                if (fileData instanceof ArrayBuffer) {
                    audioData = Array.from(new Uint8Array(fileData));
                } else if (fileData instanceof Blob) {
                    const arrayBuffer = await fileData.arrayBuffer();
                    audioData = Array.from(new Uint8Array(arrayBuffer));
                } else if (typeof fileData === 'string') {
                    // If it's a path, we can't convert it here
                    // This case should be handled differently
                    throw new Error('String file paths not supported for audio save');
                }
                
                saveResult = await window.sergikAPI.saveAudioToLibrary(
                    audioData,
                    filename
                );
            } else {
                saveResult = await window.sergikAPI.saveMidiToLibrary(
                    fileData,
                    filename
                );
            }

            if (!saveResult.success) {
                throw new Error(saveResult.error || 'Save failed');
            }

            // 3. Extract additional metadata if needed
            const enrichedMetadata = await this.enrichMetadata(
                saveResult.filePath,
                metadata,
                type
            );

            // 4. Save metadata file
            await this.saveMetadataFile(saveResult.filePath, enrichedMetadata);

            // 5. Add to library index
            if (window.libraryIndexManager) {
                const mediaId = await window.libraryIndexManager.addFile(
                    saveResult.filePath,
                    {
                        filename: filename,
                        type: type,
                        source: 'generated',
                        generationType: metadata.generationType,
                        metadata: enrichedMetadata
                    }
                );

                // 6. Trigger library refresh
                document.dispatchEvent(new CustomEvent('libraryFileAdded', {
                    detail: {
                        filePath: saveResult.filePath,
                        mediaId: mediaId,
                        metadata: enrichedMetadata,
                        type: type
                    }
                }));

                return {
                    ...saveResult,
                    mediaId: mediaId,
                    metadata: enrichedMetadata
                };
            }

            return saveResult;
        } catch (error) {
            console.error('[GenerationLibraryBridge] Save failed:', error);
            throw error;
        }
    }

    /**
     * Generate smart filename with metadata
     * @param {Object} metadata - Metadata
     * @param {string} type - File type
     * @returns {string} Filename
     */
    generateSmartFilename(metadata, type) {
        const parts = [
            metadata.generationType || 'generated',
            metadata.genre || 'unknown',
            metadata.bpm ? `${metadata.bpm}bpm` : '',
            metadata.key || '',
            Date.now()
        ].filter(Boolean);

        const extension = type === 'audio' ? 'wav' : 'mid';
        return `${parts.join('_')}.${extension}`;
    }

    /**
     * Organize file into directory structure
     * @param {Object} metadata - Metadata
     * @param {string} type - File type
     * @returns {string} Organization path
     */
    organizeGeneratedFile(metadata, type) {
        const typeDir = type === 'audio' ? 'Audio' : 'MIDI';
        const genreDir = this.sanitizeFilename(metadata.genre || 'Unknown');
        const bpmDir = `${metadata.bpm || 120}BPM`;
        
        return `${typeDir}/${genreDir}/${bpmDir}`;
    }

    /**
     * Sanitize filename for filesystem
     * @param {string} name - Name to sanitize
     * @returns {string} Sanitized name
     */
    sanitizeFilename(name) {
        return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    /**
     * Enrich metadata with extracted data
     * @param {string} filePath - File path
     * @param {Object} existingMetadata - Existing metadata
     * @param {string} type - File type
     * @returns {Promise<Object>} Enriched metadata
     */
    async enrichMetadata(filePath, existingMetadata, type) {
        const enriched = { ...existingMetadata };

        try {
            if (type === 'audio' && window.sergikAPI?.analyzePath) {
                // Extract audio metadata
                try {
                    const analysis = await window.sergikAPI.analyzePath(filePath);
                    if (analysis && analysis.success && analysis.data) {
                        enriched.bpm = enriched.bpm || analysis.data.bpm;
                        enriched.key = enriched.key || analysis.data.key;
                        enriched.genre = enriched.genre || analysis.data.genre;
                        enriched.duration = analysis.data.duration;
                        enriched.sampleRate = analysis.data.sample_rate;
                    }
                } catch (analysisError) {
                    console.warn('[GenerationLibraryBridge] Analysis failed, using existing metadata:', analysisError);
                }
            } else if (type === 'midi') {
                // Parse MIDI metadata
                // This would require MIDI parsing library
                // For now, use existing metadata
            }
        } catch (error) {
            console.warn('[GenerationLibraryBridge] Metadata extraction failed:', error);
            // Continue with existing metadata
        }

        // Add generation context
        enriched.generatedAt = new Date().toISOString();
        enriched.extracted = true;

        return enriched;
    }

    /**
     * Save metadata file alongside media file
     * @param {string} filePath - Media file path
     * @param {Object} metadata - Metadata to save
     * @returns {Promise<boolean>} Success
     */
    async saveMetadataFile(filePath, metadata) {
        try {
            // Store metadata in index (metadata file saving would need API endpoint)
            // For now, metadata is stored in the index
            return true;
        } catch (error) {
            console.warn('[GenerationLibraryBridge] Metadata file save failed:', error);
            return false;
        }
    }

    /**
     * Build metadata from generation context
     * @param {string} generationType - Type of generation
     * @param {Object} params - Generation parameters
     * @param {Object} result - Generation result
     * @returns {Object} Metadata object
     */
    buildMetadataFromGeneration(generationType, params, result) {
        return {
            generationType: generationType,
            bpm: params.tempo || result.data?.tempo,
            key: params.key || result.data?.key,
            genre: params.genre || result.data?.genre,
            bars: params.bars || result.data?.bars || 8,
            tempo: params.tempo,
            subCategory: params.subCategory,
            generatedAt: new Date().toISOString(),
            generationParams: {
                type: generationType,
                genre: params.genre,
                key: params.key,
                tempo: params.tempo,
                bars: params.bars,
                subCategory: params.subCategory,
                ...params
            },
            // Merge with result metadata if available
            ...(result.data?.metadata || {})
        };
    }
}

// Export singleton
if (typeof window !== 'undefined') {
    window.GenerationLibraryBridge = GenerationLibraryBridge;
    if (!window.generationLibraryBridge) {
        window.generationLibraryBridge = new GenerationLibraryBridge();
    }
}

