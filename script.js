const gameBoard = document.getElementById('gameBoard');
const score1 = document.getElementById('score1');
const score2 = document.getElementById('score2');
const roundTimerDisplay = document.getElementById('round-timer');
const gameTimerDisplay = document.getElementById('game-timer');
const specialCondition = document.getElementById('specialCondition');
const countdownElement = document.getElementById('countdown');

const soundValid = document.getElementById("sound-valid");
const soundWrong = document.getElementById("sound-wrong");
const soundTyping = document.getElementById("sound-typing");
const soundCondition = document.getElementById("sound-condition");
const soundCountdown = document.getElementById("sound-countdown");
const bg1 = document.getElementById("bg-1");
const bg2 = document.getElementById("bg-2");

let bg1PlayCount = 0;
let isBacksoundPlaying = false;
let bg1EndedListener = null;

let teamWord3Count = { 1: 0, 2: 0 };
let teamWord2Count = { 1: 0, 2: 0 };
let teamWord1Count = { 1: 0, 2: 0 };
let teamTimesupCount = { 1: 0, 2: 0 };
let points = { 1: 0, 2: 0 };
let alphabetCounter = { 1: 0, 2: 0 };
let times = { 1: 0, 2: 0 };
let currentRound = 1;
let conditionRounds = 0;

let gridCol = 20;
let gridRow = 20;
let amountRowAdded = 20;
let cells = [];
let wordIndexes = [];
let backupWords = [];
let currentTeam = 1;
let roundTime = 30;
let gameTime = 600;
let typingWord = '';
let randomCondition = '';
let backwardWord = '';
let wordList = [];
let usedWords = new Set();
let currentPos = { x: 0, y: 0 };
let backupPos = { x: 0, y: 0, dir: 0, moveDown: false };
let currentDirection = 0; // 0: right, 1: left
let conditionCounter = 0;
let justMovedDown = false;
let letRemoveRow = false;
let start = false;
let condition = false;
let isCountingDown = false;
let gameActive = false;
let isBackward = false;
let valid = false;
let backup = false;
let endgame = false;
let countdownInterval = null;
let previewPositions = [];
let lastWord = '';
let bonus = 0;

function createGrid() {
  for (let i = 0; i < gridCol * gridRow; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    gameBoard.appendChild(cell);
    cells.push(cell);
  }
}

function removeRow(amount = 1) {
  if (amountRowAdded > 20) amountRowAdded -= amount, gridRow -= amount;
  for (let i = 0; i < gridCol*amount; i++) {
    const cell = cells.pop();
    gameBoard.removeChild(cell);
  }
  
  gameBoard.style.gridTemplateRows = `repeat(${gridRow}, 1fr)`;
  const currentHeight = parseFloat(getComputedStyle(gameBoard).height) / Math.min(window.innerWidth, window.innerHeight) * 100;
  const newHeight = currentHeight - 4*amount;
  gameBoard.style.height = `${newHeight}vmin`;
}

function createNewRow() {
  amountRowAdded++;
  gridRow++;
  for (let i = 0; i < gridCol; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    gameBoard.appendChild(cell);
    cells.push(cell);
  }

  gameBoard.style.gridTemplateRows = `repeat(${gridRow}, 1fr)`;
  const currentHeight = parseFloat(getComputedStyle(gameBoard).height) / Math.min(window.innerWidth, window.innerHeight) * 100;
  const newHeight = currentHeight + 4;
  gameBoard.style.height = `${newHeight}vmin`;
}

function getIndex(x, y) {
  return y * gridCol + x;
}

function updateTimers() {
  roundTimerDisplay.textContent = roundTime;
  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;
  gameTimerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const roundText = document.getElementById('round-counter');
  if (roundText) {
  roundText.textContent = `ROUND: ${currentRound}`;
  }
}

function returnRow() {
if (amountRowAdded > 20 && currentPos.y > 19) {
  const discardedRow = amountRowAdded - (currentPos.y + 2);
  removeRow(discardedRow);
  amountRowAdded = currentPos.y + 2;
} else {
  const discardedRow = amountRowAdded - 20;
  removeRow(discardedRow);
  amountRowAdded = 20;
}
}

