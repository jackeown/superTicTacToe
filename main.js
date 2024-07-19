
function myAlert(message){
    document.querySelector('.alerts').innerHTML = message;
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
                html += `<div class="token empty" onclick="window.game.placeToken(${this.index}, ${i})"></div>`;
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

        if (!this.simulated){
            this.render();
        }
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

        if (!this.simulated)
            this.render();
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
        let allGames = document.getElementById('allGames');
        allGames.innerHTML = '';
        for (let [i, subGame] of this.subGames.entries())
            allGames.innerHTML += subGame.html(i == this.forcedBoard);

        if (this.simulated)
            return;

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

        let best = this.bestMove(3);
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



    // MiniMax search for the best move from the
    // current state of the board.
    // This should return an array of [score, move].
    // +1 is win for X, -1 is win for O, 0 is tie
    // (X is maximizer, O is minimizer)
    // This function is recursive.
    eval(depth){
        console.log(`eval: ${depth}`);

        if (this.winner() != 0)
            return this.winner() == 1 ? 1 : this.winner() == 2 ? -1 : 0;

        if (depth == 0){
            // who is winning the minigames?
            let statuses = this.subGames.filter(g => g.winner() != 0).map(g => g.winner() == 1 ? 1 : g.winner() == 2 ? -1 : 0);
            let score = statuses.reduce((a,b) => a + b, 0);
            return score / 10; // shouldn't be more important than actually winning...
        }

        let moves = this.possibleMoves();
        let futures = this.possibleFutures(moves);

        let scores = futures.map(function(game){
            return game.eval(depth - 1);
        });

        if (this.player == 'X'){
            return Math.max(...scores);
        }
        else{
            return Math.min(...scores);
        }
    }


    // Evals the states after
    // each move.
    bestMove(depth){

        // If there is a winner, just return null
        if (this.winner() != 0)
            return null; 

        let moves = this.possibleMoves();
        let futures = moves.map(function(move){
            let game = this.clone();
            let [subGame, place] = move;
            game.placeToken(subGame, place);

            return game;
        }.bind(this));

        let scores = futures.map(function(game){
            return game.eval(depth - 1);
        });

        if (this.player == 'X'){
            let bestMoves = moves.filter((move, i) => scores[i] == Math.max(...scores));
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        else{
            let bestMoves = moves.filter((move, i) => scores[i] == Math.min(...scores));
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
    }




}