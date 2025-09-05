class StoryVerseApp {
    constructor() {
        this.currentStoryId = null;
        this.currentStoryData = null;
        this.progressInterval = null;
        this.audioElements = [];
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.elements = {
            creationForm: document.getElementById('creation-form'),
            progressSection: document.getElementById('progress-section'),
            storyDisplay: document.getElementById('story-display'),
            
            storyPrompt: document.getElementById('story-prompt'),
            generateBtn: document.getElementById('generate-btn'),
            exampleBtns: document.querySelectorAll('.example-btn'),
            
            progressTitle: document.getElementById('progress-title'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            
            storyTitle: document.getElementById('story-title'),
            restartBtn: document.getElementById('restart-btn'),
            playIntroBtn: document.getElementById('play-intro'),
            autoPlayBtn: document.getElementById('auto-play'),
            
            charactersGrid: document.getElementById('characters-grid'),
            chaptersContainer: document.getElementById('chapters-container')
        };
    }

    bindEvents() {
        this.elements.generateBtn.addEventListener('click', () => this.generateStory());
        this.elements.restartBtn.addEventListener('click', () => this.restart());
        this.elements.playIntroBtn.addEventListener('click', () => this.playIntroduction());
        this.elements.autoPlayBtn.addEventListener('click', () => this.autoPlayStory());
        
        this.elements.exampleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.elements.storyPrompt.value = e.target.dataset.prompt;
            });
        });

        // Enable Enter key to generate story
        this.elements.storyPrompt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateStory();
            }
        });
    }

    async generateStory() {
        const prompt = this.elements.storyPrompt.value.trim();
        if (!prompt) {
            alert('Please enter a story prompt!');
            return;
        }

        try {
            this.showProgressSection();
            this.elements.generateBtn.disabled = true;

            // Step 1: Generate story outline
            this.updateProgress(10, 'Generating story outline...', 'step-outline');
            const response = await fetch('/api/story/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            this.currentStoryId = result.story_id;
            this.currentStoryData = result.story;
            this.elements.progressTitle.textContent = `Creating "${result.story.title}"...`;

            // Step 2: Generate visuals
            this.startProgressPolling();
            await this.generateVisuals();
            
            // Step 3: Generate audio
            await this.generateAudio();
            
            // Step 4: Generate transitions (optional)
            await this.generateTransitions();
            
            // Complete
            await this.loadCompleteStory();
            this.showStoryDisplay();

        } catch (error) {
            console.error('Story generation error:', error);
            alert('Failed to generate story: ' + error.message);
            this.restart();
        }
    }

    async generateVisuals() {
        this.updateProgress(20, 'Creating character designs...', 'step-visuals');
        
        const response = await fetch(`/api/story/generate-visuals/${this.currentStoryId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
    }

    async generateAudio() {
        this.updateProgress(70, 'Generating AI narration...', 'step-audio');
        
        const response = await fetch(`/api/story/generate-audio/${this.currentStoryId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
    }

    async generateTransitions() {
        this.updateProgress(90, 'Creating video magic...', 'step-transitions');
        
        try {
            const response = await fetch(`/api/story/generate-transitions/${this.currentStoryId}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                console.warn('Transitions failed, continuing without them');
            }
        } catch (error) {
            console.warn('Transitions failed:', error);
        }
    }

    async loadCompleteStory() {
        const response = await fetch(`/api/story/complete/${this.currentStoryId}`);
        const storyData = await response.json();
        
        if (!response.ok) throw new Error(storyData.error);
        
        this.currentStoryData = storyData;
        this.updateProgress(100, 'Story complete!', 'step-transitions');
    }

    startProgressPolling() {
        this.progressInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/story/status/${this.currentStoryId}`);
                const status = await response.json();
                
                if (response.ok && status.progress > 0) {
                    this.updateProgressBar(status.progress);
                    
                    if (status.progress >= 100) {
                        clearInterval(this.progressInterval);
                    }
                }
            } catch (error) {
                console.warn('Progress polling error:', error);
            }
        }, 2000);
    }

    showProgressSection() {
        this.elements.creationForm.classList.add('hidden');
        this.elements.progressSection.classList.remove('hidden');
        this.elements.storyDisplay.classList.add('hidden');
    }

    showStoryDisplay() {
        this.elements.creationForm.classList.add('hidden');
        this.elements.progressSection.classList.add('hidden');
        this.elements.storyDisplay.classList.remove('hidden');
        
        this.renderStory();
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    updateProgress(percentage, text, activeStep) {
        this.updateProgressBar(percentage);
        this.elements.progressText.textContent = text;
        
        // Update step indicators
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        if (activeStep) {
            document.getElementById(activeStep).classList.add('active');
        }
    }

    updateProgressBar(percentage) {
        this.elements.progressFill.style.width = percentage + '%';
    }

    renderStory() {
        if (!this.currentStoryData) return;

        this.elements.storyTitle.textContent = this.currentStoryData.title;
        
        // Render characters
        this.renderCharacters();
        
        // Render chapters
        this.renderChapters();
    }

    renderCharacters() {
        this.elements.charactersGrid.innerHTML = '';
        
        this.currentStoryData.characters.forEach(character => {
            const characterCard = document.createElement('div');
            characterCard.className = 'character-card';
            
            const imagePath = this.currentStoryData.character_images?.[character.name];
            
            characterCard.innerHTML = `
                ${imagePath ? `<img src="/api/story/files/${imagePath.split('/').pop()}" alt="${character.name}">` : ''}
                <div class="character-name">${character.name}</div>
                <div class="character-description">${character.description}</div>
            `;
            
            this.elements.charactersGrid.appendChild(characterCard);
        });
    }

    renderChapters() {
        this.elements.chaptersContainer.innerHTML = '';
        
        this.currentStoryData.chapters.forEach((chapter, index) => {
            const chapterElement = document.createElement('div');
            chapterElement.className = 'chapter';
            
            const imagePath = this.currentStoryData.chapter_images?.[index];
            const audioPath = this.currentStoryData.narration_audio?.[index];
            
            chapterElement.innerHTML = `
                <div class="chapter-header">
                    <div class="chapter-title">${chapter.title}</div>
                    <div class="chapter-number">Chapter ${index + 1}</div>
                </div>
                <div class="chapter-content">
                    ${imagePath ? `<img class="chapter-image" src="/api/story/files/${imagePath.split('/').pop()}" alt="${chapter.title}">` : ''}
                    <div class="chapter-text">${chapter.narrative_text}</div>
                    <div class="chapter-controls">
                        ${audioPath ? `<button class="chapter-btn" onclick="app.playChapterAudio(${index})">🔊 Play Narration</button>` : ''}
                        <button class="chapter-btn" onclick="app.showChapterDetails(${index})">📖 Scene Details</button>
                    </div>
                </div>
            `;
            
            this.elements.chaptersContainer.appendChild(chapterElement);
        });
    }

    async playIntroduction() {
        if (!this.currentStoryData?.intro_audio) return;
        
        this.stopAllAudio();
        const audio = new Audio(`/api/story/files/${this.currentStoryData.intro_audio.split('/').pop()}`);
        this.audioElements.push(audio);
        await audio.play();
    }

    async playChapterAudio(chapterIndex) {
        const audioPath = this.currentStoryData.narration_audio?.[chapterIndex];
        if (!audioPath) return;
        
        this.stopAllAudio();
        const audio = new Audio(`/api/story/files/${audioPath.split('/').pop()}`);
        this.audioElements.push(audio);
        await audio.play();
    }

    async autoPlayStory() {
        this.elements.autoPlayBtn.disabled = true;
        this.elements.autoPlayBtn.textContent = '⏸️ Playing...';
        
        try {
            // Play introduction
            if (this.currentStoryData.intro_audio) {
                await this.playIntroduction();
                await this.sleep(1000); // Pause between sections
            }
            
            // Play each chapter
            for (let i = 0; i < this.currentStoryData.chapters.length; i++) {
                if (this.currentStoryData.narration_audio?.[i]) {
                    await this.playChapterAudio(i);
                    await this.sleep(1500); // Pause between chapters
                }
            }
            
            // Play outro
            if (this.currentStoryData.outro_audio) {
                const audio = new Audio(`/api/story/files/${this.currentStoryData.outro_audio.split('/').pop()}`);
                this.audioElements.push(audio);
                await audio.play();
            }
            
        } finally {
            this.elements.autoPlayBtn.disabled = false;
            this.elements.autoPlayBtn.textContent = '▶️ Auto-Play Story';
        }
    }

    showChapterDetails(chapterIndex) {
        const chapter = this.currentStoryData.chapters[chapterIndex];
        alert(`Scene: ${chapter.scene_description}\n\nCharacters: ${chapter.characters_present.join(', ')}`);
    }

    stopAllAudio() {
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.audioElements = [];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    restart() {
        this.stopAllAudio();
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        this.currentStoryId = null;
        this.currentStoryData = null;
        
        this.elements.storyPrompt.value = '';
        this.elements.generateBtn.disabled = false;
        
        this.elements.creationForm.classList.remove('hidden');
        this.elements.progressSection.classList.add('hidden');
        this.elements.storyDisplay.classList.add('hidden');
        
        this.updateProgress(0, 'Ready to create...', null);
    }
}

// Initialize the app
const app = new StoryVerseApp();