function resetRoundTimer() {
  roundTime = 30;
  currentRound++;
  conditionCounter++;
  if (conditionCounter % 5 === 0) {
    randomCondition = Math.random() < 0.5 ? 'backward' : 'additional';
    conditionRounds++;
    if (!valid) {
      ({ x: currentPos.x, y: currentPos.y } = backupPos);
      currentDirection = backupPos.dir;
      justMovedDown = backupPos.moveDown;
      if (randomCondition === 'additional') {
        additional();
        showSpecialCondition('ADDITIONAL!'); 
      } else {
        backward();
        showSpecialCondition('BACKWARD');
      }
      returnRow();
      randomCondition = '';
    }
  }
}

function resetGame() {
  teamWord3Count = { 1: 0, 2: 0 };
  teamWord2Count = { 1: 0, 2: 0 };
  teamWord1Count = { 1: 0, 2: 0 };
  teamTimesupCount = { 1: 0, 2: 0 };
  points = { 1: 0, 2: 0 };
  alphabetCounter = { 1: 0, 2: 0 };
  times = { 1: 0, 2: 0 };
  conditionRounds = 0;
  score1.textContent = '0';
  score2.textContent = '0';
  randomCondition = '';
  backwardWord = '';
  roundTime = 30;
  gameTime = 600;
  currentRound = 1;
  updateTimers();
  typingWord = '';
  currentTeam = 1;
  currentPos = { x: 0, y: 0 };
  backupPos = { x: 0, y: 0, dir: 0, moveDown: false };
  currentDirection = 0;
  conditionCounter = 0;
  usedWords.clear();
  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });
  wordIndexes = [];
  backupWords = [];
  previewPositions = [];
  start = false;
  gameActive = false;
  backup = false;
  letRemoveRow = false;
  justMovedDown = false;
  condition = false;
  isCountingDown = false;
  isBackward = false;
  valid = false;
  endgame = false;
  countdownInterval = null;
  lastWord = '';
  bonus = 0;
  returnRow();
}

function startCountdown(text) {
  if (isCountingDown) return;
  playSound(soundCountdown);
  isCountingDown = true;

  let count = 3;
  countdownElement.style.display = 'block';
  countdownElement.style.opacity = '1';
  countdownElement.textContent = count;

  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownElement.textContent = count;
    } else if (count === 0) {
      countdownElement.textContent = text;
      if (text === 'START!') {
        gameTime--;
        roundTime--;
        updateTimers();
      }

      if (text === 'GAME OVER!') {
        for (let i = 0; i < previewPositions.length; i++) {
          const idx = previewPositions[i];
          const cell = cells[idx];
          cell.textContent = '';
          cell.classList.remove('preview');
        }
        points[1] += Math.floor(alphabetCounter[1]/5);
        points[2] += Math.floor(alphabetCounter[2]/5);
        score1.textContent = points[1];
        score2.textContent = points[2];
        times[3] = times[1];
        times[4] = times[2];
        for (let i = 1; i < 3; i++) {
          const minutes = Math.floor(times[i] / 60);
          const seconds = times[i] % 60;
          times[i] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        ({ x: currentPos.x, y: currentPos.y } = backupPos);
        currentDirection = backupPos.dir;
        justMovedDown = backupPos.moveDown;
        returnRow();
        roundTimerDisplay.textContent = 0;
        gameActive = false;
        endgame = true;
        resetBacksound();
        setTimeout(() => {
          const stats = generateStats();
          showEndGameSummary(stats);
        }, 2000);
        return;
      } 
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdownElement.style.opacity = '0';
      setTimeout(() => {
        countdownElement.style.display = 'none';
      }, 500);
      isCountingDown = false;
      if (text === 'START!') {
        gameActive = true;
        playBacksoundSequence();
      }
    }
  }, 1000);
}

