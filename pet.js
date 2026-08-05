// ═══════════════════════════════════════════════
//  PIXEL PET WIDGET LOGIC
// ═══════════════════════════════════════════════

(() => {
    // ── State ──
    const petState = {
        hunger: 30, // Empieza con hambre (estaba en 80)
        happy: 80,
        energy: 80,
        animation: 'idle', // idle | walk | sit | sleep | eat | play | pet | jump
        frame: 0,
        facing: -1, // -1 = left, 1 = right
        busy: false
    };

    // ── DOM Refs ──
    const widget = document.getElementById('pet-widget');
    const header = document.getElementById('pet-widget-toggle');
    const body = document.getElementById('pet-widget-body');
    const canvas = document.getElementById('pet-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const hungerFill = document.getElementById('pet-hunger');
    const happyFill = document.getElementById('pet-happy');
    const energyFill = document.getElementById('pet-energy');
    const moodIcon = document.getElementById('pet-mood-icon');
    const speechBubble = document.getElementById('pet-speech');
    const stage = document.getElementById('pet-stage');

    if (!canvas || !ctx) return; // Fail gracefully if not found

    // Scale for crisp pixels
    canvas.style.width = '128px';
    canvas.style.height = '128px';

    // ── Color Palette ──
    const C = {
        body:     '#c78651',
        belly:    '#f0d5a8',
        ear:      '#8b5631',
        nose:     '#2a2a2a',
        eye:      '#1a1a1a',
        eyeWhite: '#ffffff',
        tongue:   '#e94560',
        collar:   '#e94560',
        collarTag:'#f4a51c',
        tail:     '#c78651',
        paw:      '#f0d5a8',
        blush:    'rgba(233,69,96,0.3)',
        zzz:      '#4cc9f0',
        sparkle:  '#f4a51c',
    };
    const P = 4; // Pixel scale

    const drawPx = (x, y, color) => { ctx.fillStyle = color; ctx.fillRect(x * P, y * P, P, P); };
    const drawRect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x * P, y * P, w * P, h * P); };

    // ── Drawing Functions ──
    function drawDogIdle(frame) {
        const breathe = frame % 2 === 0 ? 0 : -1;
        drawRect(4, 8 + breathe, 8, 5, C.body);
        drawRect(5, 9 + breathe, 6, 3, C.belly);
        drawRect(3, 3 + breathe, 7, 5, C.body);
        drawRect(4, 5 + breathe, 5, 3, C.belly);
        drawRect(2, 1 + breathe, 2, 3, C.ear); drawRect(9, 1 + breathe, 2, 3, C.ear);
        drawPx(5, 4 + breathe, C.eyeWhite); drawPx(8, 4 + breathe, C.eyeWhite);
        drawPx(5, 5 + breathe, C.eye); drawPx(8, 5 + breathe, C.eye);
        drawPx(7, 6 + breathe, C.nose);
        if (frame % 4 < 2) drawPx(7, 7 + breathe, C.tongue);
        drawPx(4, 6 + breathe, C.blush); drawPx(9, 6 + breathe, C.blush);
        drawRect(4, 8 + breathe, 6, 1, C.collar); drawPx(7, 8 + breathe, C.collarTag);
        drawRect(4, 13, 2, 2, C.body); drawRect(10, 13, 2, 2, C.body);
        drawRect(4, 15, 2, 1, C.paw); drawRect(10, 15, 2, 1, C.paw);
        const t = frame % 2 === 0 ? 0 : 1; drawPx(12 + t, 8 + breathe, C.tail); drawPx(13 + t, 7 + breathe, C.tail);
    }

    function drawDogJump(frame) {
        const y = -3;
        drawRect(4, 8 + y, 8, 5, C.body);
        drawRect(5, 9 + y, 6, 3, C.belly);
        drawRect(3, 3 + y, 7, 5, C.body);
        drawRect(4, 5 + y, 5, 3, C.belly);
        drawRect(2, 0 + y, 2, 3, C.ear); drawRect(9, 0 + y, 2, 3, C.ear);
        drawPx(5, 4 + y, C.eye); drawPx(6, 3 + y, C.eye);
        drawPx(8, 4 + y, C.eye); drawPx(9, 3 + y, C.eye);
        drawPx(7, 6 + y, C.nose); drawRect(6, 7 + y, 2, 1, C.tongue);
        drawRect(4, 8 + y, 6, 1, C.collar);
        drawRect(3, 13, 2, 3, C.body); drawRect(11, 13, 2, 3, C.body);
        drawRect(4, 15, 2, 1, C.paw); drawRect(10, 15, 2, 1, C.paw);
        drawPx(12, 7 + y, C.tail); drawPx(13, 6 + y, C.tail);
        
        // Stars
        if (frame % 2 === 0) {
            drawPx(1, 2 + y, C.sparkle); drawPx(14, 3 + y, C.sparkle);
        }
    }

    function drawDogSleep(frame) {
        drawRect(2, 12, 12, 3, C.body); drawRect(3, 13, 10, 1, C.belly);
        drawRect(2, 9, 6, 4, C.body); drawRect(3, 10, 4, 2, C.belly);
        drawRect(1, 9, 2, 2, C.ear); drawRect(7, 9, 2, 2, C.ear);
        drawRect(4, 10, 2, 1, C.eye); drawRect(6, 10, 1, 1, C.eye);
        drawPx(5, 11, C.nose);
        drawRect(2, 15, 2, 1, C.paw); drawRect(12, 15, 2, 1, C.paw);
        drawRect(13, 13, 2, 1, C.tail);
        const z = frame % 3;
        ctx.fillStyle = C.zzz; ctx.font = `${P * 2}px 'Press Start 2P'`;
        ctx.fillText('z', (10 + z) * P, (7 - z) * P);
    }
    
    function drawDogEat(frame) {
        drawDogIdle(0);
        drawRect(0, 14, 4, 2, '#6b7280'); drawRect(1, 13, 2, 1, '#6b7280');
        drawPx(1, 13, C.collarTag); drawPx(2, 13, C.collarTag);
        if (frame % 2 === 0) {
            drawRect(3, 5, 7, 5, C.body); drawRect(4, 7, 5, 3, C.belly);
            drawPx(5, 7, C.eye); drawPx(8, 7, C.eye); drawPx(7, 8, C.nose);
        }
    }

    const anims = { idle: drawDogIdle, jump: drawDogJump, sleep: drawDogSleep, eat: drawDogEat };

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        if (petState.facing === -1) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        (anims[petState.animation] || drawDogIdle)(petState.frame);
        ctx.restore();
    }

    // ── Logic ──
    let speechTimer = null;
    function speak(text, duration = 3000) {
        speechBubble.textContent = text;
        speechBubble.classList.add('visible');
        clearTimeout(speechTimer);
        speechTimer = setTimeout(() => speechBubble.classList.remove('visible'), duration);
    }

    function updateUI() {
        const clamp = v => Math.max(0, Math.min(100, v));
        petState.hunger = clamp(petState.hunger);
        petState.happy = clamp(petState.happy);
        petState.energy = clamp(petState.energy);
        
        hungerFill.style.width = petState.hunger + '%';
        happyFill.style.width = petState.happy + '%';
        energyFill.style.width = petState.energy + '%';
        
        hungerFill.classList.toggle('critical', petState.hunger < 20);
        happyFill.classList.toggle('critical', petState.happy < 20);
        energyFill.classList.toggle('critical', petState.energy < 20);

        if (petState.hunger < 20) moodIcon.textContent = '😫';
        else if (petState.energy < 20) moodIcon.textContent = '😴';
        else if (petState.happy < 20) moodIcon.textContent = '😢';
        else moodIcon.textContent = '😊';
    }

    function doAction(anim, text, dur, changes) {
        if (petState.busy) return;
        petState.busy = true;
        petState.animation = anim;
        petState.frame = 0;
        if (text) speak(text);
        
        setTimeout(() => {
            if (changes.h) petState.hunger += changes.h;
            if (changes.ha) petState.happy += changes.ha;
            if (changes.e) petState.energy += changes.e;
            petState.animation = 'idle';
            petState.busy = false;
            updateUI();
        }, dur);
    }

    // ── Intercept Task App Events ──
    const originalPush = Array.prototype.push;
    // We hook into the global tasks array updates by wrapping localStorage setItem roughly, 
    // or listening to form submissions if possible. 
    // An easier way: monkey-patch the original functions if they were global, but they are scoped.
    // Instead, we will listen to DOM changes on the todo-list.
    
    const listObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.addedNodes.length > 0) {
                // Task added
                doAction('jump', '¡Nueva tarea! ¡Guau!', 2000, { ha: 10, e: -5 });
                widget.classList.add('celebrate');
                setTimeout(() => widget.classList.remove('celebrate'), 600);
            }
            if (m.removedNodes.length > 0) {
                // Task removed (might be deletion)
                doAction('eat', '¡Tarea eliminada! Ñam.', 1500, { h: 15, ha: 5 });
            }
        }
    });
    
    const todoList = document.getElementById('todo-list');
    if (todoList) {
        listObserver.observe(todoList, { childList: true });
        // Listen for completions via click on the list
        todoList.addEventListener('click', (e) => {
            if (e.target.matches('.todo-checkbox')) {
                if (e.target.checked) {
                    // Al completar tarea, el perro come y se llena
                    doAction('eat', '¡Qué rico! ¡Gracias!', 2500, { h: 25, ha: 10, e: 5 });
                    widget.classList.add('shake');
                    setTimeout(() => widget.classList.remove('shake'), 400);
                } else {
                    speak("Oh, aún no...", 2000);
                }
            }
        });
    }

    // Toggle widget collapse
    header.addEventListener('click', () => {
        body.classList.toggle('collapsed');
    });

    // Pet click interaction
    stage.addEventListener('click', (e) => {
        const heart = document.createElement('div');
        heart.className = 'pet-love-popup';
        heart.textContent = '❤️';
        heart.style.left = e.offsetX + 'px';
        heart.style.top = (e.offsetY - 10) + 'px';
        stage.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
        
        if (!petState.busy) {
            petState.happy += 5;
            updateUI();
            speak('¡Guau!', 1000);
        }
    });

    // Loop
    let lastTime = 0;
    function loop(t) {
        if (t - lastTime > 250) { // ~4fps
            lastTime = t;
            petState.frame++;
            render();
            
            // Passive drain (slowed down for widget, but hunger drains faster now)
            if (!petState.busy && petState.frame % 15 === 0) {
                petState.hunger -= 1.5;
                petState.happy -= 0.5;
                petState.energy -= 0.5;
                updateUI();
                
                if (petState.energy < 10) {
                    petState.animation = 'sleep';
                } else if (petState.animation === 'sleep' && petState.energy > 30) {
                    petState.animation = 'idle';
                }
            }
        }
        requestAnimationFrame(loop);
    }

    updateUI();
    requestAnimationFrame(loop);
    
    // Initial greeting
    setTimeout(() => {
        speak('¡Hola! Te ayudaré con tus tareas.');
    }, 1000);

})();
