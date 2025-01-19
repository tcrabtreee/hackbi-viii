// Speech to text / Generative AI Intgration
// ===============================================
let messages = [{"role": "system", "content": "You are a pirate themed cardboard robot in real life where people can walk up and talk to you. You have two arms that are controlled by servos and a head that rotates to always have eye contact with the person talking to you. Please respond a relatively short answer, basically whatever is appropriate for a normal human conversation. Speak in pirate language only."},]
let resultElement = document.getElementById("result");

document.addEventListener("keydown", (event) => {
	if(event.code === "Space" && running === false){
		startRecording()
	}
})

document.addEventListener("keyup", (event) => {
	if(event.code === "Space" && running === true){
		stopRecording()
	}
})

let recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let running = false;
let lastResult = null;
let lastTimestamp = null;
if (recognition){
    // Config
    recognition = new recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = function (event) {
        if(running === false) return;
        let result = '';

        for(let i = 0; i < event.results.length; i++){
            if(event.results[i].isFinal){
                result += event.results[i][0].transcript + " ";
            } else {
                result += event.results[i][0].transcript
            }
        }

        resultElement.innerText = result;
        if(result !== lastResult){
            lastTimestamp = Date.now();
        }

        lastResult = result;
    };
} else {
    console.error('Speech recognition not supported');
}

function startRecording() {
    resultElement.innerText = '';
    recognition.start();
    running = true;
}

function stopRecording() {
    setTimeout(() => {
        if (recognition) {
            recognition.stop();
            running = false;
        }
    }, 100) // 500
}

setInterval(() => {
    if(lastTimestamp !== null && Date.now() - lastTimestamp > 2500){ // 1000
        recognition.stop();
        sendAPIRequest(lastResult);

        running = false;
        lastResult = null;
        lastTimestamp = null;
    }
}, 1000)

async function sendAPIRequest(prompt){
    messages.push({ "role": "user", "content": prompt })
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer <removed for obvious reasons>",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "gpt-4o-mini",
            "store": false,
            "messages": messages
        })
    })

    const result = await response.json();
    console.log(result)
    const message = result.choices[0].message.content;
    messages.push({ "role": "assistant", "content": message })
    await fetch("http://localhost:3000/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
			"type": "message",
            "content": message
        })
    })

    document.getElementById("response").innerText = message

    // Fetch and play audio file
    const response2 = await fetch("http://localhost:5501/audio.wav");
    const arrayBuffer = await response2.arrayBuffer();

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

// Face Detection
// ===============================================
const video = document.getElementById('video')

Promise.all([
	faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
	faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
	faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
	faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
	navigator.getUserMedia(
		{ video: {} },
		stream => video.srcObject = stream,
		err => console.error(err)
	)
}

video.addEventListener('play', () => {
	const canvas = faceapi.createCanvasFromMedia(video)
	document.body.append(canvas)
	const displaySize = { width: video.width, height: video.height }
	faceapi.matchDimensions(canvas, displaySize)

	setInterval(async () => {
		const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()

        console.log(detection.landmarks.getNose()[0]._x)
		// Painting
		const resizedDetections = faceapi.resizeResults(detection, displaySize)
		canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
		faceapi.draw.drawDetections(canvas, resizedDetections)
		faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
		faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

		fetch("http://localhost:3000/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				"type": "faceTracking",
				"content": detection.landmarks.getNose()[0]._x
			})
		})
	}, 100)
})