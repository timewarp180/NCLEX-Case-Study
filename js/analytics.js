document.addEventListener('DOMContentLoaded', () => {
    const results = JSON.parse(localStorage.getItem('quizResults')) || [];
    
    if(results.length === 0) {
        document.querySelector('main').innerHTML = `
            <div class="alert alert-info">No quiz results available yet. Complete a case study to see analytics.</div>
        `;
        return;
    }

    // Helper functions
    const getQuestionData = (questionId, caseStudyId) => {
        const caseStudy = window.questionsData?.caseStudies?.find(c => c.id === caseStudyId);
        return caseStudy?.questions?.find(q => q.id === questionId);
    };

    const getAnswerText = (answer) => {
        const question = getQuestionData(answer.questionId, answer.caseStudyId);
        return question?.options[answer.answer] || 'No answer selected';
    };

    const getCorrectAnswerText = (questionId, caseStudyId) => {
        const question = getQuestionData(questionId, caseStudyId);
        return question?.options[question.correct] || 'Not available';
    };

    // Chart functions
    const renderOverallChart = (results) => {
        const ctx = document.getElementById('overallChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: calculatePercentage(results),
                    backgroundColor: ['#4CAF50', '#F44336'],
                    hoverOffset: 4
                }]
            },
            options: {
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { enabled: true }
                },
                animation: { duration: 1000 }
            }
        });
    };

    const calculatePercentage = (results) => {
        const total = results.reduce((sum, r) => sum + r.answers.length, 0);
        const correct = results.reduce((sum, r) => {
            return sum + r.answers.filter(a => {
                const correctAns = getQuestionData(a.questionId, r.caseStudyId)?.correct;
                return a.answer === correctAns;
            }).length;
        }, 0);
        return [correct, total - correct];
    };

    const renderTimeChart = (results) => {
        const ctx = document.getElementById('timeChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: results.map((_, i) => `Attempt ${i + 1}`),
                datasets: [{
                    label: 'Time Spent (minutes)',
                    data: results.map(r => (r.duration / 60000).toFixed(1)),
                    backgroundColor: '#2196F3'
                }]
            }
        });
    };

    const renderProgressChart = (results) => {
        const ctx = document.getElementById('progressChart');
        if (!ctx) {
            console.error('Progress chart canvas not found');
            return;
        }
    
        // Verify we have valid data
        if (!results || results.length === 0) {
            console.log('No results available for progress chart');
            return;
        }
    
        // Ensure results have required properties
        const validResults = results.filter(r => 
            r.date && r.totalScore !== undefined && r.totalScore !== null
        );
    
        // Sort by date
        validResults.sort((a, b) => new Date(a.date) - new Date(b.date));
    
        // Create the chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: validResults.map(r => 
                    new Date(r.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    })
                ),
                datasets: [{
                    label: 'Accuracy Progress (%)',
                    data: validResults.map(r => r.totalScore),
                    borderColor: '#9C27B0',
                    backgroundColor: '#9C27B080',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (context) => 
                                new Date(validResults[context[0].dataIndex].date)
                                    .toLocaleString(),
                            label: (context) => 
                                `Score: ${context.raw}%`
                        }
                    }
                }
            }
        });
    };

    // Flagged questions rendering
    function renderFlaggedQuestions(results) {
        const container = document.getElementById('flaggedQuestions');
        if(!container) return;
    
        const flagged = results.flatMap(r => 
            r.answers.filter(a => a.flagged)
                    .map(a => ({
                        ...a,
                        caseStudyId: r.caseStudyId,
                        timestamp: r.date
                    }))
        );
    
        if(flagged.length === 0) {
            container.innerHTML = `<div class="alert alert-info">No flagged questions found</div>`;
            return;
        }
    
        container.innerHTML = flagged.map(answer => {
            const question = getQuestionData(answer.questionId, answer.caseStudyId);
            const caseStudy = window.questionsData.caseStudies.find(c => c.id === answer.caseStudyId);
            const hasAnswer = answer.answer !== null && answer.answer !== undefined;
            
            if(!question) return '';
            
            return `
                <div class="flagged-question">
                    <div class="question-scenario">
                        <h4>${caseStudy.title}</h4>
                        <p class="text-muted">${caseStudy.scenario}</p>
                    </div>
    
                    <h4>Question ${answer.questionId}: ${question.text}</h4>
    
                    <div class="${hasAnswer ? '' : 'no-answer-alert'}">
                        <strong>${hasAnswer ? 'Your Response' : 'Missing Answer'}</strong>
                        ${hasAnswer ? 
                            `You selected option ${answer.answer + 1}` : 
                            'You did not provide an answer for this question'
                        }
                    </div>
                    
                    <ul class="option-list">
                        ${question.options.map((opt, i) => {
                            const isUserAnswer = hasAnswer && i === answer.answer;
                            const isCorrect = i === question.correct;
                            
                            return `
                                <li class="${isUserAnswer ? 'user-answer' : ''} 
                                          ${isCorrect ? 'correct-answer' : ''}
                                          ${!hasAnswer && isCorrect ? 'unanswered' : ''}">
                                    ${opt}
                                    ${isUserAnswer ? '<span class="badge bg-danger ms-2">Your Answer</span>' : ''}
                                    ${isCorrect ? '<span class="badge bg-success ms-2">Correct</span>' : ''}
                                    ${!hasAnswer && isCorrect ? '<span class="badge bg-warning ms-2">Missed Correct Answer</span>' : ''}
                                </li>`;
                        }).join('')}
                    </ul>
    
                    <div class="rationale-box">
                        <h5 class="text-primary">Rationale</h5>
                        <p>${question.explanation}</p>
                        ${question.reference ? `
                            <div class="mt-2 d-flex align-items-center gap-2">
                                <span class="badge reference-badge" style="font-weight: bold;">📚 Reference:</span>
                                <span class="text-muted small">${question.reference}</span>
                            </div>
                        ` : ''}
                    </div>
    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <small class="text-muted">
                            Case Study ${answer.caseStudyId} • Question ${answer.questionId}
                        </small>
                        <small class="text-muted">
                            Flagged on ${new Date(answer.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </small>
                    </div>
                </div>
            `;
        }).join('');
    };

    // function renderFlaggedQuestions(results) {
    //     const container = document.getElementById('flaggedQuestions');
    //     if(!container) return;
    
    //     // Get all flagged answers across all attempts
    //     const flagged = results.flatMap(attempt => 
    //         attempt.answers
    //             .filter(a => a.flagged)
    //             .map(a => ({
    //                 ...a,
    //                 date: attempt.date,
    //                 caseStudyId: attempt.caseStudyId,
    //                 totalScore: attempt.totalScore
    //             }))
    //     );
    
    //     if(flagged.length === 0) {
    //         container.innerHTML = `<div class="alert alert-info">No flagged questions found</div>`;
    //         return;
    //     }
    
    //     container.innerHTML = flagged.map(answer => {
    //         const question = getQuestionData(answer.questionId, answer.caseStudyId);
    //         const caseStudy = window.questionsData.caseStudies.find(c => c.id === answer.caseStudyId);
            
    //         if(!question || !caseStudy) return '';
            
    //         return `
    //             <div class="card mb-3">
    //                 <div class="card-body">
    //                     <div class="d-flex justify-content-between align-items-start">
    //                         <div>
    //                             <h5 class="text-primary">${caseStudy.title}</h5>
    //                             <p class="text-muted">${caseStudy.scenario}</p>
    //                         </div>
    //                         <small class="text-muted">
    //                             ${new Date(answer.date).toLocaleDateString()}
    //                         </small>
    //                     </div>
                        
    //                     <div class="bg-light p-3 rounded mt-2">
    //                         <h6>Question: ${question.text}</h6>
                            
    //                         <div class="mt-3">
    //                             <p class="${answer.answer === null ? 'text-danger' : 'text-dark'}">
    //                                 <strong>Your Answer:</strong> 
    //                                 ${answer.answer !== null ? 
    //                                     question.options[answer.answer] : 
    //                                     'No answer provided'
    //                                 }
    //                             </p>
    //                             <p class="text-success">
    //                                 <strong>Correct Answer:</strong> 
    //                                 ${question.options[question.correct]}
    //                             </p>
    //                         </div>
                            
    //                         ${question.explanation ? `
    //                             <div class="alert alert-secondary mt-3">
    //                                 <strong>Rationale:</strong> ${question.explanation}
    //                             </div>
    //                         ` : ''}
    //                     </div>
    //                 </div>
    //             </div>
    //         `;
    //     }).join('');
    // };



    // Initial render
    renderOverallChart(results);
    renderTimeChart(results);
    renderProgressChart(results);
    renderFlaggedQuestions(results);
});

function renderCompetencyChart(results) {
    const ctx = document.createElement('canvas');
    document.getElementById('competencyChart').parentElement.appendChild(ctx);
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Assessment', 'Intervention', 'Medication', 'Monitoring', 'Education'],
            datasets: [{
                label: 'Competency Areas',
                data: calculateCompetencyAreas(results),
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4CAF50'
            }]
        }
    });
}

function renderTimePerQuestionType(results) {
    const ctx = document.createElement('canvas');
    document.getElementById('timeChart').parentElement.appendChild(ctx);
    
    new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: ['Knowledge', 'Application', 'Analysis'],
            datasets: [{
                label: 'Average Time (sec)',
                data: calculateQuestionTypeTimes(results),
                backgroundColor: '#2196F3'
            }]
        }
    });
}