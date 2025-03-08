class Quiz {
    constructor() {
        this.currentCaseStudy = 0;
        this.currentQuestionIndex = 0;
        this.timer = { total: 0, questionStart: 0 };
        this.userAnswers = [];
        this.quizData = [];
        this.interval = null;
        this.isPaused = false;
        this.modal = null; // Will initialize after DOM loads
        
        console.log("Quiz initialized");

    }


    async init() {
        console.log("[DEBUG] Initializing quiz...");
        try {
            this.showLoading();
            console.log("[DEBUG] Setting up modal...");
            this.setupModal();

            if (!window.questionsData) {
                throw new Error("Questions data not loaded. Check questions.js file.");
            }
          //  this.quizData = window.questionsData.caseStudies;
          console.log("Loaded quiz data:", window.questionsData);
          this.quizData = window.questionsData?.caseStudies || [];
          console.log("Processed quizData:", this.quizData);
          
            console.log("[DEBUG] Quiz data loaded:", this.quizData);

            this.checkExistingSession();
            this.initializeStorage();
            this.startTimer();
            this.setupEventListeners();
            this.setupKeyboardNavigation();
            this.renderCaseStudyList();
            this.renderQuestion();
            this.updateProgress();
        } catch (error) {
            console.error("[DEBUG] Init error:", error);
            this.showError(error);
        } finally {
            this.hideLoading();
        }
    }

     // Add this debug method
     debugState() {
        return {
            currentCaseStudy: this.currentCaseStudy,
            currentQuestion: this.currentQuestionIndex,
            totalCaseStudies: this.quizData?.length || 0,
            currentCSQuestions: this.quizData[this.currentCaseStudy]?.questions.length || 0,
            answersCount: this.userAnswers.length,
            totalQuestions: this.getTotalQuestionCount(),
            isLastQuestion: this.currentQuestionIndex === this.quizData[this.currentCaseStudy]?.questions.length - 1,
            isLastCaseStudy: this.currentCaseStudy === this.quizData.length - 1
        };
    }

    renderCaseStudyList() {
        const accordion = document.getElementById('caseStudyAccordion');
        accordion.innerHTML = this.quizData.map((cs, index) => `
            <div class="accordion-item">
                <h3 class="accordion-header">
                    <button class="accordion-button ${index === this.currentCaseStudy ? '' : 'collapsed'}" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#cs${cs.id}"
                            aria-expanded="${index === this.currentCaseStudy}">
                        ${cs.title}
                        <span class="progress-indicator">
                            ${this.getCompletedCount(cs.id)}/${cs.questions.length}
                        </span>
                    </button>
                </h3>
                <div id="cs${cs.id}" 
                     class="accordion-collapse collapse ${index === this.currentCaseStudy ? 'show' : ''}"
                     data-bs-parent="#caseStudyAccordion">
                    <div class="accordion-body p-2">
                        ${this.renderQuestionIndicators(cs.id)}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Update active question indicator
        const activeIndicator = document.querySelector(`.question-indicator.current`);
        if (activeIndicator) {
            activeIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    renderQuestionIndicators(caseStudyId) {
        const caseStudy = this.quizData.find(cs => cs.id === caseStudyId);
        return `<div class="d-flex flex-wrap gap-1">
            ${caseStudy.questions.map((q, i) => {
                const answer = this.userAnswers.find(a => 
                    a.caseStudyId === caseStudyId && 
                    a.questionId === q.id
                );
                let status = 'unanswered';
                if (answer) status = answer.flagged ? 'flagged' : 'answered';
                if (caseStudyId === this.quizData[this.currentCaseStudy].id && 
                    i === this.currentQuestionIndex) status += ' current';
                
                return `<div class="question-indicator ${status}" 
                            onclick="quiz.jumpToQuestion(${caseStudyId - 1}, ${i})">
                        ${i + 1}
                    </div>`;
            }).join('')}
        </div>`;
    }


    jumpToQuestion(caseStudyIndex, questionIndex) {
        this.currentCaseStudy = caseStudyIndex;
        this.currentQuestionIndex = questionIndex;
        this.renderQuestion();
        this.updateProgress();
        this.renderCaseStudyList();
        this.renderCaseStudyList(); // Force update indicators
        window.scrollTo(0, 0); // Scroll to top for better UX
    }

    setupModal() {
        console.log("[DEBUG] Initializing modal...");
        try {
            const modalElement = document.getElementById('transitionModal');
            if (!modalElement) {
                console.error("MODAL ELEMENT NOT FOUND!");
                return;
            }
            // this.modal = new bootstrap.Modal(modalElement, {
            //     keyboard: false,
            //     backdrop: 'static'
            // });
            // console.log("[DEBUG] Bootstrap modal instance:", this.modal);

            this.modal = new bootstrap.Modal(modalElement);
            console.log("Modal instance:", this.modal);

            const proceedButton = document.getElementById('proceedButton');
            proceedButton.addEventListener('click', () => {
                console.log("[DEBUG] Proceed button clicked");
                this.handleProceed();
            });
        } catch (error) {
            console.error("[DEBUG] Modal setup error:", error);
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
        const currentCaseStudy = this.quizData[this.currentCaseStudy];
        if (!currentCaseStudy) {
            console.error("Current case study not found");
            return;
        }

        const currentQuestion = currentCaseStudy.questions[this.currentQuestionIndex];
        if (!currentQuestion) {
            console.error("Current question not found");
            return;
        }
            // Get current answer for this question
            const currentAnswer = this.userAnswers.find(a => 
                a.caseStudyId === currentCaseStudy.id && 
                a.questionId === currentQuestion.id
            );
        const container = document.getElementById('questionContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="question-card">
                <div class="case-study-header mb-4 sticky-top bg-white py-3 shadow-sm">
                    <h4 class="text-primary">${currentCaseStudy.title}</h4>
                    <p class="text-muted small">${currentCaseStudy.scenario}</p>
                </div>
                
                <h5 class="mb-3">Question ${this.currentQuestionIndex + 1}</h5>
                <p class="fw-bold">${currentQuestion.text}</p>
                
                <div class="options-container">
                    ${currentQuestion.options.map((opt, i) => `
                        <label class="option-label ${this.getSelectedClass(currentCaseStudy.id, currentQuestion.id, i)}">
                            <input type="radio" name="answer" value="${i}" 
                                ${this.getCheckedState(currentCaseStudy.id, currentQuestion.id, i)} 
                                onchange="quiz.handleAnswerSelect(event)">
                            ${opt}
                        </label>
                    `).join('')}
                </div>

                <div class="confidence-meter mt-4">
                    <small class="text-muted">Confidence Level:</small>
                    <div class="d-flex gap-2">
                        ${[1,2,3,4,5].map(i => `
                            <button class="confidence-btn ${this.getConfidenceClass(currentCaseStudy.id, currentQuestion.id, i)}" 
                                data-confidence-level="${i}"
                                onclick="quiz.setConfidence(${i})">${i}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="alert alert-warning mt-3 ${currentAnswer?.flagged ? '' : 'd-none'}" id="flaggedAlert">
                    <i class="bi bi-flag"></i> You flagged this question for review
                </div>

                <button class="btn btn-sm btn-warning float-end flag-button" 
                    onclick="quiz.addFlagToQuestion()">
                    ${this.getFlagState(currentCaseStudy.id, currentQuestion.id)} Flag
                </button>
            </div>
        `;
    
        this.toggleFlagDisplay();

    }

    updateProgress() {
        const total = this.getTotalQuestionCount();
        const answered = this.userAnswers.length;
        document.querySelector('.progress-bar').style.width = `${(answered/total)*100}%`;
        document.getElementById('submitAllBtn').style.display = 
            answered === total ? 'block' : 'none';
    }

   // Helper methods
   getCompletedCount(caseStudyId) {
    return this.userAnswers.filter(a => a.caseStudyId === caseStudyId).length;
}

calculateScores() {
    return this.quizData.map(cs => ({
        caseStudyId: cs.id,
        score: this.calculateCaseStudyScore(cs.id)
    }));
}

calculateCaseStudyScore(caseStudyId) {
    const caseStudy = this.quizData.find(cs => cs.id === caseStudyId);
    if (!caseStudy) return 0;
    
    const answers = this.userAnswers.filter(a => 
        a.caseStudyId === caseStudyId && 
        !a.flagged // Exclude flagged questions
    );
    
    const correct = answers.filter(a => {
        const question = caseStudy.questions.find(q => q.id === a.questionId);
        return question?.correct === a.answer;
    }).length;
    
    return answers.length > 0 ? (correct / answers.length) * 100 : 0;
}


calculateTotalScore() {
    let correct = 0;
    let totalAnswered = 0;
    
    this.quizData.forEach(cs => {
        const caseStudyAnswers = this.userAnswers.filter(a => 
            a.caseStudyId === cs.id && 
            !a.flagged
        );
        
        correct += caseStudyAnswers.filter(a => 
            a.answer === cs.questions.find(q => q.id === a.questionId)?.correct
        ).length;
        
        totalAnswered += caseStudyAnswers.length;
    });
    
    return totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;
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
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        document.getElementById('submitAllBtn').addEventListener('click', () => {
            console.log("Submit button clicked");
            this.submitQuiz();
        });

        if (prevBtn) prevBtn.addEventListener('click', () => this.previousQuestion());
        // if (nextBtn) nextBtn.addEventListener('click', () => {
        //     if (this.currentQuestionIndex === this.currentCaseStudyQuestions().length - 1) {
        //         this.submitQuiz();
        //     } else {
        //         this.nextQuestion();
        //     }
        // });
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion()); // FIX HERE
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());

        // Replace DOMNodeInserted with MutationObserver
        const observer = new MutationObserver(() => {
            this.updateButtonState();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    getSkippedQuestions() {
        const currentCS = this.quizData[this.currentCaseStudy];
        return currentCS.questions
            .map((q, index) => {
                const answer = this.userAnswers.find(a => 
                    a.caseStudyId === currentCS.id && 
                    a.questionId === q.id
                );
                // Consider skipped if not answered and not flagged
                return !answer?.answer && !answer?.flagged ? index + 1 : null;
            })
            .filter(n => n !== null);
    }

    currentCaseStudyQuestions() {
        return this.quizData[this.currentCaseStudy]?.questions || [];
    }


     // Modified methods with case study awareness
     handleAnswerSelect(event) {
        const selected = parseInt(event.target.value);
        const caseStudy = this.quizData[this.currentCaseStudy];
        this.saveAnswer(caseStudy.id, caseStudy.questions[this.currentQuestionIndex].id, selected);
    }


    saveAnswer(caseStudyId, questionId, answerIndex) {
        const answer = {
            caseStudyId,
            questionId,
            answer: answerIndex,
            confidence: null,
            timeSpent: Date.now() - this.timer.questionStart,
            flagged: false,
            timestamp: new Date().toISOString()
        };
        
        const existingIndex = this.userAnswers.findIndex(a => 
            a.caseStudyId === caseStudyId && a.questionId === questionId);
        
        if(existingIndex > -1) {
            this.userAnswers[existingIndex] = answer;
        } else {
            this.userAnswers.push(answer);
        }
        
        this.timer.questionStart = Date.now();
        this.updateProgress();
        this.renderCaseStudyList();
        this.autoSave();
    }

    setConfidence(level) {
        const currentCaseStudy = this.quizData[this.currentCaseStudy];
        const currentQuestion = currentCaseStudy?.questions[this.currentQuestionIndex];
        if (!currentQuestion) return;

        const currentAnswer = this.userAnswers.find(a => 
            a.caseStudyId === currentCaseStudy.id && 
            a.questionId === currentQuestion.id
        );
        
        if (currentAnswer) {
            currentAnswer.confidence = level;
            document.querySelectorAll('.confidence-btn').forEach(btn => {
                btn.classList.remove('active');
                if(parseInt(btn.dataset.confidenceLevel) === level) btn.classList.add('active');
            });
        }
    }

    nextQuestion() {
        console.log("--- nextQuestion START ---", this.debugState());
        
        if (!this.validateCurrentQuestion()) {
            console.log("Blocked: Unanswered question");
            this.showValidationError();
            return;
        }

        const currentCS = this.quizData[this.currentCaseStudy];
        const isLastQuestion = this.currentQuestionIndex === currentCS.questions.length - 1;
        const isLastCaseStudy = this.currentCaseStudy === this.quizData.length - 1;

        console.log(`Navigation: lastQuestion? ${isLastQuestion}, lastCaseStudy? ${isLastCaseStudy}`);

        if (isLastQuestion) {
            if (isLastCaseStudy) {
                // Final submission flow
                this.handleFinalSubmission();
            } else {
                // Show transition modal for next case study
                console.log("[FIX] Showing case study transition modal");
                this.showCaseStudyTransitionModal();
                return; // Add this to prevent further execution
            }
        } else {
            this.currentQuestionIndex++;
            this.renderQuestion();
            this.updatePagination();
        }

        console.log("--- nextQuestion END ---", this.debugState());
        this.updateProgress();
    }

     updatePagination() {
        const indicators = document.querySelectorAll('.question-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('current', index === this.currentQuestionIndex);
        });
        
        // Scroll to current indicator
        const currentIndicator = document.querySelector('.question-indicator.current');
        if (currentIndicator) {
            currentIndicator.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    showTransitionModal() {
        const nextCS = this.quizData[this.currentCaseStudy + 1];
        document.getElementById('nextCaseStudyTitle').textContent = nextCS.title;
        this.modal.show();
    }

 
    handleProceed() {
        console.log("[FIX] Handling proceed to next case study");
        this.modal.hide();
        
        // Update indices
        this.currentCaseStudy++;
        this.currentQuestionIndex = 0;
        
        // Render new content
        this.renderQuestion();
        this.renderCaseStudyList();
        this.updateProgress();
    }



    handleFinalSubmission() {
        console.log("[FIX] Handling final submission");
        const totalQuestions = this.getTotalQuestionCount();
        
        // Only show submit confirmation if answers are incomplete
        if (this.userAnswers.length !== totalQuestions) {
            const confirmed = confirm(`You've answered ${this.userAnswers.length}/${totalQuestions} questions. Submit anyway?`);
            if (!confirmed) return;
        }
        
        // Proceed with submission
        this.submitQuiz();
    }

    validateCurrentQuestion() {
        const currentCS = this.quizData[this.currentCaseStudy];
        const currentQ = currentCS.questions[this.currentQuestionIndex];
        return this.userAnswers.some(a => 
            a.caseStudyId === currentCS.id &&
            a.questionId === currentQ.id
        );
    }

    handleModalProceed() {
        this.modal.hide();
        this.currentCaseStudy++;
        this.currentQuestionIndex = 0;
        this.renderQuestion();
        this.renderCaseStudyList();
        this.updateProgress();
    }

    showCaseStudyTransitionModal() {
        console.log("--- showCaseStudyTransitionModal START ---");
        try {
            const nextCS = this.quizData[this.currentCaseStudy + 1];
            console.log("Next CS data:", nextCS);
    
            if (!nextCS) {
                console.error("No next case study found!");
                return;
            }
    
            const titleElement = document.getElementById('nextCaseStudyTitle');
            const warningElement = document.getElementById('skippedQuestionsWarning');
            const defaultMessage = document.getElementById('transitionDefaultMessage');
            
            if (!titleElement || !warningElement || !defaultMessage) {
                throw new Error("Missing modal elements");
            }
    
            // Update main title
            titleElement.textContent = nextCS.title;
            
            // Check for skipped questions
            const skippedNumbers = this.getSkippedQuestions();
            if (skippedNumbers.length > 0) {
                warningElement.innerHTML = `
                    <div class="alert alert-warning mt-3">
                        <i class="bi bi-exclamation-triangle"></i>
                        You skipped questions: ${skippedNumbers.join(', ')}
                    </div>
                `;
                warningElement.classList.remove('d-none');
                defaultMessage.classList.add('d-none');
            } else {
                warningElement.classList.add('d-none');
                defaultMessage.classList.remove('d-none');
            }
    
            if (!this.modal) throw new Error("Modal not initialized");
            this.modal.show();
            
        } catch (error) {
            console.error("showCaseStudyTransitionModal error:", error);
        }
        console.log("--- showCaseStudyTransitionModal END ---");
    }



  // New method for final submission
  showFinalSubmissionPrompt() {
    if (confirm(`You've answered ${this.userAnswers.length}/${this.getTotalQuestionCount()} questions. Submit anyway?`)) {
        this.submitQuiz();
    }
}

// Modified validation
validateCurrentQuestion() {
    const currentCS = this.quizData[this.currentCaseStudy];
    const currentQ = currentCS.questions[this.currentQuestionIndex];
    
    return this.userAnswers.some(a => 
        a.caseStudyId === currentCS.id &&
        a.questionId === currentQ.id
    );
}


     previousQuestion() {
        const currentCaseStudy = this.quizData[this.currentCaseStudy];
        if (!currentCaseStudy) return;

        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        } else {
            if (this.currentCaseStudy > 0) {
                this.currentCaseStudy--;
                this.currentQuestionIndex = 
                    this.quizData[this.currentCaseStudy].questions.length - 1;
            }
        }
        this.renderQuestion();
        this.autoSave();
    }

    submitQuiz() {

        console.log("[FIX] Submitting quiz");
        // Only submit when all case studies are completed
        // const isLastCaseStudy = this.currentCaseStudy === this.quizData.length - 1;
        // const isLastQuestion = this.currentQuestionIndex === this.quizData[this.currentCaseStudy].questions.length - 1;

        console.log("--- submitQuiz START ---", this.debugState());
        const totalQuestions = this.getTotalQuestionCount();
        
        // Only show submit confirmation if answers are incomplete
        if (this.userAnswers.length !== totalQuestions) {
            console.log("Incomplete submission");
            if (!confirm(`You've answered ${this.userAnswers.length}/${totalQuestions} questions. Submit anyway?`)) return;

        }

                
        // if (!isLastCaseStudy || !isLastQuestion) {
        //     console.error("Submission called too early!");
        //     return;
        // }

        console.log("Proceeding with submission...");
        // Proceed with submission
        const results = {
            date: new Date().toISOString(),
            duration: Date.now() - this.timer.total,
            answers: this.userAnswers,
            scores: this.calculateScores(),
            totalScore: this.calculateTotalScore(), // MAKE SURE THIS EXISTS
            caseStudyId: this.quizData[this.currentCaseStudy].id

        };

        localStorage.setItem('quizResults', JSON.stringify([
            ...JSON.parse(localStorage.getItem('quizResults')) || [],
            results
        ]));
        localStorage.removeItem('activeQuiz');
        console.log("Submission completed, redirecting...");

        window.location.href = 'results.html';
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
    getSelectedClass(caseStudyId, questionId, index) {
        const answer = this.userAnswers.find(a => 
            a.caseStudyId === caseStudyId && a.questionId === questionId);
        return answer?.answer === index ? 'selected' : '';
    }


    getCheckedState(caseStudyId, questionId, index) {
        const answer = this.userAnswers.find(a => 
            a.caseStudyId === caseStudyId && 
            a.questionId === questionId
        );
        return answer?.answer === index ? 'checked' : '';
    }

      getConfidenceClass(caseStudyId, questionId, level) {
        const answer = this.userAnswers.find(a => 
            a.caseStudyId === caseStudyId && 
            a.questionId === questionId
        );
        return answer?.confidence === level ? 'active' : '';
    }
        // In Quiz class
        addFlagToQuestion() {
            const currentCaseStudy = this.quizData[this.currentCaseStudy];
            const currentQuestion = currentCaseStudy?.questions[this.currentQuestionIndex];
            if (!currentQuestion) return;
    
            let answer = this.userAnswers.find(a => 
                a.caseStudyId === currentCaseStudy.id && 
                a.questionId === currentQuestion.id
            ) || {
                caseStudyId: currentCaseStudy.id,
                questionId: currentQuestion.id,
                answer: null,
                confidence: null,
                timeSpent: 0,
                flagged: false
            };
            
            answer.flagged = !answer.flagged;
            const index = this.userAnswers.findIndex(a => 
                a.caseStudyId === currentCaseStudy.id && 
                a.questionId === currentQuestion.id
            );
            
            if (index === -1) {
                this.userAnswers.push(answer);
            } else {
                this.userAnswers[index] = answer;
            }
            
            this.toggleFlagDisplay();
            this.renderCaseStudyList(); // Update indicators after flagging
            this.autoSave();
        }

        toggleFlagDisplay() {
            const currentCaseStudy = this.quizData[this.currentCaseStudy];
            const currentQuestion = currentCaseStudy?.questions[this.currentQuestionIndex];
            if (!currentQuestion) return;
    
            const flagAlert = document.getElementById('flaggedAlert');
            const flagButton = document.querySelector('.flag-button');
            const currentAnswer = this.userAnswers.find(a => 
                a.caseStudyId === currentCaseStudy.id && 
                a.questionId === currentQuestion.id
            );
            
            if (flagAlert) flagAlert.classList.toggle('d-none', !currentAnswer?.flagged);
            if (flagButton) flagButton.innerHTML = currentAnswer?.flagged ? '★ Flag' : '☆ Flag';
        }
            // Add helper method:
            getFlagState(caseStudyId, questionId) {
                const answer = this.userAnswers.find(a => 
                    a.caseStudyId === caseStudyId && 
                    a.questionId === questionId
                );
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

        getTotalQuestionCount() {
            return this.quizData.reduce((sum, cs) => sum + cs.questions.length, 0);
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
document.addEventListener('DOMContentLoaded', () => quiz.init());