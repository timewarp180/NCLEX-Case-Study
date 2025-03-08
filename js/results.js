document.addEventListener('DOMContentLoaded', async () => {
      try {
        const allResults = JSON.parse(localStorage.getItem('quizResults')) || [];
        const lastResult = allResults[allResults.length - 1];
        
        if(!lastResult) throw new Error('No quiz results found');
        
        renderSummary(lastResult);
        renderDetailedResults(lastResult);
        renderCharts(lastResult);
        setupExport(lastResult);


                // Initial render
                // renderSummary(results);
                // renderDetailedResults(results);
                // renderCharts(results);
                // setupExport();

    } catch (error) {
        // alert(`Error: ${error.message}\n\nPlease complete a quiz first.`);
        // window.location.href = 'index.html';

        document.querySelector('main').innerHTML = `
        <div class="alert alert-danger">
            Error loading results: ${error.message}
            <button class="btn btn-link" onclick="window.location.href='index.html'">Return Home</button>
        </div>
    `;
    }
});


        // Helper functions
        const getQuestionData = (questionId) => {
            const caseStudy = window.questionsData.caseStudies.find(c => c.id === caseStudyId);
            return caseStudy?.questions.find(q => q.id === questionId);
        };

    const getAnswerText = (answer) => {
        const question = getQuestionData(answer.questionId);
        return question.options[answer.answer];
    };

    const getCorrectAnswer = (questionId) => {
        return getQuestionData(questionId).correct;
    };

    const getCorrectAnswerText = (questionId) => {
        const question = getQuestionData(questionId);
        return question.options[question.correct];
    };

    const getExplanation = (questionId) => {
        return getQuestionData(questionId).explanation;
    };

    // Core functionality
    function renderSummary(results) {
        const summaryList = document.getElementById('summaryList');
        summaryList.innerHTML = `
            <li class="list-group-item d-flex justify-content-between">
                <span>Total Score:</span>
                <span>${results.totalScore.toFixed(1)}%</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
                <span>Time Taken:</span>
                <span>${new Date(results.duration).toISOString().substr(11, 8)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
                <span>Total Questions:</span>
                <span>${results.answers.length}</span>
            </li>
        `;
    }

    function renderDetailedResults(results) {
        const container = document.getElementById('detailedResults');
        
        container.innerHTML = window.questionsData.caseStudies.map(cs => {
            const caseStudyResults = results.answers.filter(a => a.caseStudyId === cs.id);
            const score = results.scores.find(s => s.caseStudyId === cs.id)?.score || 0;
            
            return `
                <div class="card mb-5 shadow">
                    <div class="card-header bg-primary text-white">
                        <h3>${cs.title}</h3>
                        <div class="d-flex justify-content-between">
                            <span>Score: ${score.toFixed(1)}%</span>
                            <span>Completed: ${caseStudyResults.length}/${cs.questions.length}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        ${caseStudyResults.map(answer => {
                            const question = cs.questions.find(q => q.id === answer.questionId);
                            const isCorrect = answer.answer === question.correct;
                            
                            return `
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <h5 class="card-title">Question ${question.id}</h5>
                                        <p class="fw-bold">${question.text}</p>
                                        
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <div class="p-3 ${isCorrect ? 'bg-success-light' : 'bg-danger-light'} rounded">
                                                    <p class="mb-1"><strong>Your Answer:</strong></p>
                                                    <p>${question.options[answer.answer]}</p>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="p-3 bg-info-light rounded">
                                                    <p class="mb-1"><strong>Correct Answer:</strong></p>
                                                    <p>${question.options[question.correct]}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="mt-3">
                                            <p class="fw-bold">Explanation:</p>
                                            <p class="text-muted">${question.explanation}</p>
                                            <small class="text-muted">Reference: ${question.reference}</small>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }


    function renderCharts(results) {
        // Score Chart
        const scoreCanvas = document.createElement('canvas');
        document.getElementById('scoreChart').appendChild(scoreCanvas);
        
        new Chart(scoreCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: [results.totalScore, 100 - results.totalScore],
                    backgroundColor: ['#4CAF50', '#F44336']
                }]
            }
        });
    
        // Progress Chart
        const progressCanvas = document.createElement('canvas');
        document.getElementById('progressChart').appendChild(progressCanvas);
        
        new Chart(progressCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: results.scores.map((_, i) => `Case ${i + 1}`),
                datasets: [{
                    label: 'Score Progress',
                    data: results.scores.map(s => s.score),
                    borderColor: '#2196F3'
                }]
            }
        });
                        // Add inline style to control size
                        // container.style.width = '300px';
                        // container.style.height = '300px';
                        // container.style.margin = '0 auto';  
    }

    function setupExport() {
        const exportContainer = document.createElement('div');
        exportContainer.className = 'btn-group mt-3';
        exportContainer.innerHTML = `
            <button class="btn btn-outline-primary btn-sm" id="exportJson">JSON</button>
            <button class="btn btn-outline-primary btn-sm" id="exportCsv">CSV</button>
            <button class="btn btn-outline-primary btn-sm" id="exportPdf">PDF</button>
            <button class="btn btn-outline-primary btn-sm" onclick="window.print()">Print</button>
        `;
        document.querySelector('.card-body').appendChild(exportContainer);

        document.getElementById('exportJson').addEventListener('click', exportJSON);
        document.getElementById('exportCsv').addEventListener('click', exportCSV);
        document.getElementById('exportPdf').addEventListener('click', exportPDF);

        function exportJSON() {
            const data = JSON.stringify(results, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz-results-${new Date().toISOString()}.json`;
            a.click();
        }

        function exportPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text(`NCLEX Quiz Results - ${new Date(results.date).toLocaleDateString()}`, 10, 10);
            
            let y = 20;
            doc.setFontSize(12);
            doc.text(`Score: ${results.score.toFixed(1)}%`, 10, y);
            y += 7;
            doc.text(`Time Taken: ${new Date(results.duration).toISOString().substr(11, 8)}`, 10, y);
            y += 10;
            
            doc.setFontSize(14);
            doc.text('Detailed Results:', 10, y);
            y += 10;
            
            results.answers.forEach((answer, idx) => {
                if(y > 280) {
                    doc.addPage();
                    y = 10;
                }
                
                const questionData = getQuestionData(answer.questionId);
                doc.setFontSize(12);
                doc.text(`Question ${idx + 1}: ${questionData.text}`, 10, y);
                y += 7;
                doc.text(`Your Answer: ${getAnswerText(answer)}`, 15, y);
                y += 7;
                doc.text(`Correct Answer: ${getCorrectAnswerText(answer.questionId)}`, 15, y);
                y += 7;
                doc.text(`Explanation: ${getExplanation(answer.questionId)}`, 15, y);
                y += 15;
            });

            doc.save('quiz-results.pdf');
        }

        function exportCSV() {
            const csvContent = [
                ['Question ID', 'Question Text', 'Your Answer', 'Correct Answer', 'Time Spent', 'Confidence', 'Explanation'],
                ...results.answers.map(a => {
                    const q = getQuestionData(a.questionId);
                    return [
                        a.questionId,
                        `"${q.text.replace(/"/g, '""')}"`,
                        `"${getAnswerText(a).replace(/"/g, '""')}"`,
                        `"${getCorrectAnswerText(a.questionId).replace(/"/g, '""')}"`,
                        new Date(a.timeSpent).toISOString().substr(11, 8),
                        a.confidence || 'N/A',
                        `"${getExplanation(a.questionId).replace(/"/g, '""')}"`
                    ];
                })
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'quiz-results.csv';
            a.click();
        }
    }