import React from 'react';
export declare const SCENARIOS: Record<string, {
    id: string;
    name: string;
}[]>;
export declare const DEFAULT_PARAMS: Record<string, Record<string, number>>;
export declare const PARAM_LABELS: Record<string, {
    label: string;
    unit: string;
    min: number;
    max: number;
}>;
interface IControlPanelProps {
    onExecute: (scenarioId: string, params: Record<string, number>) => void;
}
export declare const ControlPanel: React.FC<IControlPanelProps>;
export {};
