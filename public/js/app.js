class StoryVerseApp {
    constructor() {
        this.currentStep = 1;
        this.storyData = {
            step1: {},
            step2: {},
            step3: {},
            step4: {},
            step5: {}
        };
        this.supportingCharacters = [];
        
        this.initializeElements();
        this.bindEvents();
        this.updateProgressIndicator();
    }

    initializeElements() {
        this.elements = {
            // Navigation
            navItems: document.querySelectorAll('.nav-item'),
            stepContents: document.querySelectorAll('.step-content'),
            
            // Step navigation buttons
            nextButtons: document.querySelectorAll('.next-step'),
            prevButtons: document.querySelectorAll('.prev-step'),
            
            // AI generation buttons
            generateIdeasBtn: document.getElementById('generate-ideas'),
            developCharactersBtn: document.getElementById('develop-characters'),
            buildWorldBtn: document.getElementById('build-world'),
            developPlotBtn: document.getElementById('develop-plot'),
            generateOverviewBtn: document.getElementById('generate-overview'),
            
            // Character management
            addCharacterBtn: document.getElementById('add-character'),
            supportingCharactersDiv: document.getElementById('supporting-characters'),
            
            // Framework selection
            frameworkOptions: document.querySelectorAll('.framework-option'),
            
            // Save button
            saveStoryBtn: document.getElementById('save-story'),
            
            // Generated content areas
            generatedIdeas: document.getElementById('generated-ideas'),
            characterDevelopment: document.getElementById('character-development'),
            worldBuilding: document.getElementById('world-building'),
            plotDevelopment: document.getElementById('plot-development'),
            storyOverview: document.getElementById('story-overview')
        };
    }

    bindEvents() {
        // Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const step = parseInt(e.currentTarget.dataset.step);
                this.goToStep(step);
            });
        });

        // Step navigation buttons
        this.elements.nextButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nextStep = parseInt(e.target.dataset.next);
                this.saveCurrentStepData();
                this.goToStep(nextStep);
            });
        });

        this.elements.prevButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prevStep = parseInt(e.target.dataset.prev);
                this.saveCurrentStepData();
                this.goToStep(prevStep);
            });
        });

        // AI generation buttons
        if (this.elements.generateIdeasBtn) {
            this.elements.generateIdeasBtn.addEventListener('click', () => this.generateIdeas());
        }
        if (this.elements.developCharactersBtn) {
            this.elements.developCharactersBtn.addEventListener('click', () => this.developCharacters());
        }
        if (this.elements.buildWorldBtn) {
            this.elements.buildWorldBtn.addEventListener('click', () => this.buildWorld());
        }
        if (this.elements.developPlotBtn) {
            this.elements.developPlotBtn.addEventListener('click', () => this.developPlot());
        }
        if (this.elements.generateOverviewBtn) {
            this.elements.generateOverviewBtn.addEventListener('click', () => this.generateCompleteOverview());
        }

        // Character management
        if (this.elements.addCharacterBtn) {
            this.elements.addCharacterBtn.addEventListener('click', () => this.addSupportingCharacter());
        }

        // Framework selection
        this.elements.frameworkOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.elements.frameworkOptions.forEach(opt => opt.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.storyData.step5.framework = e.currentTarget.dataset.framework;
            });
        });

        // Save button
        if (this.elements.saveStoryBtn) {
            this.elements.saveStoryBtn.addEventListener('click', () => this.saveStory());
        }

        // Auto-save on input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.autoSave();
            }
        });
    }

    goToStep(step) {
        if (step < 1 || step > 5) return;
        
        // Update current step
        this.currentStep = step;
        
        // Update navigation
        this.elements.navItems.forEach((item, index) => {
            item.classList.remove('active');
            if (index + 1 === step) {
                item.classList.add('active');
            }
        });
        
        // Update content
        this.elements.stepContents.forEach((content, index) => {
            content.classList.remove('active');
            if (index + 1 === step) {
                content.classList.add('active');
            }
        });
        
        // Update progress indicator
        this.updateProgressIndicator();
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    updateProgressIndicator() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const progress = (this.currentStep / 5) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }

    saveCurrentStepData() {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        const inputs = currentStepElement.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            this.storyData[`step${this.currentStep}`][input.id] = input.value;
        });
    }

    autoSave() {
        // Debounced auto-save
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveCurrentStepData();
            localStorage.setItem('storyverse-data', JSON.stringify(this.storyData));
        }, 1000);
    }

    async generateIdeas() {
        const btn = this.elements.generateIdeasBtn;
        const content = this.elements.generatedIdeas;
        
        this.saveCurrentStepData();
        
        try {
            btn.classList.add('loading');
            btn.disabled = true;
            
            const response = await fetch('/api/storyverse/generate-ideas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    foundationData: this.storyData.step1,
                    discoveryData: this.storyData.step2
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                content.innerHTML = result.content;
                content.classList.add('visible');
            } else {
                throw new Error(result.error || 'Failed to generate ideas');
            }
            
        } catch (error) {
            console.error('Error generating ideas:', error);
            this.showError('Failed to generate ideas. Please try again.');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    async developCharacters() {
        const btn = this.elements.developCharactersBtn;
        const content = this.elements.characterDevelopment;
        
        this.saveCurrentStepData();
        
        try {
            btn.classList.add('loading');
            btn.disabled = true;
            
            const response = await fetch('/api/storyverse/develop-characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    foundationData: this.storyData.step1,
                    discoveryData: this.storyData.step2,
                    characterData: this.storyData.step3,
                    supportingCharacters: this.supportingCharacters
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                content.innerHTML = result.content;
                content.classList.add('visible');
            } else {
                throw new Error(result.error || 'Failed to develop characters');
            }
            
        } catch (error) {
            console.error('Error developing characters:', error);
            this.showError('Failed to develop characters. Please try again.');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    async buildWorld() {
        const btn = this.elements.buildWorldBtn;
        const content = this.elements.worldBuilding;
        
        this.saveCurrentStepData();
        
        try {
            btn.classList.add('loading');
            btn.disabled = true;
            
            const response = await fetch('/api/storyverse/build-world', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    foundationData: this.storyData.step1,
                    discoveryData: this.storyData.step2,
                    characterData: this.storyData.step3,
                    worldData: this.storyData.step4
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                content.innerHTML = result.content;
                content.classList.add('visible');
            } else {
                throw new Error(result.error || 'Failed to build world');
            }
            
        } catch (error) {
            console.error('Error building world:', error);
            this.showError('Failed to enhance world-building. Please try again.');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    async developPlot() {
        const btn = this.elements.developPlotBtn;
        const content = this.elements.plotDevelopment;
        
        this.saveCurrentStepData();
        
        try {
            btn.classList.add('loading');
            btn.disabled = true;
            
            const response = await fetch('/api/storyverse/develop-plot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    allData: this.storyData
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                content.innerHTML = result.content;
                content.classList.add('visible');
            } else {
                throw new Error(result.error || 'Failed to develop plot');
            }
            
        } catch (error) {
            console.error('Error developing plot:', error);
            this.showError('Failed to develop plot. Please try again.');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    async generateCompleteOverview() {
        const btn = this.elements.generateOverviewBtn;
        const content = this.elements.storyOverview;
        
        this.saveCurrentStepData();
        
        try {
            btn.classList.add('loading');
            btn.disabled = true;
            btn.textContent = '✨ Generating Your Complete Story Guide...';
            
            const response = await fetch('/api/storyverse/complete-overview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    allData: this.storyData,
                    supportingCharacters: this.supportingCharacters
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                content.innerHTML = result.content;
                content.classList.add('visible');
                
                // Mark navigation as completed
                this.elements.navItems.forEach(item => {
                    item.classList.add('completed');
                });
            } else {
                throw new Error(result.error || 'Failed to generate overview');
            }
            
        } catch (error) {
            console.error('Error generating overview:', error);
            this.showError('Failed to generate complete story guide. Please try again.');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.textContent = '✨ Generate Complete Story Guide';
        }
    }

    addSupportingCharacter() {
        const characterId = `support-char-${this.supportingCharacters.length}`;
        const characterHtml = `
            <div class="character-designer" id="${characterId}">
                <div class="input-group">
                    <label>Character Name</label>
                    <input type="text" class="support-char-name" placeholder="Supporting character name">
                </div>
                <div class="input-group">
                    <label>Relationship to Main Character</label>
                    <textarea class="support-char-relationship" placeholder="Friend, enemy, mentor, love interest..." rows="2"></textarea>
                </div>
                <div class="input-group">
                    <label>Role in Story</label>
                    <textarea class="support-char-role" placeholder="What function do they serve in the plot?" rows="2"></textarea>
                </div>
                <div class="input-group">
                    <label>Key Traits</label>
                    <textarea class="support-char-traits" placeholder="Personality traits, quirks, distinctive features..." rows="2"></textarea>
                </div>
                <button class="remove-character" data-character-id="${characterId}">Remove Character</button>
            </div>
        `;
        
        this.elements.addCharacterBtn.insertAdjacentHTML('beforebegin', characterHtml);
        
        // Add event listener for remove button
        const removeBtn = document.querySelector(`[data-character-id="${characterId}"] .remove-character`);
        removeBtn.addEventListener('click', () => this.removeSupportingCharacter(characterId));
        
        this.supportingCharacters.push({
            id: characterId,
            name: '',
            relationship: '',
            role: '',
            traits: ''
        });
    }

    removeSupportingCharacter(characterId) {
        const element = document.getElementById(characterId);
        if (element) {
            element.remove();
        }
        
        this.supportingCharacters = this.supportingCharacters.filter(char => char.id !== characterId);
    }

    async saveStory() {
        this.saveCurrentStepData();
        
        try {
            const response = await fetch('/api/storyverse/save-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storyData: this.storyData,
                    supportingCharacters: this.supportingCharacters,
                    timestamp: new Date().toISOString()
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Story saved successfully!');
                // Could also download as JSON or provide a shareable link
                this.downloadStory(result.storyId);
            } else {
                throw new Error(result.error || 'Failed to save story');
            }
            
        } catch (error) {
            console.error('Error saving story:', error);
            this.showError('Failed to save story. Please try again.');
        }
    }

    downloadStory(storyId) {
        // Create a downloadable version of the story data
        const completeStory = {
            id: storyId,
            timestamp: new Date().toISOString(),
            data: this.storyData,
            supportingCharacters: this.supportingCharacters
        };
        
        const blob = new Blob([JSON.stringify(completeStory, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `storyverse-${storyId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showError(message) {
        // Simple error display - could be enhanced with a modal or toast
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success display - could be enhanced with a modal or toast
        alert(message);
    }

    // Load saved data on page load
    loadSavedData() {
        const saved = localStorage.getItem('storyverse-data');
        if (saved) {
            try {
                this.storyData = JSON.parse(saved);
                this.populateFormFields();
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }

    populateFormFields() {
        // Populate form fields with saved data
        Object.keys(this.storyData).forEach(stepKey => {
            const stepData = this.storyData[stepKey];
            Object.keys(stepData).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = stepData[fieldId];
                }
            });
        });
    }

    // Character counter for textareas
    addCharacterCounters() {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const maxLength = textarea.getAttribute('maxlength');
            if (maxLength) {
                const counter = document.createElement('div');
                counter.className = 'character-count';
                counter.textContent = `${textarea.value.length}/${maxLength}`;
                textarea.parentNode.appendChild(counter);
                
                textarea.addEventListener('input', () => {
                    counter.textContent = `${textarea.value.length}/${maxLength}`;
                });
            }
        });
    }
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.storyVerseApp = new StoryVerseApp();
    window.storyVerseApp.loadSavedData();
    window.storyVerseApp.addCharacterCounters();
});