<!-- Game Template with PHP Backend Integration -->
<div class="flex min-h-screen flex-col bg-gradient-to-b from-purple-900 to-indigo-950 p-4 overflow-hidden">
   <div class="container mx-auto max-w-4xl flex flex-col h-full">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div class="flex items-center justify-between sm:w-auto">
            <a class="text-gray-300 hover:text-white" href="/">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left h-6 w-6">
                  <path d="m12 19-7-7 7-7"></path>
                  <path d="M19 12H5"></path>
               </svg>
            </a>
            <div class="mx-4 text-center sm:mx-0">
               <h1 class="text-xl font-bold text-white sm:text-2xl">
                  <span class="text-yellow-400">Wiki</span>Millionaire
               </h1>
            </div>
         </div>
         
         <!-- Lifelines -->
         <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button id="fiftyFiftyBtn" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:text-accent-foreground h-10 w-10 rounded-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" title="50:50 Lifeline">
               <span class="font-bold">50</span>
            </button>
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors border bg-background h-10 w-10 rounded-full opacity-50 cursor-not-allowed border-gray-500 text-gray-400" disabled="" title="Phone a Friend (Not Available)">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
               </svg>
            </button>
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors border bg-background h-10 w-10 rounded-full opacity-50 cursor-not-allowed border-gray-500 text-gray-400" disabled="" title="Ask the Audience (Not Available)">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
               </svg>
            </button>
         </div>
      </div>

      <!-- Game Status -->
      <div class="mb-4 flex items-center justify-between">
         <div class="text-lg font-semibold text-white">
            <span id="levelDisplay">Level: 1 / 15</span>
         </div>
         <div class="text-lg font-semibold text-yellow-400">
            <span id="prizeDisplay">Prize: 100 points</span>
         </div>
      </div>

      <!-- Timer -->
      <div class="mb-4">
         <div class="flex justify-between text-sm text-gray-300">
            <span id="timerDisplay">Time remaining: 30s</span>
         </div>
         <div class="relative w-full overflow-hidden rounded-full bg-secondary h-2">
            <div id="timerBar" class="h-full w-full flex-1 bg-primary transition-all" style="transform: translateX(0%)"></div>
         </div>
      </div>

      <!-- Question Card -->
      <div class="space-y-4 flex-shrink-0">
         <div class="rounded-lg border shadow-sm border-purple-700 bg-purple-900/70 text-white">
            <div class="flex flex-col space-y-1.5 p-6">
               <div id="questionText" class="font-semibold tracking-tight text-xl">
                  Loading question...
               </div>
               <div id="questionImage" class="mt-4 hidden">
                  <img src="" alt="Question image" class="max-w-full rounded-lg object-contain" style="max-height: 200px;" />
               </div>
            </div>
         </div>

         <!-- Answer Options -->
         <div id="answerOptions" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <!-- Options will be inserted here by JavaScript -->
         </div>
      </div>

      <!-- Prize Levels -->
      <div class="mt-4 mb-4 flex-shrink-0">
         <h3 class="mb-2 text-sm font-semibold text-white">Prize Levels</h3>
         <div id="prizeLevels" class="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-5 text-xs">
            <!-- Prize levels will be rendered here -->
         </div>
      </div>

      <!-- Game Over Modal (hidden by default) -->
      <div id="gameOverModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
         <div class="bg-purple-900 rounded-lg p-8 max-w-md w-full mx-4 border border-purple-700">
            <h2 id="gameOverTitle" class="text-2xl font-bold text-white mb-4">Game Over!</h2>
            <p id="gameOverMessage" class="text-gray-300 mb-2"></p>
            <p id="gameOverScore" class="text-yellow-400 text-xl font-bold mb-6"></p>
            <div class="flex gap-4">
               <a href="/game.php" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded text-center">
                  Play Again
               </a>
               <a href="/" class="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded text-center">
                  Home
               </a>
            </div>
         </div>
      </div>
   </div>

   <!-- Footer -->
   <footer class="mt-auto border-t border-purple-700 bg-purple-900/50 py-4">
      <div class="container mx-auto">
         <p class="text-center text-sm text-gray-300">
            © 2025 WikiMillionaire. Game created by Daniel Yepez Garces
         </p>
      </div>
   </footer>
