/**
 * WikiMillionaire Game Logic - Vanilla JavaScript
 * No external libraries
 */

(function() {
    'use strict';

    let currentLevel = 1;
    let currentScore = 0;
    let currentQuestion = null;
    let fiftyFiftyUsed = false;

    const elements = {
        question: document.getElementById('question'),
        options: document.getElementById('options'),
        score: document.getElementById('score'),
        level: document.getElementById('level'),
        nextBtn: document.getElementById('next-btn'),
        fiftyFifty: document.getElementById('fifty-fifty')
    };

    // Initialize game
    function init() {
        loadQuestion();
        
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', nextQuestion);
        }
        
        if (elements.fiftyFifty) {
            elements.fiftyFifty.addEventListener('click', useFiftyFifty);
        }
    }

    // Load question from API
    async function loadQuestion() {
        try {
            elements.question.textContent = 'Cargando pregunta...';
            elements.options.innerHTML = '';

            const response = await fetch(`/api/question?level=${currentLevel}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            currentQuestion = data;
            displayQuestion(data);
        } catch (error) {
            console.error('Error loading question:', error);
            elements.question.textContent = 'Error al cargar la pregunta. Por favor, recarga la página.';
        }
    }

    // Display question and options
    function displayQuestion(data) {
        elements.question.textContent = data.question;
        elements.options.innerHTML = '';

        data.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => selectAnswer(option, button));
            elements.options.appendChild(button);
        });
    }

    // Handle answer selection
    async function selectAnswer(answer, button) {
        // Disable all buttons
        const buttons = elements.options.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        try {
            const response = await fetch('/api/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answer: answer,
                    questionId: currentQuestion.id
                })
            });

            const data = await response.json();

            if (data.correct) {
                button.classList.add('correct');
                currentScore += 1000 * currentLevel;
                updateScore();
                
                setTimeout(() => {
                    if (currentLevel < 15) {
                        elements.nextBtn.style.display = 'inline-block';
                    } else {
                        endGame(true);
                    }
                }, 1500);
            } else {
                button.classList.add('incorrect');
                
                // Show correct answer
                buttons.forEach(btn => {
                    if (btn.textContent === data.correctAnswer) {
                        btn.classList.add('correct');
                    }
                });

                setTimeout(() => {
                    endGame(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Error al enviar respuesta. Por favor, intenta de nuevo.');
            buttons.forEach(btn => btn.disabled = false);
        }
    }

    // Next question
    function nextQuestion() {
        currentLevel++;
        updateLevel();
        elements.nextBtn.style.display = 'none';
        loadQuestion();
    }

    // Use 50:50 lifeline
    function useFiftyFifty() {
        if (fiftyFiftyUsed) return;

        fiftyFiftyUsed = true;
        elements.fiftyFifty.disabled = true;

        const buttons = Array.from(elements.options.querySelectorAll('.option-btn'));
        const correctButton = buttons.find(btn => btn.textContent === currentQuestion.correctAnswer);
        
        // Get wrong answers
        const wrongButtons = buttons.filter(btn => btn !== correctButton);
        
        // Remove 2 wrong answers
        for (let i = 0; i < 2 && wrongButtons.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * wrongButtons.length);
            wrongButtons[randomIndex].style.display = 'none';
            wrongButtons.splice(randomIndex, 1);
        }
    }

    // Update score display
    function updateScore() {
        if (elements.score) {
            elements.score.textContent = currentScore.toLocaleString();
        }
    }

    // Update level display
    function updateLevel() {
        if (elements.level) {
            elements.level.textContent = currentLevel;
        }
    }

    // End game
    async function endGame(won) {
        const message = won 
            ? `¡Felicitaciones! Completaste todas las preguntas. Puntuación final: ${currentScore.toLocaleString()}`
            : `Juego terminado. Puntuación final: ${currentScore.toLocaleString()}`;

        // Save score if logged in
        try {
            await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    score: currentScore,
                    level: currentLevel - 1
                })
            });
        } catch (error) {
            console.error('Error saving score:', error);
        }

        setTimeout(() => {
            alert(message);
            window.location.href = '/leaderboard';
        }, 500);
    }

    // Start game when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
