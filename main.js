
function myAlert(message){
    document.querySelector('.alerts').innerHTML += "<br>" + message;
}


function clickHandler(miniGame, index){
    window.game.placeToken(miniGame, index);

    let movesAndScores = window.game.scoreMoves(3);
    if (window.game.player == 'O')
        movesAndScores = movesAndScores.sort((x,y) => x[1] - y[1]);

    let moves = movesAndScores.map(x => `(${x[0][0]},${x[0][1]})`);;
    let scores = movesAndScores.map(x => x[1]);
    console.log("moves: ", moves);
    console.log("scores: ", scores);

}




class MiniGame {

    constructor(index){
        this.board = [];
        for (let i = 0; i < 9; i++)
            this.board.push('');

        this.index = index;
    }

    clone(){
        let game = new MiniGame(this.index);
        game.board = [...this.board]; 

        return game;
    }


    placeToken(token, place){
        this.board[place] = token;
    }

    // Returns 0 if TBD, 1 if X, 2 if O, 3 if tie
    winner(){

        // 3-in-a-row
        let wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let win of wins){
            if (this.board[win[0]] == this.board[win[1]] && this.board[win[1]] == this.board[win[2]] && this.board[win[0]] != ''){
                if (this.board[win[0]] == 'X')
                    return 1;
                else
                    return 2;
            }
        }

        // tie or game still in progress
        return (this.board.includes('')) ? 0 : 3;
    }

    // Moves are of the form [token, place]
    possibleMoves(token){
        if (this.winner() != 0)
            return [];

        let moves = [];
        for (let i = 0; i < 9; i++)
            if (this.board[i] == '')
                moves.push([token, i]);

        return moves;
    }


    html(mustPlay){
        let html = '';
        for (let i = 0; i < 9; i++){
            if (this.board[i] == 'X')
                html += '<div class="token X">X</div>';
            else if (this.board[i] == 'O')
                html += '<div class="token O">O</div>';
            else
                html += `<div class="token empty" onclick="clickHandler(${this.index}, ${i})"></div>`;
        }
        let forced = mustPlay ? 'forced' : '';
        let finished = this.winner() != 0 ? 'finished' : '';
        let player = this.winner() == 1 ? 'X' : this.winner() == 2 ? 'O' : '';
        return `<div class='miniGame ${forced} ${finished} ${player}'>` + html + "</div>";
    }

}













class Game {

    constructor(simulated) {
        this.subGames = [];
        for (let i = 0; i < 9; i++)
            this.subGames.push(new MiniGame(i));

        this.player='X';
        this.forcedBoard = -1; // -1 = not forced, 0-8 = must play in that game 

        this.simulated = simulated;

    }

    clone(){
        let game = new Game();
        game.subGames = this.subGames.map(game => game.clone());
        game.player = this.player;
        game.forcedBoard = this.forcedBoard;
        game.simulated = this.simulated;
        return game;
    }


    placeToken(subGame, place){
        let wrongBoard = this.forcedBoard != -1 && this.forcedBoard != subGame;
        let gameOver = this.subGames[subGame].winner() != 0;
        if (wrongBoard || gameOver){
            console.log('invalid move');
            return false;
        }
        

        this.subGames[subGame].placeToken(this.player, place);
        this.player = this.player == 'X' ? 'O' : 'X';
        
        this.forcedBoard =  (this.subGames[place].winner() == 0) ? place : -1 

        if (!this.simulated){
            console.log("Not simulated!")
            this.render();
        }
    }

    // Moves are of the form [subGame, place]
    possibleMoves() {
        if (this.forcedBoard != -1){
            let moves = this.subGames[this.forcedBoard].possibleMoves(this.player);
            return moves.map(move => [this.forcedBoard, move[1]]);
        }
        else{
            let moves = [];
            for (let i = 0; i < 9; i++){
                if (this.subGames[i].winner() == 0){
                    for (let move of this.subGames[i].possibleMoves(this.player))
                        moves.push([i, move[1]]);
                }

            }
                    
            return moves;
        }
    }


    possibleFutures(moves){
        let possibleFutures = [];
        for (let move of moves){
            let future = this.clone();
            future.simulated = true;
            future.placeToken(move[0], move[1]);
            possibleFutures.push(future);
        }

        return possibleFutures;
    }


