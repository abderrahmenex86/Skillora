import { useEffect, useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';

type MermaidDiagramProps = {
    chart: string;
    label: string;
    className?: string;
};

const LIGHT_THEME = {
    background: '#ffffff',
    primaryColor: '#f9f9f9',
    primaryTextColor: '#111111',
    primaryBorderColor: '#d4d4d4',
    secondaryColor: '#f5f5f5',
    secondaryTextColor: '#111111',
    secondaryBorderColor: '#e5e5e5',
    tertiaryColor: '#ffffff',
    tertiaryTextColor: '#111111',
    tertiaryBorderColor: '#e5e5e5',
    lineColor: '#525252',
    textColor: '#111111',
    mainBkg: '#f9f9f9',
    nodeBorder: '#d4d4d4',
    clusterBkg: '#ffffff',
    clusterBorder: '#e5e5e5',
    edgeLabelBackground: '#ffffff',
    actorBkg: '#f9f9f9',
    actorBorder: '#d4d4d4',
    actorTextColor: '#111111',
    actorLineColor: '#a3a3a3',
    signalColor: '#525252',
    signalTextColor: '#111111',
    labelBoxBkgColor: '#f9f9f9',
    labelBoxBorderColor: '#d4d4d4',
    labelTextColor: '#111111',
    loopTextColor: '#111111',
    noteBkgColor: '#f5f5f5',
    noteBorderColor: '#d4d4d4',
    noteTextColor: '#111111',
    activationBkgColor: '#e5e5e5',
    activationBorderColor: '#a3a3a3',
    sequenceNumberColor: '#ffffff',
    fontSize: '13px',
};

const DARK_THEME = {
    background: '#0c0c0c',
    primaryColor: '#151515',
    primaryTextColor: '#f5f5f5',
    primaryBorderColor: '#3a3a3a',
    secondaryColor: '#151515',
    secondaryTextColor: '#f5f5f5',
    secondaryBorderColor: '#3a3a3a',
    tertiaryColor: '#0c0c0c',
    tertiaryTextColor: '#f5f5f5',
    tertiaryBorderColor: '#262626',
    lineColor: '#a3a3a3',
    textColor: '#f5f5f5',
    mainBkg: '#151515',
    nodeBorder: '#3a3a3a',
    clusterBkg: '#0c0c0c',
    clusterBorder: '#262626',
    edgeLabelBackground: '#0c0c0c',
    actorBkg: '#151515',
    actorBorder: '#3a3a3a',
    actorTextColor: '#f5f5f5',
    actorLineColor: '#525252',
    signalColor: '#a3a3a3',
    signalTextColor: '#f5f5f5',
    labelBoxBkgColor: '#151515',
    labelBoxBorderColor: '#3a3a3a',
    labelTextColor: '#f5f5f5',
    loopTextColor: '#f5f5f5',
    noteBkgColor: '#151515',
    noteBorderColor: '#3a3a3a',
    noteTextColor: '#f5f5f5',
    activationBkgColor: '#262626',
    activationBorderColor: '#525252',
    sequenceNumberColor: '#111111',
    fontSize: '13px',
};

let renderSequence = 0;

/**
 * Renders a Mermaid diagram with the app's monochrome + green theme.
 *
 * Mermaid is imported dynamically so its size stays out of the main bundle
 * until a page that actually uses a diagram is opened.
 */
export default function MermaidDiagram({
    chart,
    label,
    className = '',
}: MermaidDiagramProps) {
    const isDark = useThemeStore((state) => state.isDark);
    const [svg, setSvg] = useState('');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setSvg('');
        setFailed(false);

        const render = async () => {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                    theme: 'base',
                    fontFamily:
                        'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
                    themeVariables: isDark ? DARK_THEME : LIGHT_THEME,
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: true,
                        curve: 'basis',
                        padding: 6,
                        nodeSpacing: 18,
                        rankSpacing: 18,
                    },
                    sequence: {
                        useMaxWidth: true,
                        mirrorActors: false,
                        actorMargin: 42,
                        messageMargin: 32,
                        boxMargin: 8,
                        noteMargin: 8,
                        wrap: true,
                    },
                });

                const id = `skillora-mermaid-${renderSequence++}`;
                const themedChart = chart
                    .replaceAll('{{accent}}', isDark ? '#f5f5f5' : '#171717')
                    .replaceAll(
                        '{{accentSoft}}',
                        isDark ? '#1f1f1f' : '#f5f5f5'
                    )
                    .replaceAll('{{accentText}}', isDark ? '#f5f5f5' : '#171717')
                    .replaceAll('{{onAccent}}', isDark ? '#111111' : '#ffffff')
                    .replaceAll('{{muted}}', isDark ? '#525252' : '#a3a3a3');
                const result = await mermaid.render(id, themedChart);

                if (!cancelled) setSvg(result.svg);
            } catch {
                if (!cancelled) setFailed(true);
            }
        };

        void render();

        return () => {
            cancelled = true;
        };
    }, [chart, isDark]);

    if (failed) {
        return (
            <div
                role='img'
                aria-label={label}
                className={`flex min-h-40 items-center justify-center rounded-md border border-dashed border-(--border-line) px-4 py-8 text-center text-xs text-(--text-sub) ${className}`}>
                The process diagram could not be loaded.
            </div>
        );
    }

    if (!svg) {
        return (
            <div
                aria-hidden='true'
                className={`flex min-h-64 items-center justify-center rounded-md border border-(--border-line) bg-(--bg-panel) ${className}`}>
                <span className='font-mono text-[10px] uppercase tracking-[0.18em] text-(--text-sub)'>
                    Rendering process…
                </span>
            </div>
        );
    }

    return (
        <div
            role='img'
            aria-label={label}
            className={`mermaid-diagram ${className}`}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
