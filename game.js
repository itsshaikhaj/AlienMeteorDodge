// Initialize game assets and canvas
const alienImage = new Image();
alienImage.src = 'alien.jpg'; // Adjust the path as necessary

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');

// Game variables
let alien, meteors, score, gameOver, baseSpeed;
let slowEffect, magnetEffect, speedBoostEffect, shielded;
let slowEffectTime = 0;
let magnetEffectTime = 0;
let speedBoostEffectTime = 0;
let specialMeteorCooldown = 0; // Cooldown for special meteors

// Initialize alien object with adjusted size
alien = {
    x: canvas.width / 2 - 45,
    y: canvas.height - 60,
    width: 120,
    height: 120,
    dx: 0,
    speed: 5
};

// Draw the alien ship
function drawShip() {
    ctx.fillStyle = 'blue'; // Color for the ship
    ctx.beginPath();
    ctx.moveTo(alien.x + alien.width / 2, alien.y); // Ship top
    ctx.lineTo(alien.x, alien.y + alien.height); // Ship left
    ctx.lineTo(alien.x + alien.width, alien.y + alien.height); // Ship right
    ctx.closePath();
    ctx.fill();
}

// Star class for decorative effects
class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2; // Random size
        this.alpha = 1; // Initial opacity
        this.dy = Math.random() * -2 - 1; // Fall speed
    }

    // Update star position and opacity
    update() {
        this.y += this.dy; // Move up
        this.alpha -= 0.01; // Fade out
    }

    // Draw the star on canvas
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`; // White color with alpha
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Array to hold stars
let stars = [];

// Reset the game variables
function resetGame() {
    alien = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 40,
        width: 30,
        height: 30,
        dx: 0,
        speed: 5
    };

    meteors = [];
    score = 0;
    baseSpeed = 1; // Initial meteor speed
    gameOver = false;
    slowEffect = false;
    magnetEffect = false;
    speedBoostEffect = false; // Speed boost effect
    shielded = false; // Shield status

    // Reset effect timers
    slowEffectTime = 0;
    magnetEffectTime = 0;
    speedBoostEffectTime = 0; // Track speed boost time
    specialMeteorCooldown = 0; // Reset cooldown

    // Create initial meteors
    for (let i = 0; i < 5; i++) {
        createMeteor();
    }

    restartButton.style.display = 'none'; // Hide the restart button
    update(); // Start the game loop
}

// Draw the alien on the canvas
function drawAlien() {
    ctx.drawImage(alienImage, alien.x, alien.y, alien.width, alien.height);
    if (shielded) {
        // Generate stars around the alien when shielded
        if (Math.random() < 0.5) { // Control frequency of star generation
            stars.push(new Star(alien.x + alien.width / 2, alien.y + alien.height / 2));
        }
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        stars = stars.filter(star => star.alpha > 0); // Remove faded stars
    }
}

// Adjust meteor speed based on score
function adjustMeteorSpeed() {
    if (score < 100) {
        baseSpeed = 1; // Very smooth at the start
    } else if (score < 200) {
        baseSpeed = 2;
    } else if (score < 300) {
        baseSpeed = 3;
    } else if (score < 400) {
        baseSpeed = 4;
    } else if (score < 500) {
        baseSpeed = 5;
    } else {
        baseSpeed = 6;
    }
}

// Create a new meteor
function createMeteor() {
    // Check if special meteor cooldown is active
    if (specialMeteorCooldown > 0) {
        let meteor = createNormalMeteor();
        meteors.push(meteor);
        return;
    }

    adjustMeteorSpeed(); // Update speed based on score
    let meteor = createNormalMeteor();

    // Introduce special meteors after score of 100
    if (score > 100) {
        let specialChance = Math.random();
        if (specialChance < 0.05 && !slowEffect) {
            meteor = createSpecialMeteor('slow');
        } else if (specialChance < 0.10 && !magnetEffect) {
            meteor = createSpecialMeteor('magnet');
        } else if (specialChance < 0.15 && !speedBoostEffect) {
            meteor = createSpecialMeteor('speedBoost');
        }
    }

    meteors.push(meteor);
}

// Create a normal meteor
function createNormalMeteor() {
    return {
        x: Math.random() * (canvas.width - 30),
        y: 0,
        radius: 10 + Math.random() * 20,
        dy: baseSpeed + Math.random() * 2,
        isCollectible: Math.random() > 0.5,
        isSpecial: false,
        type: null
    };
}

// Create a special meteor based on type
function createSpecialMeteor(type) {
    specialMeteorCooldown = 200; // Set cooldown for special meteors
    return {
        x: Math.random() * (canvas.width - 30),
        y: 0,
        radius: 35,
        dy: baseSpeed,
        isCollectible: false,
        isSpecial: true,
        type: type
    };
}

// Draw meteors on the canvas
function drawMeteors() {
    meteors.forEach(meteor => {
        ctx.fillStyle = meteor.isSpecial ? getMeteorColor(meteor.type) : (meteor.isCollectible ? 'green' : 'red');
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw speed boost symbol inside the meteor
        if (meteor.type === 'speedBoost') {
            ctx.fillStyle = 'white'; // Draw a speed symbol inside
            ctx.font = '15px Arial';
            ctx.fillText('⚡', meteor.x - 10, meteor.y + 5); // Flash icon
        }
    });
}

// Get color based on meteor type
function getMeteorColor(type) {
    switch (type) {
        case 'slow':
            return 'blue';
        case 'magnet':
            return 'purple';
        case 'speedBoost':
            return 'orange';
        default:
            return 'red'; // Default color for normal meteors
    }
}

// Move meteors down the canvas
function moveMeteors() {
    meteors.forEach(meteor => {
        meteor.y += slowEffect ? meteor.dy / 2 : meteor.dy; // Adjust speed if slow effect is active

        if (meteor.y > canvas.height) {
            meteors.splice(meteors.indexOf(meteor), 1); // Remove off-screen meteor
            createMeteor(); // Create a new meteor
        }
    });

    while (meteors.length < 5) {
        createMeteor(); // Ensure at least 5 meteors are on screen
    }
}

// Move the alien based on user input
function moveAlien() {
    alien.x += alien.dx;

    // Prevent alien from going out of bounds
    if (alien.x < 0) alien.x = 0;
    if (alien.x + alien.width > canvas.width) alien.x = canvas.width - alien.width;
}

// Handle key presses for alien movement
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        alien.dx = alien.speed; // Move right
    } else if (e.key === 'ArrowLeft') {
        alien.dx = -alien.speed; // Move left
    }
});

document.addEventListener('keyup', () => {
    alien.dx = 0; // Stop moving
});

// Detect collisions between the alien and meteors
function detectCollisions() {
    meteors.forEach(meteor => {
        const distX = alien.x + alien.width / 2 - meteor.x;
        const distY = alien.y + alien.height / 2 - meteor.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < meteor.radius + alien.width / 2) {
            handleCollision(meteor);
        }
    });
}

// Handle collision logic
function handleCollision(meteor) {
    if (meteor.isSpecial) {
        switch (meteor.type) {
            case 'slow':
                slowEffect = true;
                slowEffectTime = 10 * 60; // Slow for 10 seconds
                break;
            case 'magnet':
                magnetEffect = true;
                magnetEffectTime = 10 * 60; // Magnet for 10 seconds
                slowEffect = false; // Disable slow effect
                break;
            case 'speedBoost':
                speedBoostEffect = true; // Activate speed boost
                speedBoostEffectTime = 15 * 60; // Speed boost for 15 seconds
                shielded = true; // Activate shield
                break;
        }
        meteors.splice(meteors.indexOf(meteor), 1); // Remove special meteor
    } else if (meteor.isCollectible) {
        score += 10; // Increase score for collecting meteors
        meteors.splice(meteors.indexOf(meteor), 1);
        createMeteor(); // Create new meteor
    } else {
        // Check for collisions with red meteors only if not shielded
        if (!shielded) {
            gameOver = true; // Hitting a red meteor ends the game
        }
    }
}

// Update effect timers for slow, magnet, and speed boost effects
function updateEffects() {
    if (slowEffectTime > 0) {
        slowEffectTime--;
    } else {
        slowEffect = false; // Reset slow effect
    }

    if (magnetEffectTime > 0) {
        magnetEffectTime--;
    } else {
        magnetEffect = false; // Reset magnet effect
    }

    if (speedBoostEffectTime > 0) {
        speedBoostEffectTime--;
    } else {
        speedBoostEffect = false; // Reset speed boost effect
        shielded = false; // Remove shield after speed boost ends
    }
}

// Attract meteors towards the alien when magnet effect is active
function attractMeteors() {
    if (magnetEffect) {
        meteors.forEach(meteor => {
            // Only attract collectible meteors
            if (meteor.isCollectible) {
                const distX = alien.x + alien.width / 2 - meteor.x;
                const distY = alien.y + alien.height / 2 - meteor.y;
                const distance = Math.sqrt(distX * distX + distY * distY);
                const attractionForce = 2;

                // Move meteor towards alien
                if (distance > 5) {
                    meteor.x += (distX / distance) * attractionForce;
                    meteor.y += (distY / distance) * attractionForce;
                } else {
                    meteor.x = alien.x + alien.width / 2;
                    meteor.y = alien.y + alien.height / 2;
                }
            }
        });
    }
}

// Main game loop
function update() {
    if (gameOver) {
        // Show game over message
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
        ctx.fillText('Score: ' + score, canvas.width / 2 - 60, canvas.height / 2 + 40);
        restartButton.style.display = 'block'; // Show the restart button
        return;
    }

    // Clear the canvas for redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update effects and draw game objects
    updateEffects();
    drawAlien();
    moveAlien();
    drawMeteors();
    moveMeteors();
    detectCollisions();
    attractMeteors();

    // Adjust speed based on boost effect
    if (speedBoostEffect) {
        baseSpeed = 10; // Increase speed significantly during boost
    } else {
        adjustMeteorSpeed(); // Reset to normal speed if no boost
    }

    // Update special meteor cooldown
    if (specialMeteorCooldown > 0) {
        specialMeteorCooldown--;
    }

    // Display score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(update); // Call update for the next frame
}

// Restart the game when the button is clicked
restartButton.addEventListener('click', resetGame);

// Start the game
resetGame();