function moveDomino() {
  if (currentDirection === 0) {
    if (currentPos.x < gridCol - 1) {
      currentPos.x++;
      letRemoveRow = true;
    } else {
      if (!justMovedDown) {
        letRemoveRow = false;
        currentPos.y++;
        justMovedDown = true;
      } else {
        letRemoveRow = false;
        currentPos.y++;
        currentDirection = 1;
        justMovedDown = false;
      }
    }
  } else {
    if (currentPos.x > 0) {
      currentPos.x--;
      letRemoveRow = true;
    } else {
      if (!justMovedDown) {
        letRemoveRow = false;
        currentPos.y++;
        justMovedDown = true;
      } else {
        letRemoveRow = false;
        currentPos.y++;
        currentDirection = 0;
        justMovedDown = false;
      }
    }
  }

  if (currentPos.y >= gridRow - 1 && !justMovedDown) {
    createNewRow();
    gameBoard.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}

function moveBackDomino() {
  if (currentDirection === 0) {
    if (currentPos.x > 0) {
      justMovedDown ? (currentPos.y--, justMovedDown = false, letRemoveRow = false) : (currentPos.x--, letRemoveRow = true);
    } else {
      letRemoveRow = false;
      currentPos.y--;
      currentDirection = 1;
      justMovedDown = true;
    }
  } else {
    if (currentPos.x < gridCol - 1) {
      justMovedDown ? (currentPos.y--, justMovedDown = false, letRemoveRow = false) : (currentPos.x++, letRemoveRow = true);
    } else {
      letRemoveRow = false;
      currentPos.y--;
      currentDirection = 0;
      justMovedDown = true;
    }
  }
  
  if (currentPos.y < amountRowAdded && amountRowAdded > 20) {
    if ((currentPos.x === gridCol - 1  || currentPos.x === 0) && (justMovedDown || letRemoveRow)) {
    removeRow();
    }
  }
}

function placeWord(word) {
  if (previewPositions.length > word.length) {
    for (let i = 0; i < previewPositions.length - word.length; i++) {
      const idx = previewPositions[i + word.length];
      const cell = cells[idx];
      cell.textContent = '';
      cell.classList.remove('preview');
      }
    if (previewPositions.length >= word.length*2) {
      previewPositions.splice(word.length);
    } else {
      const alternate = previewPositions.splice(previewPositions.length - word.length);
      previewPositions = alternate;
    }
  }
  
  backupWords = [];
  for (let i = 0; i < previewPositions.length; i++) {
    const idx = previewPositions[i];
    const cell = cells[idx];
    cell.textContent = word[i];
    backupWords.push(word[i])
    cell.classList.remove('preview');
    if (condition) {
      cell.classList.add('condition');
    } else {
      cell.classList.add(currentTeam === 1 ? 'team1' : 'team2');
    }
    if (condition) {
    } else {
    cell.classList.add('valid');
    setTimeout(() => {
      cell.classList.remove('valid');
    }, 400);
  }
  } 
  condition &&= false;
  backup &&= false;
  wordIndexes.push([...previewPositions]);
}

function shakeCells(positions) {
  positions.forEach(idx => {
    const cell = cells[idx];
    if (cell.classList.contains('shaking')) return;
    const original = [...cell.classList];
    const originalText = cell.textContent;
    cell.classList.remove('team1', 'team2', 'condition', 'preview', 'helper');
    cell.classList.add('invalid', 'shaking');
    setTimeout(() => {
      cell.classList.remove('invalid', 'shaking');
      if (cell.textContent !== originalText) return;
      cell.className = 'cell';
      original.forEach(cls => {
        if (cls === 'condition') {
          cell.classList.add('helper');
        } else {
          cell.classList.add(cls);
        }
      });
      }, 500);
    
  });
}

function scrollToCellAndBack(target, back) {
  const targetCell = cells[target[0]];
  const originalScroll = cells[back];
  targetCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    originalScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 1000);
}

function additional() {
  playSound(soundCondition);
  let addWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
  while (usedWords.has(addWord.toLowerCase())) {
    addWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();
  }
  usedWords.add(addWord.toLowerCase());
  condition = true;
  lastWord = addWord[addWord.length - 1];
  for (let i = 0; i < addWord.length; i++) {
    const index = getIndex(currentPos.x, currentPos.y);
    previewPositions.push(index);
    moveDomino();
      }
  placeWord(addWord);
  scrollToCellAndBack(previewPositions, getIndex(currentPos.x, currentPos.y));
  previewPositions = [];
  typingWord = '';

}

