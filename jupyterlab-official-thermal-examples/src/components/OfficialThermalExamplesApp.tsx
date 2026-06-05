import React, { useMemo, useState } from 'react';
import {
  CspExampleConfig,
  DEFAULT_CSP_CONFIG,
  DISPATCH_STRATEGY_LABELS,
  DispatchStrategyId,
  SOLAR_PROFILE_LABELS,
  SolarProfileId
} from '../csp/cspNotebookGenerator';

interface OfficialThermalExamplesAppProps {
  onGenerate: (config: CspExampleConfig) => Promise<void>;
}

function numericValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function NumberField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}): React.ReactElement {
  return (
    <label className="official-thermal-field">
      <span>{props.label}</span>
      <div className="official-thermal-number-control">
        <input
          type="range"
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.value}
          onChange={event => props.onChange(numericValue(event.target.value))}
        />
        <input
          type="number"
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.value}
          onChange={event => props.onChange(numericValue(event.target.value))}
        />
        <b>{props.unit}</b>
      </div>
    </label>
  );
}

export function OfficialThermalExamplesApp(props: OfficialThermalExamplesAppProps): React.ReactElement {
  const [config, setConfig] = useState<CspExampleConfig>(DEFAULT_CSP_CONFIG);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');

  const storageCapacity = useMemo(() => {
    const deltaTemperature = config.hotSaltTemperature - config.coldSaltTemperature;
    return (
      config.storageTankVolume
      * config.moltenSaltDensity
      * config.moltenSaltSpecificHeat
      * deltaTemperature
      / 3600000
    );
  }, [config]);

  const ratedThermalPower = useMemo(
    () => config.powerBlockRatedPower / config.powerBlockEfficiency,
    [config.powerBlockEfficiency, config.powerBlockRatedPower]
  );

  const handleGenerate = async (): Promise<void> => {
    setIsGenerating(true);
    setStatusMessage('');
    try {
      await props.onGenerate(config);
      setStatusKind('success');
      setStatusMessage('Notebook 已生成并打开。');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusKind('error');
      setStatusMessage(`生成失败: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="official-thermal-panel">
      <section className="official-thermal-hero">
        <div>
          <p className="official-thermal-kicker">官方热力建模示例</p>
          <h2>槽式太阳能光热发电集热-储热-发电联合过程</h2>
          <p>
            24 小时 DNI 驱动，显式展开槽式集热场、油盐换热、双罐熔盐储热、汽轮机发电和运行模式切换。
          </p>
        </div>
        <div className="official-thermal-metrics">
          <div>
            <span>储热容量</span>
            <strong>{storageCapacity.toFixed(0)}</strong>
            <em>MWh_th</em>
          </div>
          <div>
            <span>额定热需求</span>
            <strong>{ratedThermalPower.toFixed(0)}</strong>
            <em>MW_th</em>
          </div>
        </div>
      </section>

      <div className="official-thermal-grid">
        <section className="official-thermal-editor">
          <h3>示例参数</h3>

          <label className="official-thermal-field">
            <span>典型日照辐射谱</span>
            <select
              value={config.solarProfile}
              onChange={event => setConfig({
                ...config,
                solarProfile: event.target.value as SolarProfileId
              })}
            >
              {Object.entries(SOLAR_PROFILE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="official-thermal-field">
            <span>发电调度策略</span>
            <select
              value={config.dispatchStrategy}
              onChange={event => setConfig({
                ...config,
                dispatchStrategy: event.target.value as DispatchStrategyId
              })}
            >
              {Object.entries(DISPATCH_STRATEGY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <NumberField
            label="太阳能集热场面积"
            value={config.collectorArea}
            min={100000}
            max={900000}
            step={10000}
            unit="m²"
            onChange={collectorArea => setConfig({ ...config, collectorArea })}
          />
          <NumberField
            label="单罐有效容积"
            value={config.storageTankVolume}
            min={5000}
            max={45000}
            step={500}
            unit="m³"
            onChange={storageTankVolume => setConfig({ ...config, storageTankVolume })}
          />
          <NumberField
            label="热盐设计温度"
            value={config.hotSaltTemperature}
            min={480}
            max={590}
            step={1}
            unit="°C"
            onChange={hotSaltTemperature => setConfig({ ...config, hotSaltTemperature })}
          />
          <NumberField
            label="汽轮机额定电功率"
            value={config.powerBlockRatedPower}
            min={30}
            max={250}
            step={5}
            unit="MW"
            onChange={powerBlockRatedPower => setConfig({ ...config, powerBlockRatedPower })}
          />

          <div className="official-thermal-actions">
            <button
              className="official-thermal-button primary"
              disabled={isGenerating}
              onClick={handleGenerate}
            >
              生成官方示例 Notebook
            </button>
            <button
              className="official-thermal-button"
              disabled={isGenerating}
              onClick={() => {
                setConfig(DEFAULT_CSP_CONFIG);
                setStatusMessage('');
              }}
            >
              恢复默认参数
            </button>
          </div>

          {statusMessage && (
            <div className={statusKind === 'error' ? 'official-thermal-status error' : 'official-thermal-status'}>
              {statusMessage}
            </div>
          )}
        </section>

        <section className="official-thermal-process">
          <h3>Process 模型链路</h3>
          <ol>
            <li><span>DNI 输入</span><b>24 h 太阳直射辐射谱</b></li>
            <li><span>槽式集热</span><b>光学效率 + 接收器热损失</b></li>
            <li><span>油盐换热</span><b>有效热量进入熔盐系统</b></li>
            <li><span>双罐储热</span><b>热盐罐/冷盐罐液位动态更新</b></li>
            <li><span>汽轮机发电</span><b>额定热需求与部分负荷</b></li>
            <li><span>模式切换</span><b>充热、放热、待机、弃热</b></li>
          </ol>
        </section>
      </div>
    </div>
  );
}
