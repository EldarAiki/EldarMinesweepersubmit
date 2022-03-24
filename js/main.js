'use strict'

const GAMEON = '🙂'
const WIN = '😎'
const GAMELOST = '💀'
const FLAG = '📍'
const MINE = '💣'
const LIVES = '❤'


var gGameField
var gTrueMarked = 0
var gFieldSize = 4
var gPlayTime
var gLives = 3
var gIsGameOn = false
var gSeconds = 0
var gCellsToPlay = 16
var gRemainingMines = 2
var gBestScoreBegginer = Infinity
var gBestScoreMedium = Infinity
var gBestScoreExpert = Infinity
var gHintsRemaining = 3
var gIsHintPressed = false

localStorage.setItem("gBestScoreBegginer", Infinity);
localStorage.setItem("gBestScoreMedium", Infinity);
localStorage.setItem("gBestScoreExpert", Infinity);



// disable rightclick menue <<<< disable to bring console!!!!
document.oncontextmenu = preventMenue



function init() {


    gHintsRemaining = 3
    gGameField = buildBoard(gFieldSize)
    showHearts()
    gSeconds = 0
    showRemaining()

    renderBeggining()



}

function buildBoard(size) {


    var board = []
    for (var i = 0; i < size; i++) {
        board[i] = []
        for (var j = 0; j < size; j++) {
            var cell = {
                mine: false,
                marked: false,
                blown: false,
                isOpen: false,
                surroundingMines: 0
            }
            board[i].push(cell)
        }

    }

    return board

}

function spawnMinesToField(event, boardSize, i, j) {



    var mines
    if (boardSize === 4) mines = 2
    if (boardSize === 8) mines = 12
    if (boardSize === 12) mines = 30

    var locArr = []
    for (var m = 0; m < boardSize; m++) {
        for (var n = 0; n < boardSize; n++) {

            if (m === i && n === j) {
                continue
            } else {

                locArr.push({ i: m, j: n })
                // console.log(m, n);
            }
        }
    }

    for (var l = 0; l < mines; l++) {

        var rand = getRndInt(0, locArr.length - 1)
        var currMine = locArr[rand]
        locArr.slice(rand, 1)
        gGameField[currMine.i][currMine.j].mine = true

    }

    markSurroundings()

    if (!gIsGameOn) {
        gIsGameOn = true
        gameTimer()
        cellClicked(event, i, j)
    }



}


function renderBoard(board) {

    var strHTML = ''
    var cellHTML
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board.length; j++) {
            if (board[i][j].isOpen) {
                //TODO cellHTML = `<td class="cellOpen" >${gGameField[i][j].surroundingMines}</td>`
                cellHTML = `<td class="cellOpen" >${gGameField[i][j].surroundingMines}</td>`
            } else {

                cellHTML = `<td class="unopen" onmouseup="cellClicked(event, ${i}, ${j})"> </td>`
                // console.log(i,j);
            }
            if (board[i][j].blown) {
                cellHTML = `<td class="blown" >💣</td>`
                // continue
            }
            if (board[i][j].marked) {

                cellHTML = `<td class="marked" onmouseup="cellClicked(event, ${i}, ${j})">${FLAG}</td>`



            }

            // var cellTest = `<td class="unopen" onclick="testShowLoc(${i},${j})"> </td>`
            strHTML += cellHTML
        }
        strHTML += '</tr>'
    }

    var assignToDom = document.querySelector('.field')
    assignToDom.innerHTML = strHTML

    showHearts()

    // console.log(strHTML);


}

function renderBeggining() {

    var strHTML = ''
    var cellHTML
    for (var i = 0; i < gGameField.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gGameField.length; j++) {

            cellHTML = `<td class="unopen" onmouseup="spawnMinesToField(event,${gGameField.length},${i}, ${j})"> </td>`
            strHTML += cellHTML
        }
        strHTML += '</tr>'
    }

    var assignToDom = document.querySelector('.field')
    assignToDom.innerHTML = strHTML

}


