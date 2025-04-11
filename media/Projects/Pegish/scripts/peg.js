export class Peg {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // blue, orange, purple, green
        this.radius = 10;
        this.value = this.getValue(); // Assign value based on type
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = this.getColor();
        context.fill();
        context.closePath();
    }

    getColor() {
        switch (this.type) {
            case 'blue': return 'blue';
            case 'orange': return 'orange';
            case 'purple': return 'purple';
            case 'green': return 'green';
        }
    }

    getValue() {
        switch (this.type) {
            case 'blue': return 10;
            case 'orange': return 100; // Orange pegs have no direct score value
            case 'purple': return 20;
            case 'green': return 200; // Green pegs have no direct score value
        }
    }

    static generateLevel(canvas, pegCount, playArea) {
        const pegs = [];
        const marginX = canvas.width * 0.05; // 5% margin on the x-axis
        const marginY = canvas.height * 0.1; // 10% margin on the y-axis

        for (let i = 0; i < pegCount; i++) {
            let x, y;
            let isOverlapping;

            do {
                x = Math.random() * (playArea.width - marginX * 2) + marginX;
                y = Math.random() * (playArea.height - marginY * 2) + marginY;

                // Check for overlap with existing pegs
                isOverlapping = pegs.some(peg => Math.hypot(peg.x - x, peg.y - y) < 20);
            } while (isOverlapping);

            const type = i < 2 ? 'green' : i < 4 ? 'purple' : i < Math.floor(pegCount * 0.2) + 4 ? 'orange' : 'blue';
            pegs.push(new Peg(x, y, type));
        }

        return pegs;
    }
}