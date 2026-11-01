import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Zap, Sparkles } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import type { Theme } from '../store/useThemeStore';
import { useEffect } from 'react';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        // Clear existing theme classes
        const themeClasses: Theme[] = ['light', 'dark', 'midnight', 'cyber'];
        themeClasses.forEach(c => document.documentElement.classList.remove(c));
        // Add current theme class
        document.documentElement.classList.add(theme);
    }, [theme]);

    const getIcon = () => {
        switch (theme) {
            case 'light': return <Sun size={15} className="sm:w-[18px] sm:h-[18px] text-amber-400" />;
            case 'dark': return <Moon size={15} className="sm:w-[18px] sm:h-[18px] text-indigo-400" />;
            case 'midnight': return <Sparkles size={15} className="sm:w-[18px] sm:h-[18px] text-sky-400" />;
            case 'cyber': return <Zap size={15} className="sm:w-[18px] sm:h-[18px] text-pink-400" fill="currentColor" />;
            default: return <Moon size={15} className="sm:w-[18px] sm:h-[18px]" />;
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="relative w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full glass-panel hover:border-[var(--accent-primary)] transition-all z-50 group shrink-0"
            title={`Current Theme: ${theme.toUpperCase()}`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={theme}
                    initial={{ y: 10, opacity: 0, scale: 0.5, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ y: -10, opacity: 0, scale: 0.5, rotate: 45 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                >
                    {getIcon()}
                </motion.div>
            </AnimatePresence>
            
            {/* Subtle pulse for the "active" theme look */}
            <div className="absolute inset-0 rounded-2xl bg-[var(--accent-primary)]/5 group-hover:bg-[var(--accent-primary)]/10 transition-all animate-pulse" />
        </motion.button>
    );
};

export default ThemeToggle;