function cellClicked(event, i, j) {

    // if (gIsHintPressed) {
    //     hintClicked(event,i,j)
    //     return
    // }

    var whichButton = event.button
    // console.log(whichButton);

    switch (whichButton) {

        case 0:

            if (gGameField[i][j].marked) return
            if (gGameField[i][j].blown) return
            if (gGameField[i][j].mine) {
                if (gIsHintPressed) {
                    gGameField[i][j].isOpen = true
                    renderHint(gGameField,i,j)
                    setTimeout(finishHint, 1000, i,j)
                    return
                }

                gGameField[i][j].blown = true
                gLives--

                if (gLives === 0) {
                    gameOver(gGameField)
                    return
                }
                if (isGameWon()) gameWon()
                renderBoard(gGameField)
                // console.log('blow!')
                //TODO: checkGameOver()
                
            } else {
                if (!gGameField[i][j].isOpen) {

                    if (gIsHintPressed) {
                        gGameField[i][j].isOpen = true
                        renderHint(gGameField,i,j)
                        setTimeout(finishHint, 1000, i,j)
                        return
                    }



                    gGameField[i][j].isOpen = true
                    if (isGameWon()) gameWon()
                    expandShown(i, j, -1, -1)
                }

            }
        case 2:

            if (gGameField[i][j].blown) return
            if (gGameField[i][j].marked) {
                gGameField[i][j].marked = false
                gRemainingMines ++
                showRemaining()
                renderBoard(gGameField)
                return
            }
            if (!gGameField[i][j].isOpen) {
                gGameField[i][j].marked = true
                gRemainingMines--
                showRemaining()
                if (isGameWon()) gameWon()
                renderBoard(gGameField)
                return
            }


    }

    renderBoard(gGameField)

    if (isGameWon()) gameWon()

}

function getNighboursCount(idx, jdx) {


    var threats = 0


    for (var i = idx - 1; i <= idx + 1; i++) {

        if (i < 0 || i >= gGameField.length) continue
        for (var j = jdx - 1; j <= jdx + 1; j++) {

            if (j < 0 || j >= gGameField.length) continue
            if (hasMine(i, j)) threats++
        }

    }



    return threats

}

function markSurroundings() {


    for (var i = 0; i < gGameField.length; i++) {

        for (var j = 0; j < gGameField.length; j++) {

            if (gGameField[i][j].mine) continue
            else {
                gGameField[i][j].surroundingMines = getNighboursCount(i, j)
            }

        }
    }


}



function hasMine(i, j) {


    return gGameField[i][j].mine
}


// function expandShown(idx, jdx) {


//     if (gGameField[idx][jdx].surroundingMines === 0) {

//         for (var i = idx - 1; i <= idx + 1; i++) {

//             if (i < 0 || i >= gGameField.length) continue
//             for (var j = jdx - 1; j <= jdx + 1; j++) {

//                 if (j < 0 || j >= gGameField.length) continue
//                 gGameField[i][j].isOpen = true
//                 // if (gGameField[i][j].surroundingMines === 0) expandShown(i,j)
//             }

//         }

//     }

// }

function expandShown(idx, jdx, lastI, lastJ) {


    if (getNighboursOpenCount(idx, jdx) === 8) {
        return
    }




    if (gGameField[idx][jdx].surroundingMines === 0) {

        for (var i = idx - 1; i <= idx + 1; i++) {

            if (i < 0 || i >= gGameField.length) continue
            for (var j = jdx - 1; j <= jdx + 1; j++) {

                if (j < 0 || j >= gGameField.length) continue
                gGameField[i][j].isOpen = true
            }

        }

        for (var i = idx - 1; i <= idx + 1; i++) {

            if (i < 0 || i >= gGameField.length) continue
            for (var j = jdx - 1; j <= jdx + 1; j++) {

                if (j < 0 || j >= gGameField.length) continue
                if (gGameField[i][j].surroundingMines === 0) {

                    if (getNighboursOpenCount(i, j) !== 8) {
                        if (i === lastI && j === lastJ) {
                            return

                        } else {
                            expandShown(i, j, idx, jdx)
                        }
                    }
                }
            }

        }

    }

}



