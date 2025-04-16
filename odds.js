// Para obtener el valor de una carta
function obtenerValorCarta(card, totalActual) {
    if(["K", "Q", "J"].includes(card.num)) return 10;
    if(card.num === "A") {
        return totalActual + 11 <= 21 ? 11 : 1;
    }
    return parseInt(card.num);
}

// Para obtener el valor de la mano del jugador
function manoTotal(hand) {
    let total = 0;
    let aces = 0;
    
    for(let i = 0; i < hand.length; i++) {
        if(["K", "Q", "J"].includes(hand[i].num)){
            total += 10;
        } else if (hand[i].num === "A") {
            total += 11;
            aces++;
        } else {
            total += parseInt(hand[i].num);
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
}

// Función para actualizar las estadísticas de probabilidad en el DOM
function actualizarEstadisticas() {
    const dataContainer = document.getElementById('data-container');
    const calcDiv = document.querySelector('.calcs');
    
    if (!calcDiv || !session || session.gameState !== 'playing') return;
    
    const probabilidades = calcProbabilidades();
    
    if (!probabilidades) {
        calcDiv.innerHTML = "<p>No hay datos disponibles o no puedes pedir más cartas.</p>";
        return;
    }
    
    let html = `
        <div class="stats-container">
            <div class="probability-section">
                <h2>Probabilidades para tu próxima carta</h2>
                <p>Tu puntaje actual: <strong>${session.player.score}</strong></p>
                
                <div class="card-probabilities">
                    <div class="card-section winner">
                        <h3>Cartas ganadoras (te llevan a 21)</h3>
                        <div class="card-list">`;
    
    // Mostrar cartas ganadoras
    let hayGanadoras = false;
    for (let num in probabilidades.cartasGanadoras) {
        hayGanadoras = true;
        const prob = probabilidades.cartasGanadoras[num];
        html += `
            <div class="prob-card winner">
                <div class="card-value">${num}</div>
                <div class="probability">${prob}%</div>
            </div>`;
    }
    
    if (!hayGanadoras) {
        html += `<p class="no-cards">No hay cartas que te lleven exactamente a 21</p>`;
    }
    
    html += `</div>
            </div>
            
            <div class="card-section safe">
                <h3>Cartas seguras (no te hacen perder)</h3>
                <div class="card-list">`;
    
    // Mostrar cartas seguras
    let haySeguras = false;
    for (let num in probabilidades.cartasSeguras) {
        haySeguras = true;
        const prob = probabilidades.cartasSeguras[num];
        html += `
            <div class="prob-card safe">
                <div class="card-value">${num}</div>
                <div class="probability">${prob}%</div>
            </div>`;
    }
    
    if (!haySeguras) {
        html += `<p class="no-cards">No hay cartas seguras disponibles</p>`;
    }
    
    html += `</div>
            </div>
            
            <div class="probability-summary">
                <div class="total-prob">
                    <p>Probabilidad de ganar inmediatamente: <strong>${probabilidades.probGanar}%</strong></p>
                    <p>Probabilidad de seguir jugando: <strong>${probabilidades.probSegura}%</strong></p>
                    <p>Probabilidad de perder: <strong>${probabilidades.probPerder}%</strong></p>
                </div>
            </div>
        </div>
        
        <div class="money-info">
            <h2>Información de pagos</h2>
            <p>Blackjack (21 con 2 cartas): <strong>3:2</strong></p>
            <p>Victoria normal: <strong>2:1</strong></p>
            <p>Tu saldo actual: <strong>$${session.balance}</strong></p>
            <p>Apuesta actual: <strong>$${session.currentBet}</strong></p>
            <p>Posible ganancia (blackjack): <strong>$${Math.floor(session.currentBet * 1.5)}</strong></p>
            <p>Posible ganancia (normal): <strong>$${session.currentBet}</strong></p>
        </div>`;
    
    calcDiv.innerHTML = html;
}

// Función principal para calcular las probabilidades
function calcProbabilidades() {
    if (!session || !session.player || !session.dealer) {
        return null;
    }
    
    const playerScore = session.player.score;
    
    if (playerScore >= 21) {
        return null; // No se pueden pedir más cartas
    }
    
    // Reunir las cartas ya usadas
    let cartasEnJuego = [...session.player.cards, ...session.dealer.cards];
    let cartasRestantes = [];
    
    // Quitando del mazo las cartas ya usadas
    for (let i = 0; i < session.deck.cards.length; i++) {
        let estaEnJuego = false;
        for (let j = 0; j < cartasEnJuego.length; j++) {
            if (session.deck.cards[i].num === cartasEnJuego[j].num && 
                session.deck.cards[i].suit === cartasEnJuego[j].suit) {
                estaEnJuego = true;
                break;
            }
        }
        
        if (!estaEnJuego) {
            cartasRestantes.push(session.deck.cards[i]);
        }
    }
    
    let totalCartas = cartasRestantes.length;
    let cartasSeguras = {};
    let cartasGanadoras = {};
    let contadorGanadoras = 0;
    let contadorSeguras = 0;
    
    // Analizar cada carta restante
    for (let i = 0; i < cartasRestantes.length; i++) {
        let carta = cartasRestantes[i];
        let valor = obtenerValorCarta(carta, playerScore);
        let nuevoTotal = playerScore + valor;
        
        if (nuevoTotal === 21) {
            contadorGanadoras++;
            if (!cartasGanadoras[carta.num]) {
                cartasGanadoras[carta.num] = 1;
            } else {
                cartasGanadoras[carta.num]++;
            }
        } else if (nuevoTotal < 21) {
            contadorSeguras++;
            if (!cartasSeguras[carta.num]) {
                cartasSeguras[carta.num] = 1;
            } else {
                cartasSeguras[carta.num]++;
            }
        }
    }
    
    // Calcular porcentajes
    for (let num in cartasGanadoras) {
        cartasGanadoras[num] = ((cartasGanadoras[num] / totalCartas) * 100).toFixed(2);
    }
    
    for (let num in cartasSeguras) {
        cartasSeguras[num] = ((cartasSeguras[num] / totalCartas) * 100).toFixed(2);
    }
    
    // Probabilidades generales
    const probGanar = ((contadorGanadoras / totalCartas) * 100).toFixed(2);
    const probSegura = ((contadorSeguras / totalCartas) * 100).toFixed(2);
    const probPerder = (100 - parseFloat(probGanar) - parseFloat(probSegura)).toFixed(2);
    
    return {
        cartasGanadoras,
        cartasSeguras,
        probGanar,
        probSegura,
        probPerder,
        totalCartas
    };
}

// Eventos para actualizar las estadísticas
document.addEventListener('DOMContentLoaded', function() {
    // Buscar los botones una vez que el DOM esté cargado
    const hitButton = document.getElementById('hit-btn');
    const standButton = document.getElementById('stand-btn');
    const startButton = document.getElementById('start-btn');
    
    if (hitButton) {
        hitButton.addEventListener('click', function() {
            setTimeout(actualizarEstadisticas, 100); // Dar tiempo para que se actualice el estado del juego
        });
    }
    
    if (standButton) {
        standButton.addEventListener('click', function() {
            setTimeout(actualizarEstadisticas, 100);
        });
    }
    
    if (startButton) {
        startButton.addEventListener('click', function() {
            setTimeout(actualizarEstadisticas, 100);
        });
    }
});