class Quiz {
    constructor() {
        
        this.currentCaseStudy = 0;
        this.currentQuestion = 0;
        this.timer = { total: 0, questionStart: 0 };
        this.userAnswers = [];

        this.quizData = window.questionsData.caseStudies;
        this.interval = null;
        this.isPaused = false;
        
        this.init();


    }


    async init() {
        try {
            this.showLoading();
            
            // 1. Load questions FIRST
            if (!window.questionsData) {
                throw new Error("Questions data not loaded. Check questions.js file.");
            }
            this.quizData = window.questionsData.caseStudies;
            
            // 2. Then check for existing session
            this.checkExistingSession();
            
            // 3. Initialize rest
            this.initializeStorage();
            this.startTimer();
            this.renderQuestion();
            this.setupEventListeners();
            this.updateProgressBar();
            this.setupKeyboardNavigation();
        } catch (error) {
            this.showError(error);
        } finally {
            this.hideLoading();
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if(e.ctrlKey && e.key === 'ArrowRight') {
                this.nextQuestion();
            }
            if(e.ctrlKey && e.key === 'ArrowLeft') {
                this.previousQuestion();
            }
        });
    }

    showLoading() {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    hideLoading() {
        const loader = document.getElementById('loader');
        if(loader) loader.remove();
    }
    
    showError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger m-3';
        errorDiv.innerHTML = `
            <h5>Error Loading Quiz</h5>
            <p>${error.message}</p>
            <pre>${error.stack}</pre>
            <button class="btn btn-link" onclick="location.reload()">Reload Page</button>
        `;
        document.body.prepend(errorDiv);
    }

    async loadQuestions() {

   
        this.quizData = window.questionsData.caseStudies;

    }

    initializeStorage() {
        if(!localStorage.getItem('quizResults')) {
            localStorage.setItem('quizResults', JSON.stringify([]));
        }
    }

    startTimer() {
        this.timer.total = Date.now();
        this.timer.questionStart = Date.now();
        this.interval = setInterval(() => {
            document.getElementById('timer').textContent = 
                this.formatTime(Date.now() - this.timer.total);
        }, 1000);
    }

    // startTimer() {
    //     this.interval = setInterval(() => {
    //         this.timer.seconds++;
    //         if(this.timer.seconds >= 60) {
    //             this.timer.minutes++;
    //             this.timer.seconds = 0;
    //         }
    //         document.getElementById('timer').textContent = 
    //             `${String(this.timer.hours).padStart(2, '0')}:${String(this.timer.minutes).padStart(2, '0')}:${String(this.timer.seconds).padStart(2, '0')}`;
    //     }, 1000);
    // }

    formatTime(ms) {
        const date = new Date(ms);
        return date.toISOString().substr(11, 8);
    }

    renderQuestion() {
        const container = document.getElementById('questionContainer');
        const caseStudy = this.quizData[this.currentCaseStudy];
        const question = caseStudy.questions[this.currentQuestion];
        const isLastQuestion = this.currentQuestion === this.quizData[this.currentCaseStudy].questions.length - 1;

        container.innerHTML = `

        
            <div class="question-card">
                <div class="case-study-header mb-4 sticky-top bg-white py-3 shadow-sm">
                    <h4 class="text-primary">${caseStudy.title}</h4>
                    <p class="text-muted small">${caseStudy.scenario}</p>
                </div>
                
                <h5 class="mb-3">Question ${this.currentQuestion + 1}</h5>
                <p class="fw-bold">${question.text}</p>
                
                <div class="options-container">
                    ${question.options.map((opt, i) => `
                        <label class="option-label ${this.getSelectedClass(i)}">
                            <input type="radio" name="answer" value="${i}" 
                                ${this.getCheckedState(i)} 
                                onchange="quiz.handleAnswerSelect(event)">
                            ${opt}
                        </label>
                    `).join('')}
                </div>

                <div class="confidence-meter mt-4">
                    <small class="text-muted">Confidence Level:</small>
                        <div class="d-flex gap-2">
                            ${[1,2,3,4,5].map(i => `
                                <button class="confidence-btn ${this.getConfidenceClass(i)}" 
                                    data-confidence-level="${i}"
                                    onclick="quiz.setConfidence(${i})">${i}</button>
                            `).join('')}
                        </div>
                </div>

                ${this.currentQuestion > 0 ? `
                    <div class="alert alert-warning mt-3 d-none" id="flaggedAlert">
                        <i class="bi bi-flag"></i> You flagged this question for review
                    </div>` : ''}
            </div>

        
                <button class="btn btn-sm btn-warning float-end flag-button" onclick="quiz.addFlagToQuestion()">
                    ${this.getFlagState()} Flag
                </button>

        `;
        this.updateProgressBar();
    }