    render(){

        if (this.simulated)
            return;

        let allGames = document.getElementById('allGames');
        allGames.innerHTML = '';
        for (let [i, subGame] of this.subGames.entries())
            allGames.innerHTML += subGame.html(i == this.forcedBoard);


        if (this.winner() == 1){
            myAlert('X wins!');
        }
        else if (this.winner() == 2){
            myAlert('O wins!');
        }
        else if (this.winner() == 3){
            myAlert('Tie!');
        }
    }

    randomMove(){
        if (this.winner() != 0)
            return;

        let moves = this.possibleMoves();
        let move = moves[Math.floor(Math.random() * moves.length)];
        this.placeToken(move[0], move[1]);
    }

    randomMoves(n, interval=100){
        for (let i = 0; i < n; i++){
            setTimeout(this.randomMove.bind(this), i * interval);
        }
    }

    goodMove(){
        if (this.winner() != 0)
            return;

        let best = this.bestMove(4);
        this.placeToken(best[0], best[1]);
    }

    goodMoves(n, interval=100){
        for (let i = 0; i < n; i++){
            setTimeout(this.goodMove.bind(this), i * interval);
        }
    }


    /* 0 = TBD, 1 = X, 2 = O, 3 = tie */
    winner(){
        let wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let win of wins){
            if (this.subGames[win[0]].winner() == 1 && this.subGames[win[1]].winner() == 1 && this.subGames[win[2]].winner() == 1)
                return 1;
            else if (this.subGames[win[0]].winner() == 2 && this.subGames[win[1]].winner() == 2 && this.subGames[win[2]].winner() == 2)
                return 2;
        }
        if (this.subGames.some(g => g.winner() == 0))
            return 0;
        else
            return 3;
    }



    // Alpha-beta pruning added to MiniMax to improve efficiency
    eval(depth, alpha, beta) {
        console.log(`eval: ${depth}`);

        if (this.winner() != 0)
            return this.winner() == 1 ? 1 : this.winner() == 2 ? -1 : 0;

        if (depth == 0) {
            let statuses = this.subGames.filter(g => g.winner() != 0).map(g => g.winner() == 1 ? 1 : g.winner() == 2 ? -1 : 0);
            let score = statuses.reduce((a, b) => a + b, 0);
            return score / 10;  // Scale the score to be less significant than a win
        }

        let moves = this.possibleMoves();
        let futures = this.possibleFutures(moves);

        if (this.player == 'X') {
            let maxScore = -Infinity;
            for (let game of futures) {
                let score = game.eval(depth - 1, alpha, beta);
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) {
                    break;  // Beta cut-off
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (let game of futures) {
                let score = game.eval(depth - 1, alpha, beta);
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    break;  // Alpha cut-off
                }
            }
            return minScore;
        }
    }

    // Uses alpha-beta pruning
    scoreMoves(depth) {
        if (this.winner() != 0)
            return null;

        let moves = this.possibleMoves();
        let scores = [];
        let bestScore = (this.player == 'X') ? -Infinity : Infinity;

        for (let move of moves) {
            let game = this.clone();
            game.simulated = true;
            game.placeToken(...move);

            let score = game.eval(depth - 1, -Infinity, Infinity);
            scores.push(score);

            if (this.player == 'X') {
                bestScore = Math.max(bestScore, score);
            } else {
                bestScore = Math.min(bestScore, score);
            }
        }

        // Return moves paired with scores sorted by score
        return moves.map((move, i) => [move, scores[i]]).sort((a, b) => b[1] - a[1]);
    }


    bestMove(depth){
        if (this.player == 'X'){
            let bestScore = Math.max(...this.scoreMoves(depth).map(x => x[1]));
            let bestMoves = this.scoreMoves(depth).filter(x => x[1] == bestScore);
            return bestMoves[Math.floor(Math.random() * bestMoves.length)][0];
        }

        let bestScore = Math.min(...this.scoreMoves(depth).map(x => x[1]));
        let bestMoves = this.scoreMoves(depth).filter(x => x[1] == bestScore);
        return bestMoves[Math.floor(Math.random() * bestMoves.length)][0];
    }


}