function backward(word) {
  playSound(soundCondition);
  condition = true;
  if (!valid) {
    for (let i = 0; i < previewPositions.length; i++) {
      const idx = previewPositions[i];
      const cell = cells[idx];
      cell.textContent = '';
      cell.classList.remove('preview');
    }

    let wordify = '';
    for (let i = 0; i < backupWords.length; i++) {
      wordify += backupWords[i];
    }
    wordify = wordify.split('').reverse().join('');
    backupWords = [];
    for (let i = 0; i < wordIndexes[wordIndexes.length - 1].length; i++) {
      const matchedPositions = wordIndexes[wordIndexes.length - 1];
      const idx = matchedPositions[i];
      const cell = cells[idx];
      cell.textContent = wordify[i];
      backupWords.push(wordify[i])
      cell.classList.remove('team1', 'team2', 'condition', 'preview', 'helper');
      cell.classList.add('condition');
      setTimeout(() => {
        cell.classList.remove('condition');
        cell.classList.add('helper');
      }, 500);    
    } 
    condition &&= false;
    backup &&= false;
    backwardWord = wordify;
    previewPositions = [];
    typingWord = '';
    lastWord = backwardWord[backwardWord.length - 1];
    scrollToCellAndBack(wordIndexes[wordIndexes.length - 1], getIndex(currentPos.x, currentPos.y));
  } else {
    backwardWord = word.split('').reverse().join('');
    isBackward = true;
  }
}

function playSound(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.volume = 0.5;
  sound.play();
}

function playBacksoundSequence() {
  if (isBacksoundPlaying) return;
  isBacksoundPlaying = true;
  bg1PlayCount = 0;
  bg1.volume = 1;
  bg2.volume = 1;
  bg1.play();
  bg1EndedListener = () => {
    bg1PlayCount++;
    if (bg1PlayCount < 2) {
      bg1.currentTime = 0;
      bg1.play();
    } else {
      bg2.play();
    }
  };
  bg1.addEventListener('ended', bg1EndedListener);
}

