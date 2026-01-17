/**
 * CTET गणित मॉक टेस्ट - Main Application (Hindi)
 * Handles test logic, timer, navigation, mobile palette modal, candidate name, and localStorage persistence
 */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    testDuration: 30 * 60, // 30 minutes in seconds
    warningTime: 5 * 60,   // 5 minutes warning
    dangerTime: 1 * 60,    // 1 minute danger
    localStorageKey: 'ctet_mock_test_hindi_state'
};

// ========================================
// STATE MANAGEMENT
// ========================================

let testState = {
    isTestActive: false,
    currentQuestion: 0,
    answers: {},
    timeRemaining: CONFIG.testDuration,
    startTime: null,
    questionTimes: {},
    isSubmitted: false,
    candidateName: ''
};

// Store results for filtering
let resultsData = {
    correct: 0,
    wrong: 0,
    unattempted: 0,
    questionResults: []
};

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
    // Pages
    landingPage: document.getElementById('landing-page'),
    testPage: document.getElementById('test-page'),
    resultsPage: document.getElementById('results-page'),

    // Landing
    candidateNameInput: document.getElementById('candidate-name'),
    agreementCheckbox: document.getElementById('agreement-checkbox'),
    startTestBtn: document.getElementById('start-test-btn'),

    // Test Header
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    timer: document.getElementById('timer'),
    submitTestBtn: document.getElementById('submit-test-btn'),

    // Question Section
    questionNumber: document.getElementById('question-number'),
    questionTopic: document.getElementById('question-topic'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    clearResponseBtn: document.getElementById('clear-response-btn'),

    // Navigation
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),

    // Desktop Palette
    paletteSidebar: document.querySelector('.palette-sidebar'),
    questionPaletteDesktop: document.getElementById('question-palette-desktop'),
    answeredCountDesktop: document.getElementById('answered-count-desktop'),
    notAnsweredCountDesktop: document.getElementById('not-answered-count-desktop'),

    // Mobile Palette Modal
    paletteModal: document.getElementById('palette-modal'),
    closePaletteBtn: document.getElementById('close-palette-btn'),
    questionPaletteMobile: document.getElementById('question-palette-mobile'),
    answeredCountMobile: document.getElementById('answered-count-mobile'),
    notAnsweredCountMobile: document.getElementById('not-answered-count-mobile'),

    // Submit Modal
    submitModal: document.getElementById('submit-modal'),
    submitMessage: document.getElementById('submit-message'),
    cancelSubmitBtn: document.getElementById('cancel-submit-btn'),
    confirmSubmitBtn: document.getElementById('confirm-submit-btn'),

    // Time Up Modal
    timeupModal: document.getElementById('timeup-modal'),

    // Results
    resultMessage: document.getElementById('result-message'),
    scoreValue: document.getElementById('score-value'),
    scoreProgress: document.getElementById('score-progress'),
    percentageValue: document.getElementById('percentage-value'),
    correctCount: document.getElementById('correct-count'),
    wrongCount: document.getElementById('wrong-count'),
    unattemptedCount: document.getElementById('unattempted-count'),
    totalTime: document.getElementById('total-time'),
    avgTime: document.getElementById('avg-time'),
    reviewAnswersBtn: document.getElementById('review-answers-btn'),
    retakeTestBtn: document.getElementById('retake-test-btn'),

    // Analysis Section (Card-based)
    analysisSection: document.getElementById('analysis-section'),
    closeAnalysisBtn: document.getElementById('close-analysis-btn'),
    analysisCards: document.getElementById('analysis-cards'),
    filterCorrectCount: document.getElementById('filter-correct-count'),
    filterWrongCount: document.getElementById('filter-wrong-count'),
    filterUnattemptedCount: document.getElementById('filter-unattempted-count')
};

// ========================================
// TIMER FUNCTIONS
// ========================================

let timerInterval = null;