// Add new method to handle button state
updateButtonState() {
    const isLastQuestion = this.currentQuestion === 
        this.quizData[this.currentCaseStudy].questions.length - 1;
    
    document.getElementById('nextBtn').textContent = 
        isLastQuestion ? 'Submit Quiz' : 'Next Question';
}

    updateProgressBar() {
        const progress = ((this.currentQuestion + 1) / 
            this.quizData[this.currentCaseStudy].questions.length) * 100;
        document.querySelector('.progress-bar').style.width = `${progress}%`;
        
        // Update button text
        const nextBtn = document.getElementById('nextBtn');
        const isLastQuestion = this.currentQuestion === this.quizData[this.currentCaseStudy].questions.length - 1;
        nextBtn.textContent = isLastQuestion ? 'Submit Quiz' : 'Next Question';
    }

    setupEventListeners() {
        // Previous button
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        
        // Next/Submit button
        document.getElementById('nextBtn').addEventListener('click', () => {
            if(this.currentQuestion === this.quizData[this.currentCaseStudy].questions.length - 1) {
                this.submitQuiz();
            } else {
                this.nextQuestion();
            }
        });
        
        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        // Update button state when moving between questions
        document.addEventListener('DOMNodeInserted', () => this.updateButtonState());
    }

    handleAnswerSelect(event) {
        const selected = parseInt(event.target.value);
        this.saveAnswer(selected);
    }

    saveAnswer(answerIndex) {
        const answer = {
            caseStudyId: this.quizData[this.currentCaseStudy].id,
            questionId: this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id,
            answer: answerIndex,
            confidence: null,
            timeSpent: Date.now() - this.timer.questionStart,
            flagged: false,
            timestamp: new Date().toISOString() // Add timestamp
        };
        
        // Update or create answer entry
        const existing = this.userAnswers.find(a => 
            a.questionId === answer.questionId);
        if(existing) {
            Object.assign(existing, answer);
        } else {
            this.userAnswers.push(answer);
        }
        
        this.timer.questionStart = Date.now();
        this.updateProgressBar();
    }

    setConfidence(level) {
        const currentAnswer = this.userAnswers.find(a => 
            a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id);
        if(currentAnswer) {
            currentAnswer.confidence = level;
            document.querySelectorAll('.confidence-btn').forEach(btn => {
                btn.classList.remove('active');
                if(parseInt(btn.dataset.confidenceLevel) === level) btn.classList.add('active');
            });
        }
    }

    nextQuestion() {
        if(this.validateCurrentQuestion()) {
            if(this.currentQuestion < this.quizData[this.currentCaseStudy].questions.length - 1) {
                this.currentQuestion++;
                this.autoSave();
                this.renderQuestion();
            } else {
                this.autoSave();
                this.submitQuiz();
            }
        }
    }

    previousQuestion() {
        if(this.currentQuestion > 0) {
            this.currentQuestion--;
            this.autoSave();
            this.renderQuestion();
        }
    }

    validateCurrentQuestion() {
        const answered = this.userAnswers.some(a => 
            a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id);
        
        if(!answered) {
            alert('Please select an answer before continuing');
            return false;
        }
        return true;
    }

    submitQuiz() {
        if(!this.validateCurrentQuestion()) return;

        if(this.userAnswers.length !== this.quizData[this.currentCaseStudy].questions.length) {
            if(!confirm('Not all questions answered. Submit anyway?')) return;
        }
        clearInterval(this.interval);
        localStorage.removeItem('activeQuiz'); // Clear incomplete quiz

        const results = {
            date: new Date().toISOString(),
            duration: Date.now() - this.timer.total,
            answers: this.userAnswers,
            score: this.calculateScore(),
            caseStudyId: this.quizData[this.currentCaseStudy].id // Use actual ID
        };

    
        // Save to localStorage
        const allResults = JSON.parse(localStorage.getItem('quizResults') || []);
        allResults.push(results);
        localStorage.setItem('quizResults', JSON.stringify(allResults));

        
        // Redirect with correct ID
        window.location.href = `results.html?caseStudy=${this.quizData[this.currentCaseStudy].id}`;


    }

    calculateScore() {
        let correct = 0;
        this.userAnswers.forEach(answer => {
            const question = this.quizData[this.currentCaseStudy].questions
                .find(q => q.id === answer.questionId);
            if(answer.answer === question.correct) correct++;
        });
        return (correct / this.userAnswers.length) * 100;
    }

    // Helper methods
    getSelectedClass(index) {
        const answer = this.userAnswers.find(a => 
            a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id);
        return answer?.answer === index ? 'selected' : '';
    }

    getCheckedState(index) {
        const answer = this.userAnswers.find(a => 
            a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id);
        return answer?.answer === index ? 'checked' : '';
    }

    getConfidenceClass(level) {
        const answer = this.userAnswers.find(a => 
            a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id);
        return answer?.confidence === level ? 'active' : '';
    }
        // In Quiz class
        addFlagToQuestion() {
            const currentQId = this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id;
            
                // Find or initialize answer
            let answer = this.userAnswers.find(a => a.questionId === currentQId) || {
                caseStudyId: this.quizData[this.currentCaseStudy].id,
                questionId: currentQId,
                answer: null,
                confidence: null,
                timeSpent: 0,
                flagged: false
            };
            
            // Toggle flag
            answer.flagged = !answer.flagged;
            
            // Update or add to answers
            const index = this.userAnswers.findIndex(a => a.questionId === currentQId);
            if(index === -1) {
                this.userAnswers.push(answer);
            } else {
                this.userAnswers[index] = answer;
            }
            
            // Update UI and storage
            this.toggleFlagDisplay();
            this.autoSave();
        }

        toggleFlagDisplay() {
            const flagAlert = document.getElementById('flaggedAlert');
            const flagButton = document.querySelector('.flag-button');
            const currentAnswer = this.userAnswers.find(a => 
                a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id
            );
            
            if(flagAlert) flagAlert.classList.toggle('d-none', !currentAnswer?.flagged);
            if(flagButton) flagButton.innerHTML = currentAnswer?.flagged ? '★ Flag' : '☆ Flag';
        }
            // Add helper method:
        getFlagState() {
            const answer = this.userAnswers.find(a => 
                a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id);
            return answer?.flagged ? '★' : '☆';
        }

        checkExistingSession() {
            const existing = localStorage.getItem('activeQuiz');
            if(existing) {
                if(confirm('Found an incomplete quiz. Resume?')) {
                    const savedState = JSON.parse(existing);
                    this.currentCaseStudy = savedState.currentCaseStudy;
                    this.currentQuestion = savedState.currentQuestion;
                    this.userAnswers = savedState.userAnswers;
                    this.timer = savedState.timer;
                    this.quizData = window.questionsData.caseStudies; // Ensure data loaded
                } else {
                    localStorage.removeItem('activeQuiz');
                }
            }
        }
        
        autoSave() {
            const state = {
                currentCaseStudy: this.currentCaseStudy,
                currentQuestion: this.currentQuestion,
                userAnswers: this.userAnswers,
                timer: {
                    total: this.timer.total,
                    questionStart: Date.now()
                }
            };
            localStorage.setItem('activeQuiz', JSON.stringify(state));
        }

                // Add validation before question navigation
        validateCurrentQuestion() {
            const answered = this.userAnswers.some(a => 
                a.questionId === this.quizData[this.currentCaseStudy].questions[this.currentQuestion].id);
            
            if(!answered) {
                this.showValidationError();
                return false;
            }
            return true;
        }

        showValidationError() {
            const container = document.getElementById('questionContainer');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger mt-3';
            errorDiv.innerHTML = `
                <i class="bi bi-exclamation-circle"></i>
                Please select an answer before continuing
            `;
            container.appendChild(errorDiv);
            
            setTimeout(() => errorDiv.remove(), 3000);
            
            // Scroll to error
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
            });
        }

        togglePause() {
            if(this.isPaused) {
                this.resumeTimer();
            } else {
                this.pauseTimer();
            }
        }
        
        pauseTimer() {
            clearInterval(this.interval);
            this.isPaused = true;
            document.getElementById('pauseBtn').textContent = '▶';
        }
        
        resumeTimer() {
            this.timer.questionStart = Date.now();
            this.startTimer();
            this.isPaused = false;
            document.getElementById('pauseBtn').textContent = '⏸';
        }

        setupTouchNavigation() {
            let touchStartX = 0;
            
            document.addEventListener('touchstart', e => {
                touchStartX = e.touches[0].clientX;
            });
            
            document.addEventListener('touchend', e => {
                const touchEndX = e.changedTouches[0].clientX;
                const deltaX = touchStartX - touchEndX;
                
                if(Math.abs(deltaX) > 50) { // Minimum swipe distance
                    if(deltaX > 0) {
                        this.nextQuestion();
                    } else {
                        this.previousQuestion();
                    }
                }
            });
        }
}

// document.getElementById('nextBtn').addEventListener('click', () => {
//     if(isLastQuestion) {
//         this.submitQuiz();
//     } else {
//         this.nextQuestion();
//     }
// });
// Initialize quiz
const quiz = new Quiz();