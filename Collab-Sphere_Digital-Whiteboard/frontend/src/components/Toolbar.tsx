import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MousePointer2, Pen, Eraser, Type, 
    Square, Circle, Minus, Sparkles,
    RotateCcw, RotateCw, Trash2, Palette,
    ChevronUp
} from 'lucide-react';
import { useWhiteboardStore } from '../store/useWhiteboardStore';

const colors = [
    '#ffffff', '#f87171', '#f472b6', '#c084fc', '#818cf8',
    '#60a5fa', '#22d3ee', '#2dd4bf', '#34d399', '#a3e635', '#facc15', '#fb923c',
    '#000000', '#4b5563', '#9ca3af', '#e5e7eb'
];

const ToolButton = ({ active, onClick, icon, label, disabled }: { active?: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean }) => (
    <div className="relative group">
        <motion.button
            whileHover={disabled ? {} : { scale: 1.1 }}
            whileTap={disabled ? {} : { scale: 0.9 }}
            onClick={disabled ? undefined : onClick}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
        >
            {icon}
        </motion.button>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest whitespace-nowrap z-50">
            {label}
        </div>
    </div>
);

const Toolbar = () => {
    const {
        activeTool, setActiveTool,
        currentColor, setCurrentColor,
        currentSize, setCurrentSize,
        sendUndo, sendRedo, sendClear,
        generateAIContent,
        strokeOrder, undoHistory, userId, strokes
    } = useWhiteboardStore();
    
    const [showColors, setShowColors] = useState(false);
    const colorInputRef = useRef<HTMLInputElement>(null);

    const canUndo = strokeOrder.some(sid => strokes[sid]?.userId === userId);
    const canRedo = undoHistory.some(sid => strokes[sid]?.userId === userId);

    const sizes = [2, 6, 12, 24];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4 w-max">
            {/* Color Palette Popover */}
            <AnimatePresence>
                {showColors && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="glass-panel p-4 rounded-[2rem] shadow-2xl border border-white/10 grid grid-cols-8 gap-2 mb-2 bg-[#0f172a]/90 backdrop-blur-xl"
                    >
                        {colors.map((color) => (
                            <motion.button
                                key={color}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { setCurrentColor(color); setShowColors(false); }}
                                className={`w-6 h-6 rounded-full border-2 ${currentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <button 
                            onClick={() => colorInputRef.current?.click()}
                            className="w-6 h-6 rounded-full border-2 border-white/10 bg-gradient-to-tr from-gray-400 to-gray-600 flex items-center justify-center"
                        >
                            <Palette size={12} className="text-white" />
                        </button>
                        <input ref={colorInputRef} type="color" className="hidden" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Toolbar */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-[#0f172a]/80 backdrop-blur-2xl px-4 py-2 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2"
            >
                {/* Tools Group */}
                <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                    <ToolButton active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} icon={<MousePointer2 size={18} />} label="Selection" />
                    <ToolButton active={activeTool === 'freehand'} onClick={() => setActiveTool('freehand')} icon={<Pen size={18} />} label="Pencil" />
                    <ToolButton active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={18} />} label="Text Tool" />
                    <ToolButton active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={18} />} label="Eraser" />
                </div>

                {/* Shapes Group */}
                <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                    <ToolButton active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} icon={<Square size={18} />} label="Rectangle" />
                    <ToolButton active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={<Circle size={18} />} label="Circle" />
                    <ToolButton active={activeTool === 'line'} onClick={() => setActiveTool('line')} icon={<Minus size={18} />} label="Line" />
                    
                    <button 
                        onClick={() => {
                            const p = window.prompt("AI Vision Prompt:");
                            if(p) generateAIContent(p);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-lg hover:scale-110 active:scale-95 transition-all ml-1"
                    >
                        <Sparkles size={18} fill="currentColor" />
                    </button>
                </div>

                {/* Color and Size Group */}
                <div className="flex items-center gap-3 pr-2 border-r border-white/10">
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={() => setShowColors(!showColors)}
                            className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center overflow-hidden shadow-inner relative"
                            style={{ backgroundColor: currentColor }}
                        >
                            <div className="absolute bottom-0.5 right-0.5 text-white/50"><ChevronUp size={10} /></div>
                        </motion.button>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 bg-white/5 rounded-xl h-10">
                        {sizes.map(s => (
                            <button 
                                key={s}
                                onClick={() => setCurrentSize(s)}
                                className={`w-2 h-2 rounded-full transition-all ${currentSize === s ? 'bg-white scale-150 shadow-glow' : 'bg-white/20 hover:bg-white/40'}`}
                                style={{ width: 4 + s/3, height: 4 + s/3 }}
                            />
                        ))}
                    </div>
                </div>

                {/* Undo/Redo/Clear Group */}
                <div className="flex items-center gap-1">
                    <ToolButton onClick={sendUndo} icon={<RotateCcw size={18} />} label="Undo" disabled={!canUndo} />
                    <ToolButton onClick={sendRedo} icon={<RotateCw size={18} />} label="Redo" disabled={!canRedo} />
                    <button 
                        onClick={() => { if(window.confirm("Clear entire board?")) sendClear(); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-red-100 hover:bg-red-500/20 hover:text-red-300 transition-all ml-1"
                        title="Clear All"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Toolbar;