function startTimer() {
    timerInterval = setInterval(() => {
        testState.timeRemaining--;
        updateTimerDisplay();
        saveState();

        if (testState.timeRemaining <= 0) {
            clearInterval(timerInterval);
            showTimeUpModal();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(testState.timeRemaining / 60);
    const seconds = testState.timeRemaining % 60;
    elements.timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Update timer styling based on time remaining
    elements.timer.classList.remove('warning', 'danger');
    if (testState.timeRemaining <= CONFIG.dangerTime) {
        elements.timer.classList.add('danger');
    } else if (testState.timeRemaining <= CONFIG.warningTime) {
        elements.timer.classList.add('warning');
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
        return `${mins} मिनट ${secs} सेकंड`;
    }
    return `${secs} सेकंड`;
}

function formatTimeShort(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ========================================
// QUESTION DISPLAY FUNCTIONS
// ========================================

function displayQuestion(index) {
    const question = questions[index];
    const questionNumber = index + 1;

    // Track question view time
    trackQuestionView(question.id);

    // Update question header
    elements.questionNumber.textContent = `प्रश्न ${questionNumber} / ${questions.length}`;
    elements.questionTopic.textContent = question.topic;

    // Update question text
    elements.questionText.textContent = question.question;

    // Generate options
    const optionLetters = ['A', 'B', 'C', 'D'];
    elements.optionsContainer.innerHTML = question.options.map((option, i) => {
        const isSelected = testState.answers[question.id] === i;
        return `
            <label class="option ${isSelected ? 'selected' : ''}" data-index="${i}">
                <input type="radio" name="answer" value="${i}" ${isSelected ? 'checked' : ''}>
                <span class="option-label">
                    <span class="option-letter">${optionLetters[i]}</span>
                    <span class="option-text">${option}</span>
                </span>
            </label>
        `;
    }).join('');

    // Add click handlers to options
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => selectOption(parseInt(option.dataset.index)));
    });

    // Update navigation buttons
    elements.prevBtn.disabled = index === 0;
    elements.nextBtn.disabled = index === questions.length - 1;

    // Update palettes
    updatePalette();

    // Update progress
    updateProgress();
}

function selectOption(optionIndex) {
    const question = questions[testState.currentQuestion];
    testState.answers[question.id] = optionIndex;

    // Track answer time
    trackQuestionAnswer(question.id);

    // Update UI
    document.querySelectorAll('.option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === optionIndex);
        opt.querySelector('input').checked = i === optionIndex;
    });

    updatePalette();
    updateProgress();
    saveState();
}

function clearResponse() {
    const question = questions[testState.currentQuestion];
    delete testState.answers[question.id];

    // Update UI
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
        opt.querySelector('input').checked = false;
    });

    updatePalette();
    updateProgress();
    saveState();
}

// ========================================
// NAVIGATION FUNCTIONS
// ========================================

function goToQuestion(index) {
    if (index >= 0 && index < questions.length) {
        testState.currentQuestion = index;
        displayQuestion(index);
        saveState();

        // Close mobile palette if open
        closePaletteModal();
    }
}

function nextQuestion() {
    goToQuestion(testState.currentQuestion + 1);
}

function prevQuestion() {
    goToQuestion(testState.currentQuestion - 1);
}

// ========================================
// PALETTE FUNCTIONS
// ========================================

function createPalettes() {
    const paletteHTML = questions.map((q, i) => {
        return `<button class="palette-btn" data-index="${i}">${i + 1}</button>`;
    }).join('');

    elements.questionPaletteDesktop.innerHTML = paletteHTML;
    elements.questionPaletteMobile.innerHTML = paletteHTML;

    // Add click handlers to desktop palette
    elements.questionPaletteDesktop.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', () => goToQuestion(parseInt(btn.dataset.index)));
    });

    // Add click handlers to mobile palette
    elements.questionPaletteMobile.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', () => goToQuestion(parseInt(btn.dataset.index)));
    });
}

