/**
 * @fileoverview Voice Control UI - Handles voice control integration
 * @module voice-control-ui
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('VoiceControlUI');

/**
 * VoiceControlUI class handles voice control interface
 */
export class VoiceControlUI {
    /**
     * Create a VoiceControlUI instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.micBtn = null;
        this.micStatus = null;
    }

    /**
     * Initialize voice control UI
     */
    initialize() {
        this.micBtn = document.getElementById('mic-btn');
        this.micStatus = document.querySelector('.mic-status');

        if (!this.micBtn) {
            logger.warn('Mic button not found');
            return;
        }

        // Wire up push-to-talk
        this.micBtn.addEventListener('mousedown', () => this.startRecording());
        this.micBtn.addEventListener('mouseup', () => this.stopRecording());
        this.micBtn.addEventListener('mouseleave', () => {
            if (this.isRecording) {
                this.stopRecording();
            }
        });

        // Touch events for mobile
        this.micBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording();
        });
        this.micBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording();
        });

        logger.info('Voice control UI initialized');
    }

    /**
     * Start recording
     */
    async startRecording() {
        if (this.isRecording) return;

        try {
            this.isRecording = true;
            this.audioChunks = [];

            // Update UI
            if (this.micBtn) {
                this.micBtn.classList.add('recording');
            }
            if (this.micStatus) {
                this.micStatus.textContent = 'Recording...';
            }

            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processRecording();
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            logger.debug('Recording started');

        } catch (error) {
            logger.error('Failed to start recording', error);
            this.isRecording = false;
            if (this.micBtn) {
                this.micBtn.classList.remove('recording');
            }
            if (this.micStatus) {
                this.micStatus.textContent = 'Error: ' + error.message;
            }
            alert('Microphone access denied. Please allow microphone access to use voice control.');
        }
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;

        try {
            this.mediaRecorder.stop();
            this.isRecording = false;

            // Update UI
            if (this.micBtn) {
                this.micBtn.classList.remove('recording');
            }
            if (this.micStatus) {
                this.micStatus.textContent = 'Processing...';
            }

            logger.debug('Recording stopped');
        } catch (error) {
            logger.error('Failed to stop recording', error);
            this.isRecording = false;
            if (this.micBtn) {
                this.micBtn.classList.remove('recording');
            }
            if (this.micStatus) {
                this.micStatus.textContent = 'Push to talk';
            }
        }
    }

    /**
     * Process recorded audio
     */
    async processRecording() {
        try {
            if (this.audioChunks.length === 0) {
                if (this.micStatus) {
                    this.micStatus.textContent = 'Push to talk';
                }
                return;
            }

            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            
            // Send to voice endpoint
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.wav');

            const response = await fetch(`${this.apiBaseUrl}/api/voice`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Voice processing failed');
            }

            const result = await response.json();

            // Display transcription
            if (result.transcription) {
                this._showTranscription(result.transcription);
            }

            // Display response
            if (result.response) {
                this._showResponse(result.response);
            }

            // Play TTS if available
            if (result.audio_url) {
                this._playAudio(result.audio_url);
            }

            if (this.micStatus) {
                this.micStatus.textContent = 'Push to talk';
            }

            logger.info('Voice processing complete', { 
                transcription: result.transcription?.substring(0, 50) 
            });

        } catch (error) {
            logger.error('Voice processing failed', error);
            if (this.micStatus) {
                this.micStatus.textContent = 'Error: ' + error.message;
                setTimeout(() => {
                    if (this.micStatus) {
                        this.micStatus.textContent = 'Push to talk';
                    }
                }, 3000);
            }
            alert('Voice processing failed: ' + error.message);
        }
    }

    /**
     * Show transcription
     * @private
     */
    _showTranscription(text) {
        // Show in status or notification
        if (typeof updateStatus === 'function') {
            updateStatus('processing', `Heard: ${text}`);
        }
        if (typeof showNotification === 'function') {
            showNotification(`Voice: ${text}`);
        }
    }

    /**
     * Show response
     * @private
     */
    _showResponse(text) {
        // Show in status or notification
        if (typeof updateStatus === 'function') {
            updateStatus('ready', `Response: ${text.substring(0, 50)}...`);
        }
        
        // Also show in chat if available
        if (window.controllerHandlers) {
            const chat = window.controllerHandlers.getHandler('chat');
            chat._addMessageToUI('ai', text);
        }
    }

    /**
     * Play audio response
     * @private
     */
    _playAudio(audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(err => {
            logger.warn('Failed to play audio response', err);
        });
    }
}

/**
 * Initialize voice control UI
 * @param {string} apiBaseUrl - Base URL for API
 * @returns {VoiceControlUI} UI instance
 */
export function initializeVoiceControlUI(apiBaseUrl = 'http://localhost:8000') {
    const voiceUI = new VoiceControlUI(apiBaseUrl);
    voiceUI.initialize();
    return voiceUI;
}

