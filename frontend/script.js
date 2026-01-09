
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particlesArray;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.directionX = (Math.random() * 0.4) - 0.2;
        this.directionY = (Math.random() * 0.4) - 0.2;
        this.size = Math.random() * 2;
        this.color = Math.random() > 0.5 ? '#00f3ff' : '#0066ff';
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 15000;
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                           ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width/7) * (canvas.height/7)) {
                opacityValue = 1 - (distance/20000);
                ctx.strokeStyle = 'rgba(0, 243, 255,' + opacityValue * 0.15 + ')';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

window.addEventListener('resize', function(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    init();
});

init();
animate(); // canvas animation 


const micBtn = document.getElementById('mic-btn');
const typeWriterElement = document.getElementById('typewriter');
const statusText = document.getElementById('status-text');
const interactionPanel = document.querySelector('.interaction-panel');

let isListening = false;
let typingTimer;
let hasError = false;


const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition; // for checking brower support


interactionPanel.addEventListener('click', function() {
    if (hasError || !SpeechRecognition || window.location.protocol === 'file:') {
        const manualCommands = [
            "Manual Override: Rerouting...", 
            "System Check: All systems nominal.", 
            "Cabin pressure stabilized.", 
            "Engaging Hyper-Drive..."
        ];
        const cmd = manualCommands[Math.floor(Math.random() * manualCommands.length)];
        
        statusText.innerText = "Manual";
        statusText.style.color = "var(--neon-purple)";
        typeWriter(cmd);
        
        setTimeout(() => {
            statusText.innerText = "Online";
            statusText.style.color = "var(--neon-cyan)";
            hasError = false; 
        }, 3000);
    }
});

// Helper function
function typeWriter(text, i = 0) {
    if (i === 0) {
        clearTimeout(typingTimer);
        typeWriterElement.innerText = "";
    }
    if (i < text.length) {
        typeWriterElement.innerHTML += text.charAt(i);
        typingTimer = setTimeout(() => typeWriter(text, i + 1), 50);
    }
}

function speakText(text) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.85;    
    utterance.pitch = 0.85;   
    utterance.volume = 0.8;   

    const voices = speechSynthesis.getVoices();
    const softVoice = voices.find(v =>
        v.lang === "en-US" && v.name.toLowerCase().includes("female")
    );
    if (softVoice) utterance.voice = softVoice;

    window.speechSynthesis.speak(utterance);
}// speech to text

function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.lang = 'en-US';
    recognition.interimResults = true; 
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        stopSpeaking();
        isListening = true;
        hasError = false;
        micBtn.classList.add('listening');
        statusText.innerText = "Listening...";
        statusText.style.color = "#ff3366";
        clearTimeout(typingTimer);
        typeWriterElement.innerText = ""; 
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            statusText.innerText = "Processing...";
            statusText.style.color = "#bc13fe";
            typeWriterElement.innerText = finalTranscript;
            sendToBackend(finalTranscript);
        } else if (interimTranscript) {
            typeWriterElement.innerText = interimTranscript;
            typeWriterElement.style.opacity = "0.7"; 
        }
    };

    recognition.onerror = function(event) {
        console.warn("Speech Recognition Issue: ", event.error);
        
        hasError = true;
        statusText.innerText = "Offline";
        statusText.style.color = "red";
        typeWriterElement.style.opacity = "1";
        
        if(event.error === 'no-speech') {
            typeWriterElement.innerText = "No speech detected. Please speak louder.";
        } else if (event.error === 'not-allowed') {
            typeWriterElement.innerText = "Microphone blocked. Check permissions.";
        } else if (event.error === 'network') {
            if (window.location.protocol === 'file:') {
                typeWriterElement.innerText = "Error: Speech API blocked on local files. Use a local server or click to simulate.";
            } else {
                typeWriterElement.innerText = "Network Error: Check internet connection. Click to simulate.";
            }
        } else {
            typeWriterElement.innerText = "Error: " + event.error + ". Click here to simulate.";
        }
    };

    recognition.onend = function() {
        isListening = false;
        micBtn.classList.remove('listening');
        typeWriterElement.style.opacity = "1";
        
        setTimeout(() => {
            if(!isListening && !hasError) {
                statusText.innerText = "Online";
                statusText.style.color = "var(--neon-cyan)";
            } else if (hasError) {
                setTimeout(() => {
                     if(statusText.innerText === 'Offline') {
                         statusText.innerText = "Online";
                         statusText.style.color = "var(--neon-cyan)";
                         if (typeWriterElement.innerText.includes("Error") || typeWriterElement.innerText.includes("blocked")) {
                             typeWriterElement.innerText = "Click this box to simulate commands.";
                         }
                     }
                }, 5000);
            }
        }, 1000);
    };
} else {
    hasError = true;
    typeWriterElement.innerText = "Browser unsupported. Click to simulate.";
}

function toggleListening() {
    stopSpeaking();
    if (window.location.protocol === 'file:') {
        hasError = true;
        statusText.innerText = "Restricted";
        statusText.style.color = "orange";
        typeWriterElement.innerText = "Voice API blocked on file:// protocol. Use a local server (localhost) or click here to simulate.";
        return;
    }

    if (!SpeechRecognition) {
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch(e) {
            console.error("Could not start recognition:", e);
        }
    }
}

async function sendToBackend(query) {
    console.log("Sending query to backend:", query);


    const res = await fetch(
        "http://127.0.0.1:8000/search?q=" + encodeURIComponent(query)
    );
    const data = await res.json();
    const answer = data.results.join(" ");

    typeWriter(answer);
    speakText(answer);
}
