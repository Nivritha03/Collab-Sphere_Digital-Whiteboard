import React, { useEffect, useRef, useCallback } from 'react';
import { useWhiteboardStore, fromVirX, fromVirY } from '../store/useWhiteboardStore';
import { useThemeStore } from '../store/useThemeStore';

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bufferRef = useRef<HTMLCanvasElement | null>(null);
    const lastRenderedCount = useRef(0);
    const animFrameRef = useRef<number | null>(null);

    const {
        activeTool, currentColor, currentSize,
        sendDraw, sendCursor, newStroke,
        strokes, strokeOrder, historyIndex,
        currentStrokeId
    } = useWhiteboardStore();
    const { theme } = useThemeStore();

    const isDrawing = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const lastPos = useRef({ x: 0, y: 0 });
    const lastCursorSend = useRef(0);

    // Store refs for values used inside render() callback to avoid stale closures
    const strokesRef = useRef(strokes);
    const strokeOrderRef = useRef(strokeOrder);
    const historyIndexRef = useRef(historyIndex);
    const themeRef = useRef(theme);

    strokesRef.current = strokes;
    strokeOrderRef.current = strokeOrder;
    historyIndexRef.current = historyIndex;
    themeRef.current = theme;

    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const setupCtx = useCallback((ctx: CanvasRenderingContext2D, size: number, color: string, tool: string) => {
        let finalColor = color;
        const th = themeRef.current;
        if (th === 'light' && (color === '#ffffff' || color === 'white')) finalColor = '#000000';
        if (th === 'dark' && (color === '#000000' || color === 'black')) finalColor = '#ffffff';

        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = finalColor;
            if (th !== 'light') {
                ctx.shadowBlur = 4;
                ctx.shadowColor = finalColor;
            } else {
                ctx.shadowBlur = 0;
            }
        }
        return finalColor;
    }, []);

    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, sid: string, width: number, height: number) => {
        const stroke = strokesRef.current[sid];
        if (!stroke || stroke.points.length === 0) return;
        const first = stroke.points[0];
        const color = setupCtx(ctx, first.size, first.color, first.tool);

        if (first.tool === 'freehand' || first.tool === 'eraser') {
            const pts = stroke.points;
            ctx.beginPath();
            ctx.moveTo(fromVirX(first.x0, width), fromVirY(first.y0, height));
            for (const p of pts) {
                ctx.lineTo(fromVirX(p.x1, width), fromVirY(p.y1, height));
            }
            ctx.stroke();
        } else if (first.tool === 'text') {
            const last = stroke.points[stroke.points.length - 1];
            ctx.font = `bold ${last.size * 5}px 'Outfit', sans-serif`;
            ctx.fillStyle = color;
            ctx.shadowBlur = 0;
            ctx.fillText(last.text || '', fromVirX(last.x0, width), fromVirY(last.y0, height));
        } else {
            const last = stroke.points[stroke.points.length - 1];
            ctx.beginPath();
            const x0 = fromVirX(first.x0, width), y0 = fromVirY(first.y0, height);
            const x1 = fromVirX(last.x1, width), y1 = fromVirY(last.y1, height);
            if (first.tool === 'line') {
                ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
            } else if (first.tool === 'rectangle') {
                ctx.rect(x0, y0, x1 - x0, y1 - y0);
            } else if (first.tool === 'circle') {
                const rx = Math.abs(x1 - x0) / 2;
                const ry = Math.abs(y1 - y0) / 2;
                ctx.ellipse(x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 2, rx, ry, 0, 0, 2 * Math.PI);
            }
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
    }, [setupCtx]);

    const initBuffer = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (!bufferRef.current) bufferRef.current = document.createElement('canvas');
        bufferRef.current.width = canvas.width;
        bufferRef.current.height = canvas.height;
        const bCtx = bufferRef.current.getContext('2d');
        if (bCtx) bCtx.clearRect(0, 0, canvas.width, canvas.height);
        lastRenderedCount.current = 0;
    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Ensure buffer exists and is same size
        if (!bufferRef.current || bufferRef.current.width !== canvas.width || bufferRef.current.height !== canvas.height) {
            initBuffer();
        }
        const buf = bufferRef.current;
        if (!buf) return;
        const bCtx = buf.getContext('2d');
        if (!bCtx) return;

        const hi = historyIndexRef.current;
        const so = strokeOrderRef.current;
        const currentVisible = hi === -1 ? so : so.slice(0, hi + 1);

        // If strokes were removed (undo/clear), rebuild buffer from scratch
        if (currentVisible.length < lastRenderedCount.current) {
            bCtx.clearRect(0, 0, buf.width, buf.height);
            lastRenderedCount.current = 0;
        }

        // Incrementally blit finished strokes into buffer
        for (let i = lastRenderedCount.current; i < currentVisible.length; i++) {
            const sid = currentVisible[i];
            const stroke = strokesRef.current[sid];
            const isFinished = stroke?.points[stroke.points.length - 1]?.isFinished;
            if (isFinished || stroke?.points[0]?.tool === 'text') {
                drawStroke(bCtx, sid, canvas.width, canvas.height);
                lastRenderedCount.current = i + 1;
            } else {
                break;
            }
        }

        // Composite: buffer + any in-progress strokes on top
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(buf, 0, 0);
        for (let i = lastRenderedCount.current; i < currentVisible.length; i++) {
            drawStroke(ctx, currentVisible[i], canvas.width, canvas.height);
        }
    }, [drawStroke, initBuffer]);

    // Resize handler — re-init buffer and re-render
    useEffect(() => {
        const onResize = () => {
            const canvas = canvasRef.current;
            if (canvas && canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
                initBuffer();
                render();
            }
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [initBuffer, render]);

    // Re-render whenever strokes/strokeOrder/historyIndex/theme changes
    // Use requestAnimationFrame to batch rapid updates (e.g. remote drawing)
    useEffect(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => {
            render();
            animFrameRef.current = null;
        });
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
        };
    }, [strokes, strokeOrder, historyIndex, theme, render]);

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (activeTool === 'hand') return;
        isDrawing.current = true;
        const pos = getPos(e);
        startPos.current = pos;
        lastPos.current = pos;
        newStroke();
        canvasRef.current?.setPointerCapture(e.pointerId);
    };

    const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = getPos(e);
        const now = Date.now();

        // Throttled cursor send
        if (now - lastCursorSend.current > 50) {
            sendCursor(pos.x, pos.y, canvas.width, canvas.height);
            lastCursorSend.current = now;
        }

        if (!isDrawing.current) return;

        if (activeTool === 'freehand' || activeTool === 'eraser') {
            const success = sendDraw({
                tool: activeTool,
                x0: lastPos.current.x, y0: lastPos.current.y,
                x1: pos.x, y1: pos.y,
                color: activeTool === 'eraser' ? '#000000' : currentColor,
                size: currentSize,
                strokeId: currentStrokeId,
            }, canvas.width, canvas.height);

            if (success) lastPos.current = pos;
        } else if (activeTool !== 'text') {
            // For shapes: re-render committed buffer + live preview
            render();
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                setupCtx(ctx, currentSize, currentColor, activeTool);
                ctx.beginPath();
                if (activeTool === 'line') {
                    ctx.moveTo(startPos.current.x, startPos.current.y);
                    ctx.lineTo(pos.x, pos.y);
                } else if (activeTool === 'rectangle') {
                    ctx.rect(startPos.current.x, startPos.current.y, pos.x - startPos.current.x, pos.y - startPos.current.y);
                } else if (activeTool === 'circle') {
                    const rx = Math.abs(pos.x - startPos.current.x) / 2;
                    const ry = Math.abs(pos.y - startPos.current.y) / 2;
                    ctx.ellipse(
                        startPos.current.x + (pos.x - startPos.current.x) / 2,
                        startPos.current.y + (pos.y - startPos.current.y) / 2,
                        rx, ry, 0, 0, 2 * Math.PI
                    );
                }
                ctx.stroke();
            }
        }
    };

    const finishDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        canvasRef.current?.releasePointerCapture(e.pointerId);
        const pos = getPos(e);
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (activeTool === 'text') {
            const text = window.prompt('Enter your text:');
            if (text) {
                sendDraw({
                    tool: 'text',
                    x0: pos.x, y0: pos.y,
                    x1: pos.x, y1: pos.y,
                    color: currentColor,
                    size: currentSize,
                    strokeId: currentStrokeId,
                    isFinished: true,
                    text
                }, canvas.width, canvas.height);
            }
        } else {
            sendDraw({
                tool: activeTool,
                x0: activeTool === 'freehand' || activeTool === 'eraser' ? lastPos.current.x : startPos.current.x,
                y0: activeTool === 'freehand' || activeTool === 'eraser' ? lastPos.current.y : startPos.current.y,
                x1: pos.x, y1: pos.y,
                color: activeTool === 'eraser' ? '#000000' : currentColor,
                size: currentSize,
                strokeId: currentStrokeId,
                isFinished: true,
            }, canvas.width, canvas.height);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={onMove}
            onPointerUp={finishDrawing}
            onPointerCancel={finishDrawing}
            className={`absolute top-0 left-0 w-full h-full touch-none ${
                activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
            }`}
        />
    );
};

export default Canvas;