</div>

<!-- Game JavaScript -->
<script>
// Game state
let gameState = {
   level: 1,
   score: 0,
   timeRemaining: 30,
   timerInterval: null,
   currentQuestion: null
};

const PRIZE_LEVELS = [
   1000000, 500000, 250000, 125000, 64000,
   32000, 16000, 8000, 4000, 2000,
   1000, 500, 300, 200, 100
];

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
   initGame();
});

// Initialize game
async function initGame() {
   try {
      // Start new game
      const response = await fetch('/api.php?action=start', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: 'playerName=Player'
      });
      
      const result = await response.json();
      
      if (result.success) {
         gameState = result.data;
         renderPrizeLevels();
         loadNextQuestion();
      } else {
         showError('Failed to start game');
      }
   } catch (error) {
      console.error('Error initializing game:', error);
      showError('Failed to connect to game server');
   }
}

// Load next question
async function loadNextQuestion() {
   try {
      const response = await fetch('/api.php?action=getQuestion');
      const result = await response.json();
      
      if (result.success) {
         gameState.currentQuestion = result.data;
         displayQuestion(result.data);
         startTimer();
      } else {
         showError('Failed to load question');
      }
   } catch (error) {
      console.error('Error loading question:', error);
      showError('Failed to load question');
   }
}

// Display question
function displayQuestion(questionData) {
   document.getElementById('questionText').textContent = questionData.question;
   document.getElementById('levelDisplay').textContent = `Level: ${questionData.level} / 15`;
   document.getElementById('prizeDisplay').textContent = `Prize: ${formatNumber(questionData.prize)} points`;
   
   // Handle image if present
   const imageContainer = document.getElementById('questionImage');
   if (questionData.image) {
      imageContainer.querySelector('img').src = questionData.image;
      imageContainer.classList.remove('hidden');
   } else {
      imageContainer.classList.add('hidden');
   }
   
   // Render answer options
   renderAnswerOptions(questionData.options);
}

// Render answer options
function renderAnswerOptions(options) {
   const container = document.getElementById('answerOptions');
   container.innerHTML = '';
   
   const letters = ['A', 'B', 'C', 'D'];
   
   options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:text-accent-foreground h-auto justify-start p-4 text-left transition-all duration-500 border-purple-700 text-white hover:bg-purple-800/50';
      button.innerHTML = `
         <div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-current text-sm">
            ${letters[index]}
         </div>
         <span>${option}</span>
      `;
      button.onclick = () => selectAnswer(option, button);
      container.appendChild(button);
   });
}

// Select answer
async function selectAnswer(answer, buttonElement) {
   // Disable all buttons
   document.querySelectorAll('#answerOptions button').forEach(btn => {
      btn.disabled = true;
   });
   
   // Stop timer
   stopTimer();
   
   // Highlight selected answer
   buttonElement.classList.add('bg-yellow-500/30', 'border-yellow-500');
   
   try {
      const response = await fetch('/api.php?action=checkAnswer', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: `answer=${encodeURIComponent(answer)}`
      });
      
      const result = await response.json();
      
      if (result.success) {
         handleAnswerResult(result.data, buttonElement);
      } else {
         showError('Failed to check answer');
      }
   } catch (error) {
      console.error('Error checking answer:', error);
      showError('Failed to check answer');
   }
}