function getNighboursOpenCount(idx, jdx) {


    var openedCells = 0


    for (var i = idx - 1; i <= idx + 1; i++) {

        if (i < 0 || i >= gGameField.length) continue
        for (var j = jdx - 1; j <= jdx + 1; j++) {

            if (j < 0 || j >= gGameField.length) continue
            if (i === idx && j === jdx) continue
            if (gGameField[i][j].isOpen) openedCells++
        }

    }

    return openedCells
}






function reastartGame() {

    if (gFieldSize === 4) gRemainingMines = 2
    if (gFieldSize === 8) gRemainingMines = 12
    if (gFieldSize === 12) gRemainingMines = 30

    gIsGameOn = false
    gLives = 3
    gSeconds = 0
    displaySecondsFresh()
    clearInterval(gPlayTime)

    var deadIcon = document.querySelector('.resetBtn')
    deadIcon.innerText = GAMEON


    init()

}

function startTimer() {

}


function testShowLoc(i, j) {
    console.log(i, j)
}

function preventMenue(event) {

    event = event || window.event
    if (event.preventDefault) {
        event.preventDefault()
    } else {
        event.returnValue = false
    }
}

function gameOver(board) {

    var deadIcon = document.querySelector('.resetBtn')
    deadIcon.innerText = GAMELOST

    clearInterval(gPlayTime)

    var strHTML = ''
    var cellHTML
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board.length; j++) {

            cellHTML = `<td class="cellOpen" >${gGameField[i][j].surroundingMines}</td>`

            if (board[i][j].marked) {
                cellHTML = `<td class="marked" >${FLAG}</td>`
            }

            if (board[i][j].mine) {

                cellHTML = `<td class="uncovered" >${MINE}</td>`

            }



            if (board[i][j].blown) {
                cellHTML = `<td class="blown" >${MINE}</td>`
                // continue
            }

            strHTML += cellHTML
        }
        strHTML += '</tr>'
    }
    var assignToDom = document.querySelector('.field')
    assignToDom.innerHTML = strHTML
    showHearts()

}

function gameTimer() {

    gPlayTime = setInterval(displaySeconds, 1000)
    //   console.log("timer")

}

function displaySeconds() {

    gSeconds++
    var getTimer = document.querySelector('.timer')
    // console.log(getTimer);
    getTimer.innerText = 'time: ' + gSeconds

}

function displaySecondsFresh() {

    var getTimer = document.querySelector('.timer')
    getTimer.innerText = gSeconds

}

function showHearts() {

    var hearts = ''
    for (var i = 0; i < gLives; i++) {
        hearts += '❤'
    }

    if (gLives === 0) hearts = 'GAME OVER'

    var health = document.querySelector('.lives')
    health.innerText = hearts
}

function beginner() {

    gFieldSize = 4
    gCellsToPlay = 16
    gRemainingMines = 2
    showScore(gFieldSize)
    reastartGame()
}

function medium() {

    gFieldSize = 8
    gCellsToPlay = 64
    gRemainingMines = 12
    showScore(gFieldSize)
    reastartGame()
}
function expert() {

    gFieldSize = 12
    gCellsToPlay = 144
    gRemainingMines = 30
    reastartGame()
    showScore(gFieldSize)
}



function isGameWon() {


    var trueMarked = 0
    var openedCells = 0

    for (var i = 0; i < gGameField.length; i++) {

        for (var j = 0; j < gGameField.length; j++) {

                if (gGameField[i][j].marked) {
                    if (gGameField[i][j].mine) trueMarked++
                }
                if (gGameField[i][j].isOpen || (gGameField[i][j].blown)) openedCells++
        }

    }

    var res =  (trueMarked + openedCells === gCellsToPlay)? true : false

    console.log(trueMarked);
    console.log(openedCells);
    console.log(res);

 
    return res
   
}