function resetBacksound() {
  bg1.pause();
  bg2.pause();
  bg1.currentTime = 0;
  bg2.currentTime = 0;

  isBacksoundPlaying = false;
  bg1PlayCount = 0;

  if (bg1EndedListener) {
    bg1.removeEventListener('ended', bg1EndedListener);
    bg1EndedListener = null;
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      soundCountdown.pause();
      soundCountdown.currentTime = 0;
      countdownInterval = null;
    }
    isCountingDown = false;
    countdownElement.style.opacity = '0';
    countdownElement.style.display = 'none';
    document.getElementById('endGameSummary').style.display = 'none';
    resetGame();
    resetBacksound();
    return;
  }

  if (e.code === 'Space') {
    if (endgame) return;

    if (!gameActive && !isCountingDown) {
      startCountdown('START!');
    }
    e.preventDefault();
    return;
  }

  if (!gameActive) return;

  if (e.key === 'Enter') {
    if (typingWord.length > 0) {
      let word = typingWord;
      if (lastWord === word[0] || !start) {
        if (wordList.includes(word.toLowerCase()) && usedWords.has(word.toLowerCase())) {
          playSound(soundWrong);
          const wordIdx = Array.from(usedWords).indexOf(word.toLowerCase());
          const matchedPositions = wordIndexes[wordIdx];
          shakeCells(matchedPositions);
          scrollToCellAndBack(wordIndexes[wordIdx], getIndex(currentPos.x, currentPos.y));
          return;
        }
  
        valid = wordList.includes(word.toLowerCase());
        if (valid) {
          alphabetCounter[currentTeam] += word.length;
          playSound(soundValid);
          start ||= true; 
          typingWord = '';
          resetRoundTimer();
          if (isCountingDown) {
            if (gameTime <= 3) {} else {
            countdownElement.style.display = 'none';
            isCountingDown = false;
            soundCountdown.pause();
            soundCountdown.currentTime = 0;
            }
          }
  
          if (randomCondition === 'backward') {
            backward(word);
            showSpecialCondition('BACKWARD!');
            randomCondition = '';
          }
  
          valid = false;
          usedWords.add(word.toLowerCase());
          if (isBackward) {
            placeWord(backwardWord);
            lastWord = backwardWord[backwardWord.length - 1];
            isBackward = false;
          } else {
            lastWord = word[word.length - 1];
            placeWord(word);
          }
          scrollToCellAndBack(previewPositions, getIndex(currentPos.x, currentPos.y));
          previewPositions = [];
  
          if (randomCondition === 'additional') {
            additional();
            showSpecialCondition('ADDITIONAL!');
            randomCondition = '';
          }
          points[currentTeam] += bonus;
          if (bonus === 3) teamWord3Count[currentTeam]++;
          else if (bonus === 2) teamWord2Count[currentTeam]++;
          else teamWord1Count[currentTeam]++;

          if (currentTeam === 1) score1.textContent = points[1];
          else score2.textContent = points[2];
          currentTeam = currentTeam === 1 ? 2 : 1;
          if (!backup) {
            backup = true;
            ({ x: backupPos.x, y: backupPos.y } = currentPos);
            backupPos.dir = currentDirection;
            backupPos.moveDown = justMovedDown;
          }
        } else {
          playSound(soundWrong);
          shakeCells(previewPositions);
        }
      } else {
        playSound(soundWrong);
        shakeCells(previewPositions);
      }
    } 
  }

  if (e.key === 'Backspace') {
    if (typingWord.length > 0) {
      playSound(soundTyping);
      typingWord = typingWord.slice(0, -1);
      const lastIndex = previewPositions.pop();
      const cell = cells[lastIndex];
      cell.textContent = '';
      cell.classList.remove('invalid');
      cell.classList.remove('preview');
      moveBackDomino();
    }
    return;
  }
  
  if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
    playSound(soundTyping);
    const letter = e.key.toUpperCase();
    typingWord += letter;
    const index = getIndex(currentPos.x, currentPos.y);
    const cell = cells[index];
    cell.textContent = letter;
    cell.classList.add('preview');
    previewPositions.push(index);
    moveDomino();
  }
});

setInterval(() => {
  if (!gameActive) return;

  roundTime--;
  gameTime--;
  times[currentTeam]++;
  if (roundTime >= 20) bonus = 3;
  else if (roundTime >= 10) bonus = 2;
  else bonus = 1;

  if (roundTime === 3 && gameTime !== 3) startCountdown('TIMES UP!');
  
  if (roundTime <= 0) {
    if (!start) {
      ({ x: currentPos.x, y: currentPos.y } = backupPos);
      currentDirection = backupPos.dir;
      justMovedDown = backupPos.moveDown;
      additional()
      if (amountRowAdded > 20) {
        returnRow();
      }
      start = true;
      backup = false;
    }
    points[currentTeam === 1 ? 2 : 1]++;
    teamTimesupCount[currentTeam === 1 ? 2 : 1]++;
    if (currentTeam === 1) score2.textContent = points[2];
    else score1.textContent = points[1];
    currentTeam = currentTeam === 1 ? 2 : 1;
    resetRoundTimer();
  }

  if (gameTime === 3) startCountdown('GAME OVER!');

  updateTimers();
}, 1000);

function fetchWords() {
  fetch('wordlist.json')
    .then(res => res.json())
    .then(data => {
      wordList = data.words;
    });
}

function showSpecialCondition(text) {
  if (isCountingDown) {
    if (gameTime <= 3) {
      specialCondition.style.top = `80%`;
    } else {
      specialCondition.style.top = `70%`;
    }
  } else {
    specialCondition.style.top = `50%`;
  }
  specialCondition.style.display = 'block';
  specialCondition.style.opacity = 1;
  specialCondition.textContent = text;
  setTimeout(() => {
    specialCondition.style.opacity = 0;
    setTimeout(() => {
      specialCondition.style.display = 'none';
    }, 500);
  }, 1000);
}

