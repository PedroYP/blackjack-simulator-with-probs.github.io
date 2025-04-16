class Hand{
    constructor(cards){
        this.cards = []; //Las cartas que tiene el usuario/dealer
        this.score = 0;
        this.hasAce = false; // Indica si la mano tiene un As
    }

    calculateScore(){
        let score = 0;
        let aceCount = 0;

        this.cards.forEach(card => {
            if(card.num == 'A'){
                aceCount++;
                score+=11; //Si es As se le suma 11, su propiedad especial se tratará en el sig while
            }else if(['J','Q','K'].includes(card.num)){
                score+=10;
            }else{
                score+=parseInt(card.num)
            }
        });

        //Aquí vienen las correcciones en caso se haya pasado de 21 y hayan aces:

        while(score > 21 && aceCount > 0){
            score-=10;
            aceCount--;
        }

        this.hasAce = aceCount>0;
        this.score = score;
        return score;
    }

    //Agregar una carta
    addCard(card){
        this.cards.push(card);
        this.calculateScore();
    }

    //Vacía la mano
    clear(){
    this.cards = [];
    this.score = 0;
    this.hasAce = false;
    }

    //Ver si saco un BJ a la primera
    isBlackjack(){
        return this.cards.length === 2 && this.score === 21;
    }
    
    //Verificar si ya se pasó
    isBusted(){
        return this.score > 21;
    }
}

class Card{
    constructor(num, suit, symbol){
        this.num = num;
        this.suit = suit;
        this.symbol = symbol;
    };


    render(side) { //Esto es para crear la img de la carta en el DOM
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        
        //Asignar color de acuerdo al palo
        const color = this.suit === "hearts" || this.suit === "diamonds" ? "red": "black";
        
        cardElement.style.color = color;
        
        cardElement.innerHTML = `
            <div class="card-top">
                <span class="card-value">${this.num}</span>
                <span class="card-suit">${this.symbol}</span>
            </div>
            <div class="card-center">
                <span class="card-suit-big">${this.symbol}</span>
            </div>
            <div class="card-bottom">
                <span class="card-value">${this.num}</span>
                <span class="card-suit">${this.symbol}</span>
            </div>
        `;
        
        side.appendChild(cardElement);
    }

}

class Maze{
    constructor(){
        this.cards = [];
        this.createDeck();
        this.shuffle();
    }
    shuffle() {
        for(let i = 0; i < this.cards.length;i++){
            const j = Math.floor(Math.random() * this.cards.length);
            let temp = this.cards[i];
            this.cards[i] = this.cards[j];
            this.cards[j] = temp;
        }
    }

    createDeck(){
        //Generar mazo
        suits.forEach(suit => {
            values.forEach(val => {
                this.cards.push(new Card(val, suit, symbols[suit]));
            })
        })
    }

}

