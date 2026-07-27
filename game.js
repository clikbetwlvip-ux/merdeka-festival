"use strict";

/*
    File ini nanti digunakan untuk:

    - Logika mini-game
    - Sistem skor
    - Sistem poin
    - Timer permainan
    - Hasil menang atau kalah
    - Efek permainan

    Untuk tahap pertama, file ini belum memiliki
    permainan aktif.
*/

const GameManager = {
    currentGame: null,

    start(gameId) {
        this.currentGame = gameId;

        console.log(`Game dimulai: ${gameId}`);
    },

    stop() {
        console.log("Game dihentikan.");

        this.currentGame = null;
    }
};