function updatePalette() {
    const answered = Object.keys(testState.answers).length;
    const notAnswered = questions.length - answered;

    // Update counts
    elements.answeredCountDesktop.textContent = answered;
    elements.notAnsweredCountDesktop.textContent = notAnswered;
    elements.answeredCountMobile.textContent = answered;
    elements.notAnsweredCountMobile.textContent = notAnswered;

    // Update button states in both palettes
    [elements.questionPaletteDesktop, elements.questionPaletteMobile].forEach(palette => {
        palette.querySelectorAll('.palette-btn').forEach((btn, i) => {
            const question = questions[i];
            const isAnswered = testState.answers.hasOwnProperty(question.id);
            const isCurrent = i === testState.currentQuestion;

            btn.classList.remove('answered', 'current');
            if (isCurrent) btn.classList.add('current');
            if (isAnswered) btn.classList.add('answered');
        });
    });
}

// ========================================
// MOBILE PALETTE MODAL FUNCTIONS
// ========================================

function openPaletteModal() {
    elements.paletteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePaletteModal() {
    elements.paletteModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// PROGRESS FUNCTIONS
// ========================================

function updateProgress() {
    const answered = Object.keys(testState.answers).length;
    const total = questions.length;
    const percentage = (answered / total) * 100;

    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = `${answered}/${total} उत्तर दिए`;
}

// ========================================
// TIME TRACKING FUNCTIONS
// ========================================

function trackQuestionView(questionId) {
    if (!testState.questionTimes[questionId]) {
        testState.questionTimes[questionId] = {
            viewTime: Date.now(),
            answerTime: null,
            totalTime: 0
        };
    } else {
        testState.questionTimes[questionId].viewTime = Date.now();
    }
}

function trackQuestionAnswer(questionId) {
    if (testState.questionTimes[questionId]) {
        testState.questionTimes[questionId].answerTime = Date.now();
    }
}

function calculateQuestionTime(questionId) {
    const times = testState.questionTimes[questionId];
    if (times && times.viewTime) {
        const endTime = times.answerTime || Date.now();
        return (endTime - times.viewTime) / 1000;
    }
    return 0;
}

// ========================================
// MODAL FUNCTIONS
// ========================================

function showSubmitModal() {
    const answered = Object.keys(testState.answers).length;
    const total = questions.length;

    elements.submitMessage.textContent = `आपने ${total} में से ${answered} प्रश्नों के उत्तर दिए हैं।`;
    elements.submitModal.classList.add('active');
}

function hideSubmitModal() {
    elements.submitModal.classList.remove('active');
}

function showTimeUpModal() {
    elements.timeupModal.classList.add('active');
    setTimeout(() => {
        elements.timeupModal.classList.remove('active');
        submitTest(true);
    }, 2500);
}

// ========================================
// CANDIDATE NAME VALIDATION
// ========================================

function validateStartConditions() {
    const nameEntered = elements.candidateNameInput.value.trim().length > 0;
    const checkboxChecked = elements.agreementCheckbox.checked;
    elements.startTestBtn.disabled = !(nameEntered && checkboxChecked);
}

// ========================================
// TEST FLOW FUNCTIONS
// ========================================

function startTest() {
    // Get candidate name
    const candidateName = elements.candidateNameInput.value.trim();
    if (!candidateName) {
        alert('कृपया अपना नाम दर्ज करें!');
        return;
    }

    testState = {
        isTestActive: true,
        currentQuestion: 0,
        answers: {},
        timeRemaining: CONFIG.testDuration,
        startTime: Date.now(),
        questionTimes: {},
        isSubmitted: false,
        candidateName: candidateName
    };

    // Update UI
    elements.landingPage.classList.remove('active');
    elements.testPage.classList.add('active');

    // Initialize
    createPalettes();
    displayQuestion(0);
    updateTimerDisplay();
    startTimer();
    saveState();

    // Setup beforeunload warning
    window.addEventListener('beforeunload', handleBeforeUnload);
}

function resumeTest() {
    // Resume from saved state
    elements.landingPage.classList.remove('active');
    elements.testPage.classList.add('active');

    createPalettes();
    displayQuestion(testState.currentQuestion);
    updateTimerDisplay();
    startTimer();

    // Setup beforeunload warning
    window.addEventListener('beforeunload', handleBeforeUnload);
}

function submitTest(autoSubmit = false) {
    stopTimer();
    testState.isSubmitted = true;
    testState.isTestActive = false;

    // Remove beforeunload warning
    window.removeEventListener('beforeunload', handleBeforeUnload);

    // Hide modal and test page
    hideSubmitModal();
    elements.testPage.classList.remove('active');
    elements.resultsPage.classList.add('active');

    // Calculate and display results
    calculateResults(autoSubmit);

    // Clear saved state
    clearState();
}

function retakeTest() {
    // Reset UI
    elements.resultsPage.classList.remove('active');
    elements.analysisSection.classList.add('hidden');
    elements.agreementCheckbox.checked = false;
    elements.candidateNameInput.value = '';
    elements.startTestBtn.disabled = true;

    // Show landing page
    elements.landingPage.classList.add('active');
}

// ========================================
// RESULTS FUNCTIONS
// ========================================

function calculateResults(autoSubmit) {
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    // Build question results array
    resultsData.questionResults = [];

    questions.forEach((q, index) => {
        const userAnswer = testState.answers[q.id];
        const hasAnswered = userAnswer !== undefined;
        const isCorrect = hasAnswered && userAnswer === q.correctAnswer;
        const timeSpent = calculateQuestionTime(q.id);

        let status = 'unattempted';
        if (hasAnswered) {
            if (isCorrect) {
                correct++;
                status = 'correct';
            } else {
                wrong++;
                status = 'wrong';
            }
        } else {
            unattempted++;
        }

        resultsData.questionResults.push({
            index: index,
            question: q,
            userAnswer: userAnswer,
            hasAnswered: hasAnswered,
            isCorrect: isCorrect,
            status: status,
            timeSpent: timeSpent
        });
    });

    resultsData.correct = correct;
    resultsData.wrong = wrong;
    resultsData.unattempted = unattempted;

    const score = correct;
    const percentage = Math.round((score / questions.length) * 100);
    const timeTaken = CONFIG.testDuration - testState.timeRemaining;
    const avgTimePerQuestion = timeTaken / questions.length;

    // Update result message with candidate name
    const candidateName = testState.candidateName || 'छात्र';
    elements.resultMessage.textContent = autoSubmit
        ? `${candidateName}, समय समाप्त हो गया! ${getPersonalizedMessage(percentage, candidateName)}`
        : getPersonalizedMessage(percentage, candidateName);

    // Update score display with animation
    animateScore(score, percentage);

    // Update breakdown
    elements.correctCount.textContent = correct;
    elements.wrongCount.textContent = wrong;
    elements.unattemptedCount.textContent = unattempted;

    // Update time stats
    elements.totalTime.textContent = formatTimeShort(timeTaken);
    elements.avgTime.textContent = formatTimeShort(avgTimePerQuestion);
}

function animateScore(score, percentage) {
    // Animate score value
    let currentScore = 0;
    const scoreInterval = setInterval(() => {
        if (currentScore >= score) {
            clearInterval(scoreInterval);
            return;
        }
        currentScore++;
        elements.scoreValue.textContent = currentScore;
    }, 50);

    // Animate percentage
    let currentPercentage = 0;
    const percentageInterval = setInterval(() => {
        if (currentPercentage >= percentage) {
            clearInterval(percentageInterval);
            return;
        }
        currentPercentage++;
        elements.percentageValue.textContent = currentPercentage;
    }, 30);

    // Animate circle progress
    setTimeout(() => {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percentage / 100) * circumference;
        elements.scoreProgress.style.strokeDashoffset = offset;

        // Change color based on score
        if (percentage >= 70) {
            elements.scoreProgress.style.stroke = '#10B981';
        } else if (percentage >= 40) {
            elements.scoreProgress.style.stroke = '#F59E0B';
        } else {
            elements.scoreProgress.style.stroke = '#EF4444';
        }
    }, 100);
}

function getPersonalizedMessage(percentage, name) {
    if (percentage >= 90) return `🌟 ${name}, उत्कृष्ट प्रदर्शन! आपकी तैयारी बहुत ज़बरदस्त है!`;
    if (percentage >= 70) return `👏 ${name}, बहुत अच्छा! आपकी समझ मजबूत है। बस थोड़ा और अभ्यास करें!`;
    if (percentage >= 50) return `📚 ${name}, अच्छा प्रयास! कुछ और मेहनत से आप 70%+ ला सकते हैं!`;
    if (percentage >= 30) return `💪 ${name}, आप बेहतर कर सकते हैं! कमजोर विषयों पर ध्यान दें।`;
    return `📖 ${name}, हार मत मानो! मूल अवधारणाओं को फिर से पढ़ें और अभ्यास करें।`;
}

// ========================================
// ANALYSIS CARDS SECTION
// ========================================

function showAnalysisSection() {
    // Update filter counts
    elements.filterCorrectCount.textContent = resultsData.correct;
    elements.filterWrongCount.textContent = resultsData.wrong;
    elements.filterUnattemptedCount.textContent = resultsData.unattempted;

    // Generate cards
    generateAnalysisCards();

    // Show section
    elements.analysisSection.classList.remove('hidden');

    // Scroll to section
    elements.analysisSection.scrollIntoView({ behavior: 'smooth' });
}

function hideAnalysisSection() {
    elements.analysisSection.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateAnalysisCards() {
    const optionLetters = ['A', 'B', 'C', 'D'];

    elements.analysisCards.innerHTML = resultsData.questionResults.map((result, index) => {
        const q = result.question;
        const userAnswer = result.userAnswer;
        const hasAnswered = result.hasAnswered;
        const isCorrect = result.isCorrect;
        const status = result.status;
        const timeSpent = result.timeSpent;

        // Status text and class
        let statusText = 'अनुत्तरित';
        let statusClass = 'unattempted';
        if (hasAnswered) {
            statusText = isCorrect ? '✓ सही' : '✗ गलत';
            statusClass = isCorrect ? 'correct' : 'wrong';
        }

        // Build options HTML
        const optionsHTML = q.options.map((opt, i) => {
            let optionClass = '';
            let badges = [];

            // Mark correct answer
            if (i === q.correctAnswer) {
                optionClass = 'correct-answer';
                if (hasAnswered && isCorrect && i === userAnswer) {
                    badges.push('<span class="option-badge correct-badge">✓ सही उत्तर</span>');
                    badges.push('<span class="option-badge your-answer-badge">✓ आपका उत्तर</span>');
                } else {
                    badges.push('<span class="option-badge correct-badge">✓ सही उत्तर</span>');
                }
            }

            // Mark user's wrong answer
            if (hasAnswered && i === userAnswer && !isCorrect) {
                optionClass = 'user-wrong';
                badges.push('<span class="option-badge wrong-badge">✗ आपका उत्तर</span>');
            }

            return `
                <div class="card-option ${optionClass}">
                    <span class="card-option-letter">${optionLetters[i]}</span>
                    <span class="card-option-text">${opt}</span>
                    <div class="option-badges">${badges.join('')}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="analysis-card" data-status="${status}">
                <div class="card-header">
                    <div class="card-question-info">
                        <span class="card-question-num">प्रश्न ${index + 1}</span>
                        <span class="card-topic">${q.topic}</span>
                        <span class="card-time">⏱️ ${timeSpent > 0 ? formatTime(timeSpent) : '-'}</span>
                    </div>
                    <span class="card-status ${statusClass}">${statusText}</span>
                </div>
                <p class="card-question-text">${q.question}</p>
                <div class="card-options">
                    ${optionsHTML}
                </div>
                <div class="card-explanation">
                    <div class="card-explanation-title">💡 व्याख्या</div>
                    <p class="card-explanation-text">${q.explanation}</p>
                </div>
            </div>
        `;
    }).join('');

    // Setup filter buttons
    setupFilterButtons();
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Get filter type
            const filter = btn.dataset.filter;

            // Filter cards
            filterCards(filter);
        });
    });
}

