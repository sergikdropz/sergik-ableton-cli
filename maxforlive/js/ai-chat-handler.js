/**
 * @fileoverview AI Chat Handler - Handles AI chat interface
 * @module ai-chat-handler
 */

import { createLogger } from './utils/logger.ts';

const logger = createLogger('AIChatHandler');

/**
 * AIChatHandler class handles AI chat interface with multi-turn conversation
 */
export class AIChatHandler {
    /**
     * Create an AIChatHandler instance
     * @param {string} apiBaseUrl - Base URL for API calls
     */
    constructor(apiBaseUrl = 'http://localhost:8000') {
        this.apiBaseUrl = apiBaseUrl;
        this.conversationHistory = [];
        this.sessionId = `chat-${Date.now()}`;
    }

    /**
     * Send a message to the AI
     * @param {string} text - Message text
     * @returns {Promise<void>}
     */
    async sendMessage(text) {
        try {
            if (!text.trim()) return;

            logger.debug('Sending chat message', { text });

            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: text,
                timestamp: Date.now()
            });

            // Display user message
            this._addMessageToUI('user', text);

            // Send to API
            const response = await fetch(`${this.apiBaseUrl}/api/voice/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    session_id: this.sessionId,
                    context: this._getContext()
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(error.detail || 'Chat failed');
            }

            const result = await response.json();

            // Extract AI response
            const aiResponse = result.response || result.text || result.message || 'I received your message.';
            
            // Add AI response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: Date.now()
            });

            // Display AI response
            this._addMessageToUI('ai', aiResponse);

            logger.info('Chat message processed', { responseLength: aiResponse.length });
        } catch (error) {
            logger.error('Chat message failed', error);
            this._addMessageToUI('ai', `Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Clear chat history
     */
    clearChat() {
        this.conversationHistory = [];
        this.sessionId = `chat-${Date.now()}`;
        
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="chat-message ai">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-text">Hello! I'm your AI assistant. How can I help you create music today?</div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
            `;
        }

        logger.info('Chat cleared');
    }

    /**
     * Handle quick action
     * @param {string} action - Action name
     * @returns {Promise<void>}
     */
    async handleQuickAction(action) {
        const actionPrompts = {
            'suggest-genre': 'Analyze the current track and suggest appropriate genres',
            'match-dna': 'Match this track against SERGIK DNA profile',
            'find-similar': 'Find similar tracks in the library',
            'optimize-mix': 'Suggest mix optimizations for this track'
        };

        const prompt = actionPrompts[action];
        if (prompt) {
            await this.sendMessage(prompt);
        }
    }

    /**
     * Get conversation context
     * @private
     */
    _getContext() {
        return {
            session_id: this.sessionId,
            history: this.conversationHistory.slice(-10), // Last 10 messages
            timestamp: Date.now()
        };
    }

    /**
     * Add message to UI
     * @private
     */
    _addMessageToUI(role, text) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        
        const avatar = role === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString();

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${this._formatMessage(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Format message text (support markdown, code blocks)
     * @private
     */
    _formatMessage(text) {
        // Simple formatting - can be enhanced with markdown parser
        return text
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }
}

