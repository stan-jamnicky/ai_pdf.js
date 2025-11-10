/* Copyright 2023 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class ChatManager {
    constructor() {
        this.apiKey = "<Your_OpenAI_API_Key>";
        this.endpoint = "<Your_OpenAI_Endpoint>";
        this.modelName = "gpt-4o";
        this.deploymentName = "gpt-4-32k-0613";

        this.chatButton = document.getElementById("chatButton");
        this.chatSidebar = document.getElementById("chatSidebar");
        this.chatMessages = document.getElementById("chatMessages");
        this.chatInput = document.getElementById("chatInputText");
        this.chatSendButton = document.getElementById("chatSendButton");

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.chatButton.addEventListener("click", () => {
            this.toggleChatSidebar();
        });

        this.chatSendButton.addEventListener("click", () => {
            this.sendMessage();
        });

        this.chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleChatSidebar() {
        this.chatSidebar.classList.toggle("visible");
        document.getElementById("viewerContainer").classList.toggle("chat-open");
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat(message, 'user');
        this.chatInput.value = '';

        try {
            // Get current PDF text content
            const pdfContent = await this.getPDFContent();

            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": this.apiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: `You are a helpful assistant analyzing a PDF document. Here's the current context:\n${pdfContent}`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content || 'No response from AI.';
            this.addMessageToChat(aiResponse, 'bot');

        } catch (error) {
            console.error('Error:', error);
            this.addMessageToChat('Sorry, there was an error processing your request.', 'bot');
        }
    }

    addMessageToChat(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async getPDFContent() {
        // Get the current PDF viewer instance
        const PDFViewerApplication = window.PDFViewerApplication;
        if (!PDFViewerApplication?.pdfDocument) {
            return "No PDF document is currently loaded.";
        }

        let content = "";
        const numPages = PDFViewerApplication.pdfDocument.numPages;
        // Get text content from all pages
        for (let i = 1; i <= numPages; i++) {
            const page = await PDFViewerApplication.pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            content += textContent.items.map(item => item.str).join(' ') + ' ';
        }
        return content;
    }
}

// Initialize chat manager when everything is loaded
window.addEventListener('load', () => {
    window.chatManager = new ChatManager();
    console.log('Chat manager initialized');
});