function showEndGameSummary(stats) {
  const summary = document.getElementById('endGameSummary');
  const content = document.getElementById('summaryContent');

  content.innerHTML = `
    <table>
      <thead>
        <tr>
          <th rowspan="2">Stat</th>
          <th rowspan="2">Team 1</th>
          <th rowspan="2">Team 2</th>
          <th colspan="2">Total</th>
        </tr>
        <tr>
          <th rowspan="2">Team 1</th>
          <th rowspan="2">Team 2</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Words (3 pts)</td><td>${stats.team1.word3}</td><td>${stats.team2.word3}</td><td>${stats.team1.word3Amount}</td><td>${stats.team2.word3Amount}</td></tr>
        <tr><td>Words (2 pts)</td><td>${stats.team1.word2}</td><td>${stats.team2.word2}</td><td>${stats.team1.word2Amount}</td><td>${stats.team2.word2Amount}</td></tr>
        <tr><td>Words (1 pt)</td><td>${stats.team1.word1}</td><td>${stats.team2.word1}</td><td>${stats.team1.word1}</td><td>${stats.team2.word1}</td></tr>
        <tr><td>Times Up Points</td><td>${stats.team1.timesup}</td><td>${stats.team2.timesup}</td><td>${stats.team1.timesup}</td><td>${stats.team2.timesup}</td></tr>
        <tr><td>Number of Letters</td><td>${stats.team1.letter}</td><td>${stats.team2.letter}</td><td>${stats.team1.letterAmount}</td><td>${stats.team2.letterAmount}</td></tr>
        <tr style="font-weight: bold;"><td colspan="3">Total Points</td><td>${stats.team1.total}</td><td>${stats.team2.total}</td></tr>
        <tr><td>Time Used</td><td id="team1time">${stats.team1.time}</td><td id="team2time">${stats.team2.time}</td></tr>
      </tbody>
    </table>
    <div style="width: 25px;"></div>
    <table>
      <tbody>
        <tr><td>Condition Rounds</td><td colspan="2">${stats.conditions}</td></tr>
        <tr><td>Rounds Played</td><td colspan="2">${stats.rounds}</td></tr>
      </tbody>
    </table>
    <div style="width: 25px;"></div>
    <table>
      <tbody>
        <tr style="font-weight: bold; color: darkgreen;"><td>Winner</td><td colspan="2">${stats.winner}</td></tr>
      </tbody>
    </table
  `;

  summary.style.display = 'flex';
  if (points[1] === points[2]) {
    if (times[3] < times[4]) {
      document.getElementById('team1time').style.color = 'darkgreen';
      document.getElementById('team1time').style.fontWeight = 'bold';
    } else {
      document.getElementById('team2time').style.color = 'darkgreen';
      document.getElementById('team2time').style.fontWeight = 'bold';
    }
  }
}

function generateStats() {
  return {
    team1: {
      word3: teamWord3Count[1],
      word2: teamWord2Count[1],
      word1: teamWord1Count[1],
      word3Amount: teamWord3Count[1]*3,
      word2Amount: teamWord2Count[1]*2,
      timesup: teamTimesupCount[1],
      letter: alphabetCounter[1],
      letterAmount: Math.floor(alphabetCounter[1]/5),
      total: points[1],
      time: times[1],
    },
    team2: {
      word3: teamWord3Count[2],
      word2: teamWord2Count[2],
      word1: teamWord1Count[2],
      word3Amount: teamWord3Count[2]*3,
      word2Amount: teamWord2Count[2]*2,
      timesup: teamTimesupCount[2],
      letter: alphabetCounter[2],
      letterAmount: Math.floor(alphabetCounter[2]/5),
      total: points[2],
      time: times[2],
    },
    conditions: conditionRounds,
    rounds: currentRound,
    winner: points[1] < points[2] ? 'TEAM 1' : 'TEAM 2'
  };
}

createGrid();
fetchWords();
updateTimers();
