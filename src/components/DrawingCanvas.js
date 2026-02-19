import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';

/**
 * A self-contained drawing canvas with colour picker, brush size slider,
 * and clear button.
 *
 * Exposes a `getImageData()` method via ref so the parent can read the
 * canvas PNG data URL when the user clicks "Submit Drawing".
 */
const DrawingCanvas = forwardRef(function DrawingCanvas(_, ref) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);

    useImperativeHandle(ref, () => ({
        getImageData() {
            return canvasRef.current?.toDataURL('image/png') ?? null;
        }
    }));

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    return (
        <div>
            <Row className="mb-2">
                <Col>
                    <Form.Label>Brush Color:</Form.Label>
                    <Form.Control
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </Col>
                <Col>
                    <Form.Label>Brush Size: {brushSize}px</Form.Label>
                    <Form.Range
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    />
                </Col>
                <Col className="d-flex align-items-end">
                    <Button variant="secondary" onClick={clearCanvas}>
                        Clear Canvas
                    </Button>
                </Col>
            </Row>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'crosshair',
                    backgroundColor: '#ffffff',
                    maxWidth: '100%'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />
        </div>
    );
});

export default DrawingCanvas;
