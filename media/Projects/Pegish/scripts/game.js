import { Cannon } from './cannon.js';
import { Peg } from './peg.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.loadGameVariables();
    }

    loadGameVariables() {
        fetch('gameVariables.json')
            .then(response => response.json())
            .then(data => {
                this.variables = data;
                this.init();
            });
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.playArea = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };

        // Pass play area dimensions to other components
        this.cannon = new Cannon(this.canvas, this.playArea);
        this.pegs = Peg.generateLevel(this.canvas, 20, this.playArea);
    }

    start() {
        // Start the game loop here
    }
}