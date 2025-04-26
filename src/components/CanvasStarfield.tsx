import { useRef, useEffect, FC } from 'react';

interface Star {
    x: number;
    y: number;
    size: number;
    opacity: number;
}
interface CanvasStarfieldProps {
    countFar?: number;
    countNear?: number;
    parallaxFar?: number;
    parallaxNear?: number;
    dark: boolean;
}

const PURPLE = '#BF00FF';
const PURPLE_FADE = 'rgba(191,0,255,0.2)';

const CanvasStarfield: FC<CanvasStarfieldProps> = ({
    countFar = 100,
    countNear = 200,
    parallaxFar = 10,
    parallaxNear = 20,
    dark,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<{ far: Star[]; near: Star[] }>({ far: [], near: [] });

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const parent = canvas.parentElement!;

        function draw(ofx: number, ofy: number) {
            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

            ctx.fillStyle = dark ? '#FFFFFF' : PURPLE_FADE;
            starsRef.current.far.forEach((s) => {
                ctx.globalAlpha = dark ? s.opacity : 1;
                ctx.beginPath();
                ctx.arc(s.x + ofx, s.y + ofy, s.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = dark ? '#FFFFFF' : PURPLE;
            starsRef.current.near.forEach((s) => {
                ctx.globalAlpha = dark ? s.opacity : 1;
                const fx = ofx * (parallaxNear / parallaxFar);
                const fy = ofy * (parallaxNear / parallaxFar);
                ctx.beginPath();
                ctx.arc(s.x + fx, s.y + fy, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        const dpr = window.devicePixelRatio || 1;
        function resize() {
            const { width, height } = parent.getBoundingClientRect();
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            draw(0, 0);
        }
        window.addEventListener('resize', resize);
        resize();

        const farStars: Star[] = Array.from({ length: countFar }).map(() => ({
            x: Math.random() * canvas.clientWidth,
            y: Math.random() * canvas.clientHeight,
            size: Math.random() * 0.5 + 0.3,
            opacity: Math.random() * 0.2 + 0.1,
        }));
        const nearStars: Star[] = Array.from({ length: countNear }).map(() => ({
            x: Math.random() * canvas.clientWidth,
            y: Math.random() * canvas.clientHeight,
            size: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.3,
        }));
        starsRef.current = { far: farStars, near: nearStars };

        let rafId: number;
        let offsetX = 0,
            offsetY = 0;
        function onMove(e: MouseEvent) {
            const { width, height, left, top } = parent.getBoundingClientRect();
            const x = (e.clientX - (left + width / 2)) / (width / 2);
            const y = (e.clientY - (top + height / 2)) / (height / 2);
            offsetX = x;
            offsetY = y;
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => draw(offsetX * parallaxFar, offsetY * parallaxFar));
        }
        parent.addEventListener('mousemove', onMove);

        return () => {
            window.removeEventListener('resize', resize);
            parent.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafId);
        };
    }, [countFar, countNear, parallaxFar, parallaxNear, dark]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                height: '100vh',
                width: '100vw',
            }}
        />
    );
};

export default CanvasStarfield;
