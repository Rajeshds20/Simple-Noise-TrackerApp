import React, { useEffect, useState, useRef } from 'react';

const NoiseTracker = () => {
    const [noiseLevel, setNoiseLevel] = useState(0);
    const canvasRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        let audioContext;
        let analyser;
        let mediaStreamSource;
        let canvasContext;

        // Function to start tracking noise levels
        const startNoiseTracking = async () => {
            try {
                // Request permission to use the microphone
                const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
                mediaStreamSource.connect(analyser);
                setupCanvas();
                updateNoiseLevel();
            } catch (error) {
                console.error('Error accessing microphone:', error);
            }
        };

        // Function to set up the canvas for visualizing the audio wave
        const setupCanvas = () => {
            const canvas = canvasRef.current;
            canvasContext = canvas.getContext('2d');
            canvasContext.lineWidth = 2;
            canvasContext.strokeStyle = 'blue';
        };

        // Function to update the noise level and draw the audio wave
        const updateNoiseLevel = () => {
            const dataArray = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(dataArray);
            const average = [...dataArray].reduce((acc, val) => acc + val, 0) / dataArray.length;
            const noiseLevel = Math.max(0, average - 127);
            setNoiseLevel(noiseLevel);
            drawWave(dataArray);
            animationIdRef.current = requestAnimationFrame(updateNoiseLevel);
        };

        // Function to draw the audio wave on the canvas
        const drawWave = (dataArray) => {
            const canvas = canvasRef.current;
            const width = canvas.width;
            const height = canvas.height;
            canvasContext.clearRect(0, 0, width, height);
            canvasContext.beginPath();
            const sliceWidth = (width * 1.0) / dataArray.length;
            let x = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * height) / 2;
                if (i === 0) {
                    canvasContext.moveTo(x, y);
                } else {
                    canvasContext.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasContext.lineTo(width, height / 2);
            canvasContext.stroke();
        };

        startNoiseTracking();

        // Clean up on component unmount
        return () => {
            if (audioContext) audioContext.close();
            if (mediaStreamSource) mediaStreamSource.disconnect();
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
        };
    }, []);

    return (
        <div>
            <h1 style={{ color: "blueviolet" }} className="head">Simple Noice Tracker App</h1>
            <h2>Noise Level: {noiseLevel}</h2>
            <canvas ref={canvasRef} width={400} height={100} />
        </div>
    );
};

export default NoiseTracker;