// Handle answer result
function handleAnswerResult(result, buttonElement) {
   if (result.correct) {
      // Show correct animation
      buttonElement.classList.remove('bg-yellow-500/30', 'border-yellow-500');
      buttonElement.classList.add('bg-green-500/50', 'border-green-500');
      
      setTimeout(() => {
         if (result.gameWon) {
            showGameOver(true, result.finalScore, result.message);
         } else {
            gameState.level = result.level;
            gameState.score = result.score;
            loadNextQuestion();
         }
      }, 2000);
   } else {
      // Show incorrect animation
      buttonElement.classList.remove('bg-yellow-500/30', 'border-yellow-500');
      buttonElement.classList.add('bg-red-500/50', 'border-red-500');
      
      // Highlight correct answer
      const buttons = document.querySelectorAll('#answerOptions button');
      buttons.forEach(btn => {
         const answerText = btn.querySelector('span').textContent;
         if (answerText === result.correctAnswer) {
            btn.classList.add('bg-green-500/50', 'border-green-500');
         }
      });
      
      setTimeout(() => {
         showGameOver(false, result.finalScore, result.message);
      }, 3000);
   }
}

// Start timer
function startTimer() {
   gameState.timeRemaining = 30;
   updateTimerDisplay();
   
   gameState.timerInterval = setInterval(() => {
      gameState.timeRemaining--;
      updateTimerDisplay();
      
      if (gameState.timeRemaining <= 0) {
         stopTimer();
         handleTimeout();
      }
   }, 1000);
}

// Stop timer
function stopTimer() {
   if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
   }
}

// Update timer display
function updateTimerDisplay() {
   document.getElementById('timerDisplay').textContent = `Time remaining: ${gameState.timeRemaining}s`;
   const percentage = (gameState.timeRemaining / 30) * 100;
   document.getElementById('timerBar').style.transform = `translateX(-${100 - percentage}%)`;
}

// Handle timeout
async function handleTimeout() {
   // Disable all buttons
   document.querySelectorAll('#answerOptions button').forEach(btn => {
      btn.disabled = true;
   });
   
   try {
      const response = await fetch('/api.php?action=checkAnswer', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: 'answer='
      });
      
      const result = await response.json();
      
      if (result.success && result.data.gameOver) {
         showGameOver(false, result.data.finalScore, 'Time expired!');
      }
   } catch (error) {
      console.error('Error handling timeout:', error);
      showGameOver(false, 0, 'Time expired!');
   }
}

// Use fifty-fifty lifeline
document.getElementById('fiftyFiftyBtn').addEventListener('click', async function() {
   if (this.disabled) return;
   
   try {
      const response = await fetch('/api.php?action=useFiftyFifty', {
         method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
         // Disable the button
         this.disabled = true;
         this.classList.add('opacity-50', 'cursor-not-allowed');
         
         // Re-render options with reduced choices
         renderAnswerOptions(result.data.options);
      } else {
         showError(result.error || 'Failed to use lifeline');
      }
   } catch (error) {
      console.error('Error using fifty-fifty:', error);
      showError('Failed to use lifeline');
   }
});

// Render prize levels
function renderPrizeLevels() {
   const container = document.getElementById('prizeLevels');
   container.innerHTML = '';
   
   PRIZE_LEVELS.forEach((prize, index) => {
      const level = 15 - index;
      const div = document.createElement('div');
      
      if (level === gameState.level) {
         div.className = 'rounded border p-2 text-center border-yellow-500 bg-yellow-500/20 text-yellow-400';
      } else {
         div.className = 'rounded border p-2 text-center border-purple-700 bg-purple-800/30 text-gray-300';
      }
      
      div.textContent = formatNumber(prize);
      container.appendChild(div);
   });
}

// Show game over modal
function showGameOver(won, finalScore, message) {
   const modal = document.getElementById('gameOverModal');
   const title = document.getElementById('gameOverTitle');
   const messageEl = document.getElementById('gameOverMessage');
   const scoreEl = document.getElementById('gameOverScore');
   
   title.textContent = won ? '🎉 Congratulations!' : 'Game Over';
   messageEl.textContent = message;
   scoreEl.textContent = `Final Score: ${formatNumber(finalScore)} points`;
   
   modal.classList.remove('hidden');
}

// Show error message
function showError(message) {
   alert(message);
}

// Format number with commas
function formatNumber(num) {
   return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
</script>