function filterCards(filter) {
    const cards = document.querySelectorAll('.analysis-card');

    cards.forEach(card => {
        const status = card.dataset.status;

        if (filter === 'all') {
            card.classList.remove('hidden');
        } else if (filter === status) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// ========================================
// LOCALSTORAGE FUNCTIONS
// ========================================

function saveState() {
    localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(testState));
}

function loadState() {
    const saved = localStorage.getItem(CONFIG.localStorageKey);
    if (saved) {
        try {
            testState = JSON.parse(saved);
            return true;
        } catch (e) {
            console.error('Failed to parse saved state:', e);
            return false;
        }
    }
    return false;
}

function clearState() {
    localStorage.removeItem(CONFIG.localStorageKey);
}

function handleBeforeUnload(e) {
    if (testState.isTestActive && !testState.isSubmitted) {
        e.preventDefault();
        e.returnValue = 'परीक्षा चल रही है। क्या आप वाकई बाहर जाना चाहते हैं?';
        return e.returnValue;
    }
}

// ========================================
// INITIALIZATION
// ========================================

function init() {
    // Check for saved state
    if (loadState() && testState.isTestActive && !testState.isSubmitted) {
        // Resume test
        resumeTest();
    }

    // Event Listeners - Landing (Name input and checkbox)
    elements.candidateNameInput.addEventListener('input', validateStartConditions);
    elements.agreementCheckbox.addEventListener('change', validateStartConditions);
    elements.startTestBtn.addEventListener('click', startTest);

    // Event Listeners - Test
    elements.mobileMenuBtn.addEventListener('click', openPaletteModal);
    elements.closePaletteBtn.addEventListener('click', closePaletteModal);
    elements.paletteModal.querySelector('.modal-overlay').addEventListener('click', closePaletteModal);

    elements.prevBtn.addEventListener('click', prevQuestion);
    elements.nextBtn.addEventListener('click', nextQuestion);
    elements.clearResponseBtn.addEventListener('click', clearResponse);
    elements.submitTestBtn.addEventListener('click', showSubmitModal);

    // Event Listeners - Modal
    elements.cancelSubmitBtn.addEventListener('click', hideSubmitModal);
    elements.confirmSubmitBtn.addEventListener('click', () => submitTest(false));

    // Event Listeners - Results (Changed to analysis cards)
    elements.reviewAnswersBtn.addEventListener('click', showAnalysisSection);
    elements.closeAnalysisBtn.addEventListener('click', hideAnalysisSection);
    elements.retakeTestBtn.addEventListener('click', retakeTest);

    // Close submit modal on outside click
    elements.submitModal.addEventListener('click', (e) => {
        if (e.target === elements.submitModal) {
            hideSubmitModal();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!testState.isTestActive || testState.isSubmitted) return;

        // Don't interfere if modal is open
        if (elements.paletteModal.classList.contains('active')) return;
        if (elements.submitModal.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowRight':
                if (!elements.nextBtn.disabled) nextQuestion();
                break;
            case 'ArrowLeft':
                if (!elements.prevBtn.disabled) prevQuestion();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                selectOption(parseInt(e.key) - 1);
                break;
        }
    });

    // Touch swipe for mobile navigation
    let touchStartX = 0;
    let touchEndX = 0;

    document.querySelector('.question-section')?.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.querySelector('.question-section')?.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && !elements.nextBtn.disabled) {
                nextQuestion();
            } else if (diff < 0 && !elements.prevBtn.disabled) {
                prevQuestion();
            }
        }
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