const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const symbols = {hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'};
const suits = ["hearts", "diamonds", "clubs", "spades"];

let user = new Hand();
let dealer = new Hand();
let deck = new Maze();

const dealerCards = document.getElementById("dealer-cards");
const userCards = document.getElementById("user-cards");
const startButton = document.getElementById("start-btn");

const betControls = document.getElementById('bet-controls');
const gameControls = document.getElementById("game-controls");

const betDecrease = document.getElementById("bet-decrease");
const betIncrease = document.getElementById("bet-increase");
const betAmount = document.getElementById("bet-amount");
const walletAmount = document.getElementById("wallet-amount");
const continueOpt = document.getElementById("continue-opt")


const infoDealerScore = document.getElementById("dealer-score");
const infoUserScore = document.getElementById("player-score");
const infoBanner = document.getElementById("message")

const gameOver = document.getElementById("game-over");
const restartButton = document.getElementById("restart-btn");

class Game{
    constructor(){
        this.player = new Hand();
        this.dealer = new Hand();
        this.deck = new Maze();
        this.balance = 100; // Saldo inicial
        this.currentBet = 5; // Apuesta inicial
        this.gameState = "idle"; // Estado del juego: idle, playing, endturn
    
        this.startGame();
        walletAmount.innerHTML = this.balance;
    }

    startGame(){
        this.betControlsLimit();
        document.getElementById("restart-btn").addEventListener("click", () => this.restartGame());
        document.getElementById("hit-btn").addEventListener("click", () => this.hit(userCards));
        document.getElementById("stand-btn").addEventListener("click", () => this.stand());
        startButton.addEventListener("click", ()=>{

            if(this.gameState = "idle"){
                this.clearCardArea();
                this.gameState = "playing";
                this.updateUI("playing");
                walletAmount.innerHTML = this.balance;
            }
            this.hit(userCards);
            this.hit(userCards);
            this.hit(dealerCards);

            setTimeout(actualizarEstadisticas, 100);

            console.log(this.player.cards);
            console.log(this.dealer.cards);
            console.log(this.deck.cards);


            if(this.gameState == "playing"){
                this.displayGameControls(); //esto generá un bug horrible: acumulacion de listeners
            }
            

        });//startButton->click

        betDecrease.addEventListener("click", ()=>{
            console.log(betAmount);
            this.currentBet -= 5;
            betAmount.innerHTML = this.currentBet;
            this.betControlsLimit();
        });

        betIncrease.addEventListener("click", ()=>{
            console.log(betAmount);
            this.currentBet += 5;
            betAmount.innerHTML = this.currentBet;
            this.betControlsLimit();
        });

        continueOpt.addEventListener("click", ()=>{ //Solo de aquí se vuelve a IDLE (zona apuestas)
            this.gameState = "idle";
            this.updateUI("idle");
        });
    }


    hit(side){
        let cardTemp = this.deck.cards.pop(); //quitamos una carta del mazo
        console.log("EN HIT DE: ", cardTemp.value)

        if(side == userCards){
            this.player.cards.push(cardTemp);
            infoUserScore.innerHTML = this.player.calculateScore()
        }else if (side == dealerCards){
            this.dealer.cards.push(cardTemp);
            infoDealerScore.innerHTML = this.dealer.calculateScore()

        }else{
            alert("Ha cometido un error al usar hit, parametro no válido")
        }
        
        cardTemp.render(side);

        if(this.player.calculateScore()>21){
            infoBanner.innerHTML = "¡TE PASASTE! Has perdido :(";
            this.gameState = "endturn";
            this.updateBalance("lose");//importante que vaya antes
            this.updateUI("endturn");
            //EJECUTAR FUNCIÓN DE REINICIO
        }

        if(this.player.isBlackjack()){
            if(this.dealer.calculateScore==11){
                this.hit(dealerCards);
                if(this.dealer.isBlackjack()){
                    infoBanner.innerHTML = "¡HAS HECHO BLACKJACK! Pero el dealer también... ¡Empate!";
                    this.updateBalance("draw");
                }
            }else{
                infoBanner.innerHTML = "¡HAS HECHO BLACKJACK! El dealer no tiene As... ¡Ganas automáticamente! 🦷";
                this.updateBalance("win");
            }
            this.gameState = "endturn";
            this.updateUI("endturn");
        }
    }

    //El flujo una vez el jugador decide detenerse
    stand(){
        this.dealerTurn();
        this.handComparison();
        this.gameState = "endturn";
        this.updateUI("endturn");
    }

    dealerTurn(){
        while(this.dealer.calculateScore()<17){ //El dealer pide hasta tener 17ptos o más
            console.log(this.dealer.calculateScore);
            this.hit(dealerCards);
        }//(this.dealer.calculateScore()<17)
    }

    handComparison(){
        if(this.dealer.calculateScore()>21){
            infoBanner.innerHTML = "¡EL DEALER SE PASÓ! Has ganado :)";
            this.updateBalance("win");
        }else if(this.dealer.calculateScore()==this.player.calculateScore()){
            console.log("dealer: ", this.dealer.calculateScore());
            console.log("player: ", this.player.calculateScore());

            //alert("Empate");
            infoBanner.innerHTML= "Han empatado";
            this.updateBalance("draw");
        }else if(this.dealer.calculateScore() < this.player.calculateScore()){
            //alert("GANAS!");
            infoBanner.innerHTML = "¡Has ganado!";
            this.updateBalance("win");
        }else{
            //alert("PIERDES!");
            infoBanner.innerHTML = "¡Has perdido!";
            this.updateBalance("lose");
        }
    }

    // Muestra controles durante el juego
    displayGameControls() {
        
        betControls.classList.add("hidden");
        gameControls.classList.remove("hidden");

    }

    //Funcion auxiliar solo para startGame()
    betControlsLimit(){
        if(parseInt(betAmount.innerHTML)<=5){
            betDecrease.disabled = true;
        }else{
            betDecrease.disabled = false;
        }
        if(parseInt(betAmount.innerHTML)>=this.balance){
            betIncrease.disabled = true;
        }else{
            betIncrease.disabled = false;
        }
    }


    updateBalance(status){
        if(status == "win"){
            // Si es blackjack (21 con 2 cartas) paga 3:2
            if(this.player.isBlackjack()){
                this.balance += Math.floor(this.currentBet * 1.5);
            } else {
                // Victoria normal paga 1:1 (tu apuesta)
                this.balance += this.currentBet;
            }
        }else if(status == "draw"){
            // En empate no hay cambios
        }else{
            // En derrota se pierde la apuesta
            this.balance -= this.currentBet;
        }
        walletAmount.innerHTML = this.balance;
        
        // Actualizar las estadísticas cuando cambia el balance
        if (typeof actualizarEstadisticas === 'function') {
            setTimeout(actualizarEstadisticas, 100);
        }
    }

    updateUI(status){ //Se entiendo como: actualiza AL estado que te paso como parámetro
        switch(status){
            case "endturn":
                if(this.balance>0){
                    betControls.classList.add("hidden");
                    gameControls.classList.add("hidden");
                    continueOpt.classList.remove("hidden");
                }else{
                    gameOver.classList.remove("hidden");
                }
                break;
            
            case "idle":
                this.currentBet = 5;
                betAmount.innerHTML = this.currentBet;
                this.player.clear(); //reiniciar la mano del jugador
                infoUserScore.innerHTML = "";
                userCards.innerHTML = "Tus cartas aparecerán aquí...";

                this.dealer.clear(); //reiniciar la mano del dealer
                infoDealerScore.innerHTML = "";
                dealerCards.innerHTML = "Las cartas del dealer aparecerán aquí...";

                infoBanner.innerHTML = "Elige tu apuesta y vamos... ¡Sin miedo al éxito!"

                continueOpt.classList.add("hidden");
                betControls.classList.remove("hidden");
                gameControls.classList.add("hidden");

                this.betControlsLimit();

                break;
            case "playing":
                infoBanner.innerHTML = "Tu turno. ¿Pedir o Plantarse?"
                break;

        }
        walletAmount.innerHTML = this.balance;
        if(this.deck.cards.length<=13){
            console.log("Hay muy pocas cartas. Se reinicia el mazo")
            this.deck.cards = [];
            this.deck.createDeck();
            this.deck.shuffle();
        }
    }


    restartGame(){
        this.player = new Hand();
        this.dealer = new Hand();
        this.deck = new Maze();
        this.balance = 100; // Saldo inicial
        this.currentBet = 5; // Apuesta inicial
        this.gameState = "idle"; // Estado del juego: idle, playing, endturn
    
        walletAmount.innerHTML = this.balance;
        this.updateUI("idle");

        gameOver.classList.add("hidden");


    }


    clearCardArea(){
        userCards.innerHTML='';
        dealerCards.innerHTML='';
    }
}

const session = new Game();
console.log(session.player.cards);
console.log(session.dealer.cards);

