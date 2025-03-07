document.addEventListener('DOMContentLoaded', async () => {
    


    try {
        // Load quiz results and questions data
        const urlParams = new URLSearchParams(window.location.search);
        const caseStudyId = parseInt(urlParams.get('caseStudy'));
        
        const resultsData = JSON.parse(localStorage.getItem('quizResults') || []);
        const results = resultsData.find(r => r.caseStudyId === caseStudyId);
        console.log('Loaded questionsData:', window.questionsData);
        console.log('Found results:', results);


        if(!results) throw new Error('No quiz results found');
        if(!window.questionsData) throw new Error('Questions data not loaded');
          // Get questions from embedded JS data
      //    const questionsData = window.questionsData;
       // const response = await fetch('data/questions.json');
       // questionsData = await response.json();

        if(!results || !questionsData) {
            throw new Error('Required data not found');
        }


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
                <span>Score:</span>
                <span>${results.score.toFixed(1)}%</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
                <span>Time Taken:</span>
                <span>${new Date(results.duration).toISOString().substr(11, 8)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
                <span>Questions:</span>
                <span>${results.answers.length}</span>
            </li>
        `;
    }

    function renderDetailedResults(results) {
        const container = document.getElementById('detailedResults');
        const caseStudy = window.questionsData.caseStudies.find(c => c.id === results.caseStudyId);
        
        container.innerHTML = `
            <div class="case-study-header bg-light p-4 rounded-3 mb-5 shadow">
                <h3 class="text-primary mb-3">${caseStudy.title}</h3>
                <div class="scenario-box p-3 bg-white rounded">
                    <p class="lead fw-semibold">Clinical Scenario:</p>
                    <p class="text-muted">${caseStudy.scenario}</p>
                </div>
            </div>
            ${results.answers.map(answer => {
                const questionData = getQuestionData(answer.questionId);
                const isCorrect = answer.answer === questionData.correct;
                
                return `
                    <div class="card mb-4 shadow">
                        <div class="card-header bg-light">
                            <h5 class="card-title mb-0">Question ${answer.questionId}</h5>
                        </div>
                        <div class="card-body">
                            <p class="fw-bold fs-5 mb-3">${questionData.text}</p>
                            
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="p-3 ${isCorrect ? 'bg-success-light' : 'bg-danger-light'} rounded">
                                        <p class="mb-1"><strong>Your Answer:</strong></p>
                                        <p class="fs-6">${getAnswerText(answer)}</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-info-light rounded">
                                        <p class="mb-1"><strong>Correct Answer:</strong></p>
                                        <p class="fs-6">${getCorrectAnswerText(answer.questionId)}</p>
                                    </div>
                                </div>
                            </div>
    
                            <div class="explanation-box mt-4 p-3 bg-light rounded">
                                <p class="fw-semibold mb-2">Evidence-Based Explanation:</p>
                                <p class="text-muted">${getExplanation(answer.questionId)}</p>
                                <small class="text-muted">Reference: ${questionData.reference}</small>
                            </div>
    
                            <div class="mt-3 text-end">
                                <span class="badge bg-secondary">
                                    Time Spent: ${new Date(answer.timeSpent).toISOString().substr(11, 8)}
                                </span>
                                ${answer.confidence ? `
                                <span class="badge bg-warning text-dark ms-2">
                                    Confidence: ${answer.confidence}/5
                                </span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    function renderCharts(results) {
        const container = document.getElementById('scoreChart');
        const ctx = document.createElement('canvas');
        container.appendChild(ctx);
    
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: [results.score, 100 - results.score],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 20
                        }
                    },
                    tooltip: { 
                        callbacks: { 
                            label: ctx => `${ctx.parsed}%` 
                        } 
                    }
                }
            }
        });
        
        // Add inline style to control size
        container.style.width = '300px';
        container.style.height = '300px';
        container.style.margin = '0 auto';
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
                // Initial render
                renderSummary(results);
                renderDetailedResults(results);
                renderCharts(results);
                setupExport();
    } catch (error) {
        alert(`Error: ${error.message}\n\nPlease complete a quiz first.`);
        window.location.href = 'index.html';
    }
});