function gameWon() {

    var deadIcon = document.querySelector('.resetBtn')
    deadIcon.innerText = WIN

    clearInterval(gPlayTime)

    updateScore(gFieldSize)

    showScore(gFieldSize)
    


}

function showRemaining() {

    var remaining = document.querySelector('.remaining')
    remaining.innerText = 'remaining mines: ' + gRemainingMines
}


function updateScore(size) {

    var bestScore

    switch (size) {

        case 4: bestScore = localStorage.getItem("gBestScoreBegginer")

        case 8: bestScore = localStorage.getItem("gBestScoreMedium")

        case 12: bestScore = localStorage.getItem("gBestScoreExpert")
    }

    if (gSeconds < bestScore) {

        // switch (size) {

        //     case 4: 
        //         localStorage.setItem("gBestScoreBegginer", gSeconds)
        //         gBestScoreBegginer = gSeconds
    
        //     case 8: 
        //         localStorage.setItem("gBestScoreMedium", gSeconds);
        //         gBestScoreMedium = gSeconds
    
        //     case 12: 
        //         localStorage.setItem("gBestScoreExpert", gSeconds);
        //         gBestScoreExpert = gSeconds
        // }

        if (size===4) {
        
                localStorage.setItem("gBestScoreBegginer", gSeconds)
                gBestScoreBegginer = gSeconds
        }
        if (size === 8) {
      
                localStorage.setItem("gBestScoreMedium", gSeconds);
                gBestScoreMedium = gSeconds
        }
        if (size === 12) {
      
                localStorage.setItem("gBestScoreExpert", gSeconds);
                gBestScoreExpert = gSeconds
        }

        bestScore = gSeconds

    }



    showScore(size)


}

function showScore(size) {

    var bestScore

    // switch (size) {

    //     case 4: bestScore = localStorage.getItem("gBestScoreBegginer")
    //             console.log('bg');

    //     case 8: bestScore = localStorage.getItem("gBestScoreMedium")
    //             console.log('md');

    //     case 12: bestScore = localStorage.getItem("gBestScoreExpert")
    //             console.log('exp');
    // }



    if (size === 4) { 
            bestScore = localStorage.getItem("gBestScoreBegginer")
            // console.log('bg' ,bestScore)
    }
    if (size === 8) {
            bestScore = localStorage.getItem("gBestScoreMedium")
            // console.log('md', bestScore)
    }
    if (size === 12) {
            bestScore = localStorage.getItem("gBestScoreExpert")
            // console.log('exp' , bestScore);
    }

    

    var score = document.querySelector('.bestscore')

    if (bestScore == Infinity) {
        score.innerText = 'best score'
    }else {
        score.innerText = 'best score: ' + bestScore
    }
    
}


function hint() {

    if (gHintsRemaining === 0) return
    gHintsRemaining--
    console.log(gHintsRemaining)

    gIsHintPressed = true
    
}



function renderHint(board, idx,jdx) {

    var strHTML = ''
    var cellHTML
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board.length; j++) {
            if (board[i][j].isOpen) {
                if (i=== idx && j ===jdx) {

                    if (gGameField[i][j].mine) {
                        cellHTML = `<td class="reveal" >${MINE}</td>`
                    }else {

                        cellHTML = `<td class="reveal" >${gGameField[i][j].surroundingMines}</td>`
                    }



                } else {
                    cellHTML = `<td class="cellOpen" >${gGameField[i][j].surroundingMines}</td>`
                }
            } else {

                cellHTML = `<td class="unopen" > </td>`

            }
            if (board[i][j].blown) {
                cellHTML = `<td class="blown" >💣</td>`
            }
            if (board[i][j].marked) {

                cellHTML = `<td class="marked" >${FLAG}</td>`

            }

            strHTML += cellHTML
        }
        strHTML += '</tr>'
    }

    var assignToDom = document.querySelector('.field')
    assignToDom.innerHTML = strHTML

    showHearts()



}


function finishHint(i,j) {
    console.log('hintFinished');
    gGameField[i][j].isOpen = false
    gIsHintPressed = false
    renderBoard(gGameField)
}


