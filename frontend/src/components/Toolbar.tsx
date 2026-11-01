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
    <div className="relative group shrink-0">
        <motion.button
            whileHover={disabled ? {} : { scale: 1.08 }}
            whileTap={disabled ? {} : { scale: 0.92 }}
            onClick={disabled ? undefined : onClick}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all ${active ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
        >
            {icon}
        </motion.button>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest whitespace-nowrap z-50 hidden sm:block">
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
        <div 
            className="fixed left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-1.5 md:gap-3 max-w-[98vw] pointer-events-auto"
            style={{
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.65rem)'
            }}
        >
            {/* Color Palette Popover */}
            <AnimatePresence>
                {showColors && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="glass-panel p-2.5 sm:p-4 rounded-2xl sm:rounded-[1.75rem] shadow-2xl border border-white/10 grid grid-cols-8 gap-1.5 sm:gap-2 mb-1 bg-[#0f172a]/95 backdrop-blur-xl"
                    >
                        {colors.map((color) => (
                            <motion.button
                                key={color}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { setCurrentColor(color); setShowColors(false); }}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 ${currentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <button 
                            onClick={() => colorInputRef.current?.click()}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white/10 bg-gradient-to-tr from-gray-400 to-gray-600 flex items-center justify-center"
                        >
                            <Palette size={11} className="text-white" />
                        </button>
                        <input ref={colorInputRef} type="color" className="hidden" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Toolbar */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-[#0f172a]/95 backdrop-blur-2xl px-2 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 flex items-center gap-1 sm:gap-2 max-w-[96vw] overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar select-none"
            >
                {/* Tools Group */}
                <div className="flex items-center gap-0.5 sm:gap-1 pr-1.5 sm:pr-2 border-r border-white/10 shrink-0">
                    <ToolButton active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} icon={<MousePointer2 size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Selection" />
                    <ToolButton active={activeTool === 'freehand'} onClick={() => setActiveTool('freehand')} icon={<Pen size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Pencil" />
                    <ToolButton active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Text Tool" />
                    <ToolButton active={activeTool === 'eraser'} onClick={() => setActiveTool('eraser')} icon={<Eraser size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Eraser" />
                </div>

                {/* Shapes Group */}
                <div className="flex items-center gap-0.5 sm:gap-1 pr-1.5 sm:pr-2 border-r border-white/10 shrink-0">
                    <ToolButton active={activeTool === 'rectangle'} onClick={() => setActiveTool('rectangle')} icon={<Square size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Rectangle" />
                    <ToolButton active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} icon={<Circle size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Circle" />
                    <ToolButton active={activeTool === 'line'} onClick={() => setActiveTool('line')} icon={<Minus size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Line" />
                    
                    <button 
                        onClick={() => {
                            const p = window.prompt("AI Vision Prompt:");
                            if(p) generateAIContent(p);
                        }}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-md hover:scale-110 active:scale-95 transition-all shrink-0"
                        title="AI Magic Draw"
                    >
                        <Sparkles size={16} fill="currentColor" />
                    </button>
                </div>

                {/* Color and Size Group */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 pr-1.5 sm:pr-2 border-r border-white/10 shrink-0">
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setShowColors(!showColors)}
                            className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl border border-white/20 flex items-center justify-center overflow-hidden shadow-inner relative shrink-0"
                            style={{ backgroundColor: currentColor }}
                            title="Choose Color"
                        >
                            <div className="absolute bottom-0.5 right-0.5 text-white/50"><ChevronUp size={9} /></div>
                        </motion.button>
                    </div>

                    <div className="flex items-center gap-1 px-1 sm:px-2 bg-white/5 rounded-xl h-8 sm:h-9 shrink-0">
                        {sizes.map(s => (
                            <button 
                                key={s}
                                onClick={() => setCurrentSize(s)}
                                className={`rounded-full transition-all flex items-center justify-center ${currentSize === s ? 'bg-white scale-125 shadow-glow' : 'bg-white/20 hover:bg-white/40'}`}
                                style={{ width: Math.max(5, s/2 + 2), height: Math.max(5, s/2 + 2) }}
                                title={`Size ${s}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Undo/Redo/Clear Group */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <ToolButton onClick={sendUndo} icon={<RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Undo" disabled={!canUndo} />
                    <ToolButton onClick={sendRedo} icon={<RotateCw size={16} className="sm:w-[18px] sm:h-[18px]" />} label="Redo" disabled={!canRedo} />
                    <button 
                        onClick={() => { if(window.confirm("Clear entire board?")) sendClear(); }}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all shrink-0"
                        title="Clear All"
                    >
                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Toolbar;
