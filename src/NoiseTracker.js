import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const NoiseTracker = () => {
    const [noiseLevel, setNoiseLevel] = useState(0);
    const waveCanvasRef = useRef(null);
    const animationIdRef = useRef(null);
    const [threshold, setThreshold] = useState(20);
    const [alert, setAlert] = useState(false);
    const [averageNoiseLevel, setAverageNoiseLevel] = useState(0);

    useEffect(() => {
        let audioContext;
        let analyser;
        let mediaStreamSource;
        let waveCanvasContext;

        // Function to start tracking noise levels
        const startNoiseTracking = async () => {
            try {
                // Request permission to use the microphone
                const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
                mediaStreamSource.connect(analyser);
                analyser.fftSize = 2048; // Set the FFT size for frequency analysis
                setupWaveCanvas();
                updateNoiseLevel();
            } catch (error) {
                console.error('Error accessing microphone:', error);
                alert('Accessing microphone failed. Please check your browser settings.');
            }
        };

        // Function to set up the canvas for visualizing the audio wave
        const setupWaveCanvas = () => {
            const canvas = waveCanvasRef.current;
            waveCanvasContext = canvas.getContext('2d');
            waveCanvasContext.lineWidth = 2;
            waveCanvasContext.strokeStyle = 'blue';
        };

        // Function to update the noise level and draw the audio wave
        const updateNoiseLevel = () => {
            if (noiseLevel > threshold) {
                setAlert(true);
            }
            const dataArray = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(dataArray);
            const average = [...dataArray].reduce((acc, val) => acc + val, 0) / dataArray.length;
            const nlevel = Math.max(0, average - 127);
            setNoiseLevel(nlevel);
            drawWave(dataArray);
            // Calculate average noise level
            const sum = dataArray.reduce((acc, val) => acc + val, 0);
            const averageN = sum / dataArray.length;
            setAverageNoiseLevel(averageN);

            // Request next animation frame
            animationIdRef.current = requestAnimationFrame(updateNoiseLevel);
        };
        // Function to draw the audio wave on the canvas
        const drawWave = (dataArray) => {
            const canvas = waveCanvasRef.current;
            const width = canvas.width;
            const height = canvas.height;
            waveCanvasContext.clearRect(0, 0, width, height);
            waveCanvasContext.beginPath();
            const sliceWidth = (width * 1.0) / dataArray.length;
            let x = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * height) / 2;
                if (i === 0) {
                    waveCanvasContext.moveTo(x, y);
                } else {
                    waveCanvasContext.lineTo(x, y);
                }
                x += sliceWidth;
            }
            waveCanvasContext.lineTo(width, height / 2);
            waveCanvasContext.stroke();
        };

        startNoiseTracking();

        // Clean up on component unmount
        return () => {
            if (audioContext) audioContext.close();
            if (mediaStreamSource) mediaStreamSource.disconnect();
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
        };
    }, []);

    const handleExportData = () => {
        const dataToExport = {
            noiseLevel,
        };
        const dataBlob = new Blob([JSON.stringify(dataToExport)], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'noise_data.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container">
            <h1 className="head">Simple Noise Tracker App</h1>
            <div className="info-section">
                <div className="noise-level">
                    <h2 className={`noise-level-value ${noiseLevel > threshold ? 'high' : 'normal'}`}>
                        Noise Level: {Math.round(noiseLevel)}
                    </h2>
                    <h2>Average Noise Level: {Math.round(averageNoiseLevel)}</h2>
                    <label className="threshold-label">Threshold:</label>
                    <input
                        type="number"
                        className="threshold-input"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                    />
                </div>
                <button className="export-button" onClick={handleExportData}>
                    Export Data
                </button>
            </div>
            <div className="alert-section">
                <h2 className={`alert ${alert ? 'show' : 'hide'}`}>Noise level is too high!</h2>
            </div>
            <div className="canvas-section">
                <div className="wave-canvas-container">
                    <h2>Wave Visualization</h2>
                    <canvas ref={waveCanvasRef} className="wave-canvas" />
                </div>
            </div>
        </div>
    );
};

export default NoiseTracker;
