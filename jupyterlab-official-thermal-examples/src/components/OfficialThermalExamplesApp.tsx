import React, { useMemo, useState } from 'react';
import {
  CaesExampleConfig,
  CaesNotebookLanguage,
  DEFAULT_CAES_CONFIG
} from '../caes/caesNotebookGenerator';
import {
  CspExampleConfig,
  DEFAULT_CSP_CONFIG,
  DISPATCH_STRATEGY_LABELS,
  DispatchStrategyId,
  SOLAR_PROFILE_LABELS,
  SolarProfileId
} from '../csp/cspNotebookGenerator';

type ActiveExample = 'caes' | 'csp';

export type OfficialThermalExampleRequest =
  | { kind: 'caes'; config: CaesExampleConfig }
  | { kind: 'csp'; config: CspExampleConfig };

interface OfficialThermalExamplesAppProps {
  onGenerate: (request: OfficialThermalExampleRequest) => Promise<void>;
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

function ParameterGroup(props: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="official-thermal-parameter-group">
      <h4>{props.title}</h4>
      {props.children}
    </section>
  );
}

function MetricBox(props: {
  label: string;
  value: string;
  unit: string;
}): React.ReactElement {
  return (
    <div>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <em>{props.unit}</em>
    </div>
  );
}

function CaesParameterEditor(props: {
  config: CaesExampleConfig;
  setConfig: (config: CaesExampleConfig) => void;
}): React.ReactElement {
  const { config, setConfig } = props;

  return (
    <>
      <ParameterGroup title="01 运行策略与时间">
        <label className="official-thermal-field">
          <span>Notebook 语言</span>
          <select
            value={config.language}
            onChange={event => setConfig({
              ...config,
              language: event.target.value as CaesNotebookLanguage
            })}
          >
            <option value="python">Python 版</option>
            <option value="julia">Julia 版</option>
          </select>
        </label>

        <label className="official-thermal-field">
          <span>运行工况</span>
          <select
            value={config.operationProfile}
            onChange={event => setConfig({
              ...config,
              operationProfile: event.target.value as CaesExampleConfig['operationProfile']
            })}
          >
            <option value="charge_hold_discharge">充电-静置-放电</option>
          </select>
        </label>

        <NumberField
          label="充电时长"
          value={config.chargeHours}
          min={1}
          max={8}
          step={0.5}
          unit="h"
          onChange={chargeHours => setConfig({ ...config, chargeHours })}
        />
        <NumberField
          label="静置时长"
          value={config.holdHours}
          min={0}
          max={8}
          step={0.5}
          unit="h"
          onChange={holdHours => setConfig({ ...config, holdHours })}
        />
        <NumberField
          label="放电时长"
          value={config.dischargeHours}
          min={1}
          max={8}
          step={0.5}
          unit="h"
          onChange={dischargeHours => setConfig({ ...config, dischargeHours })}
        />
        <NumberField
          label="时间步长"
          value={config.timeStepMinutes}
          min={0.5}
          max={10}
          step={0.5}
          unit="min"
          onChange={timeStepMinutes => setConfig({ ...config, timeStepMinutes })}
        />
      </ParameterGroup>

      <ParameterGroup title="02 环境参数">
        <NumberField
          label="环境温度"
          value={config.ambientTemperatureC}
          min={-10}
          max={45}
          step={1}
          unit="degC"
          onChange={ambientTemperatureC => setConfig({ ...config, ambientTemperatureC })}
        />
        <NumberField
          label="环境压力"
          value={config.ambientPressureBar}
          min={0.8}
          max={1.2}
          step={0.005}
          unit="bar"
          onChange={ambientPressureBar => setConfig({ ...config, ambientPressureBar })}
        />
      </ParameterGroup>

      <ParameterGroup title="03 压缩机与电动机">
        <NumberField
          label="压缩机级数"
          value={config.compressorStages}
          min={2}
          max={4}
          step={1}
          unit="级"
          onChange={compressorStages => setConfig({ ...config, compressorStages })}
        />
        <NumberField
          label="空气质量流量"
          value={config.massFlowKgS}
          min={2}
          max={40}
          step={1}
          unit="kg/s"
          onChange={massFlowKgS => setConfig({ ...config, massFlowKgS })}
        />
        <NumberField
          label="压缩机等熵效率"
          value={config.compressorEfficiency}
          min={0.65}
          max={0.92}
          step={0.01}
          unit="-"
          onChange={compressorEfficiency => setConfig({ ...config, compressorEfficiency })}
        />
        <NumberField
          label="电动机效率"
          value={config.motorEfficiency}
          min={0.85}
          max={0.99}
          step={0.005}
          unit="-"
          onChange={motorEfficiency => setConfig({ ...config, motorEfficiency })}
        />
      </ParameterGroup>

      <ParameterGroup title="04 冷却器与换热器">
        <NumberField
          label="换热器有效度"
          value={config.heatExchangerEffectiveness}
          min={0.65}
          max={0.98}
          step={0.01}
          unit="-"
          onChange={heatExchangerEffectiveness => setConfig({ ...config, heatExchangerEffectiveness })}
        />
      </ParameterGroup>

      <ParameterGroup title="05 储气罐">
        <NumberField
          label="储气罐容积"
          value={config.storageVolumeM3}
          min={200}
          max={5000}
          step={100}
          unit="m3"
          onChange={storageVolumeM3 => setConfig({ ...config, storageVolumeM3 })}
        />
        <NumberField
          label="最低储气压力"
          value={config.minStoragePressureBar}
          min={10}
          max={80}
          step={2}
          unit="bar"
          onChange={minStoragePressureBar => setConfig({ ...config, minStoragePressureBar })}
        />
        <NumberField
          label="最高储气压力"
          value={config.maxStoragePressureBar}
          min={60}
          max={200}
          step={5}
          unit="bar"
          onChange={maxStoragePressureBar => setConfig({ ...config, maxStoragePressureBar })}
        />
        <NumberField
          label="初始储气压力"
          value={config.initialStoragePressureBar}
          min={10}
          max={100}
          step={2}
          unit="bar"
          onChange={initialStoragePressureBar => setConfig({ ...config, initialStoragePressureBar })}
        />
        <NumberField
          label="储气罐换热系数 UA"
          value={config.storageHeatTransferCoefficientWk}
          min={0}
          max={10000}
          step={100}
          unit="W/K"
          onChange={storageHeatTransferCoefficientWk => setConfig({ ...config, storageHeatTransferCoefficientWk })}
        />
      </ParameterGroup>

      <ParameterGroup title="06 热储能 TES">
        <NumberField
          label="TES 储热介质质量"
          value={config.tesMassKg}
          min={50000}
          max={1000000}
          step={10000}
          unit="kg"
          onChange={tesMassKg => setConfig({ ...config, tesMassKg })}
        />
        <NumberField
          label="TES 比热容"
          value={config.tesSpecificHeatKjKgK}
          min={0.5}
          max={2}
          step={0.05}
          unit="kJ/kg/K"
          onChange={tesSpecificHeatKjKgK => setConfig({ ...config, tesSpecificHeatKjKgK })}
        />
        <NumberField
          label="TES 初始温度"
          value={config.tesInitialTemperatureC}
          min={30}
          max={350}
          step={5}
          unit="degC"
          onChange={tesInitialTemperatureC => setConfig({ ...config, tesInitialTemperatureC })}
        />
        <NumberField
          label="TES 热损失 UA"
          value={config.tesAmbientLossCoefficientWk}
          min={0}
          max={10000}
          step={100}
          unit="W/K"
          onChange={tesAmbientLossCoefficientWk => setConfig({ ...config, tesAmbientLossCoefficientWk })}
        />
        <NumberField
          label="膨胀机入口最高温度"
          value={config.maxTurbineInletTemperatureC}
          min={150}
          max={650}
          step={10}
          unit="degC"
          onChange={maxTurbineInletTemperatureC => setConfig({ ...config, maxTurbineInletTemperatureC })}
        />
        <NumberField
          label="TES 最小端差"
          value={config.minimumTesApproachTemperatureK}
          min={2}
          max={50}
          step={1}
          unit="K"
          onChange={minimumTesApproachTemperatureK => setConfig({ ...config, minimumTesApproachTemperatureK })}
        />
      </ParameterGroup>

      <ParameterGroup title="07 膨胀机与发电机">
        <NumberField
          label="膨胀机级数"
          value={config.expanderStages}
          min={2}
          max={4}
          step={1}
          unit="级"
          onChange={expanderStages => setConfig({ ...config, expanderStages })}
        />
        <NumberField
          label="膨胀机等熵效率"
          value={config.expanderEfficiency}
          min={0.65}
          max={0.94}
          step={0.01}
          unit="-"
          onChange={expanderEfficiency => setConfig({ ...config, expanderEfficiency })}
        />
        <NumberField
          label="发电机效率"
          value={config.generatorEfficiency}
          min={0.85}
          max={0.99}
          step={0.005}
          unit="-"
          onChange={generatorEfficiency => setConfig({ ...config, generatorEfficiency })}
        />
      </ParameterGroup>
    </>
  );
}

function CspParameterEditor(props: {
  config: CspExampleConfig;
  setConfig: (config: CspExampleConfig) => void;
}): React.ReactElement {
  const { config, setConfig } = props;

  return (
    <>
      <ParameterGroup title="运行策略">
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
      </ParameterGroup>

      <ParameterGroup title="集热场">
        <NumberField
          label="太阳能集热场面积"
          value={config.collectorArea}
          min={100000}
          max={900000}
          step={10000}
          unit="m2"
          onChange={collectorArea => setConfig({ ...config, collectorArea })}
        />
        <NumberField
          label="集热场光学效率"
          value={config.opticalEfficiency}
          min={0.45}
          max={0.85}
          step={0.01}
          unit="-"
          onChange={opticalEfficiency => setConfig({ ...config, opticalEfficiency })}
        />
        <NumberField
          label="接收器热损失系数"
          value={config.receiverLossCoefficient}
          min={0.1}
          max={1.5}
          step={0.01}
          unit="W/m2/K"
          onChange={receiverLossCoefficient => setConfig({ ...config, receiverLossCoefficient })}
        />
      </ParameterGroup>

      <ParameterGroup title="双罐熔盐储热">
        <NumberField
          label="单罐有效容积"
          value={config.storageTankVolume}
          min={5000}
          max={45000}
          step={500}
          unit="m3"
          onChange={storageTankVolume => setConfig({ ...config, storageTankVolume })}
        />
        <NumberField
          label="热盐设计温度"
          value={config.hotSaltTemperature}
          min={480}
          max={590}
          step={1}
          unit="degC"
          onChange={hotSaltTemperature => setConfig({ ...config, hotSaltTemperature })}
        />
        <NumberField
          label="冷盐设计温度"
          value={config.coldSaltTemperature}
          min={240}
          max={330}
          step={1}
          unit="degC"
          onChange={coldSaltTemperature => setConfig({ ...config, coldSaltTemperature })}
        />
        <NumberField
          label="熔盐密度"
          value={config.moltenSaltDensity}
          min={1500}
          max={2100}
          step={10}
          unit="kg/m3"
          onChange={moltenSaltDensity => setConfig({ ...config, moltenSaltDensity })}
        />
        <NumberField
          label="熔盐定压比热"
          value={config.moltenSaltSpecificHeat}
          min={1.1}
          max={1.8}
          step={0.01}
          unit="kJ/kg/K"
          onChange={moltenSaltSpecificHeat => setConfig({ ...config, moltenSaltSpecificHeat })}
        />
        <NumberField
          label="初始热盐罐液位"
          value={config.initialHotTankLevelPercent}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={initialHotTankLevelPercent => setConfig({ ...config, initialHotTankLevelPercent })}
        />
      </ParameterGroup>

      <ParameterGroup title="换热与发电子系统">
        <NumberField
          label="油盐换热效率"
          value={config.heatExchangerEfficiency}
          min={0.8}
          max={0.99}
          step={0.005}
          unit="-"
          onChange={heatExchangerEfficiency => setConfig({ ...config, heatExchangerEfficiency })}
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
        <NumberField
          label="热功到电功效率"
          value={config.powerBlockEfficiency}
          min={0.25}
          max={0.45}
          step={0.005}
          unit="-"
          onChange={powerBlockEfficiency => setConfig({ ...config, powerBlockEfficiency })}
        />
      </ParameterGroup>
    </>
  );
}

export function OfficialThermalExamplesApp(props: OfficialThermalExamplesAppProps): React.ReactElement {
  const [activeExample, setActiveExample] = useState<ActiveExample>('caes');
  const [caesConfig, setCaesConfig] = useState<CaesExampleConfig>(DEFAULT_CAES_CONFIG);
  const [cspConfig, setCspConfig] = useState<CspExampleConfig>(DEFAULT_CSP_CONFIG);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');

  const caesCycleHours = useMemo(
    () => caesConfig.chargeHours + caesConfig.holdHours + caesConfig.dischargeHours,
    [caesConfig.chargeHours, caesConfig.dischargeHours, caesConfig.holdHours]
  );

  const caesPressureWindow = useMemo(
    () => caesConfig.maxStoragePressureBar - caesConfig.minStoragePressureBar,
    [caesConfig.maxStoragePressureBar, caesConfig.minStoragePressureBar]
  );

  const caesThroughputTons = useMemo(
    () => caesConfig.massFlowKgS * (caesConfig.chargeHours + caesConfig.dischargeHours) * 3.6,
    [caesConfig.chargeHours, caesConfig.dischargeHours, caesConfig.massFlowKgS]
  );

  const cspStorageCapacity = useMemo(() => {
    const deltaTemperature = cspConfig.hotSaltTemperature - cspConfig.coldSaltTemperature;
    return (
      cspConfig.storageTankVolume
      * cspConfig.moltenSaltDensity
      * cspConfig.moltenSaltSpecificHeat
      * deltaTemperature
      / 3600000
    );
  }, [cspConfig]);

  const cspRatedThermalPower = useMemo(
    () => cspConfig.powerBlockRatedPower / cspConfig.powerBlockEfficiency,
    [cspConfig.powerBlockEfficiency, cspConfig.powerBlockRatedPower]
  );

  const heroTitle = activeExample === 'caes'
    ? '压缩空气储能仿真'
    : '槽式太阳能光热发电集热-储热-发电联合过程';

  const heroText = activeExample === 'caes'
    ? '多级压缩、冷却回热、定容储气罐、TES 再热、多级膨胀和发电机耦合的系统级 process 模型。'
    : '24 小时 DNI 驱动，显式展开槽式集热场、油盐换热、双罐熔盐储热、汽轮机发电和运行模式切换。';

  const generateButtonText = activeExample === 'caes'
    ? `生成${caesConfig.language === 'julia' ? ' Julia' : ' Python'} CAES Notebook`
    : '生成光热发电 Notebook';

  const handleGenerate = async (): Promise<void> => {
    setIsGenerating(true);
    setStatusMessage('');
    try {
      const request: OfficialThermalExampleRequest = activeExample === 'caes'
        ? { kind: 'caes', config: caesConfig }
        : { kind: 'csp', config: cspConfig };
      await props.onGenerate(request);
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

  const handleReset = (): void => {
    if (activeExample === 'caes') {
      setCaesConfig(DEFAULT_CAES_CONFIG);
    } else {
      setCspConfig(DEFAULT_CSP_CONFIG);
    }
    setStatusMessage('');
  };

  return (
    <div className="official-thermal-panel">
      <div className="official-thermal-tabs" role="tablist" aria-label="官方热力建模示例">
        <button
          className={activeExample === 'caes' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={activeExample === 'caes'}
          onClick={() => {
            setActiveExample('caes');
            setStatusMessage('');
          }}
        >
          压缩空气储能
        </button>
        <button
          className={activeExample === 'csp' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={activeExample === 'csp'}
          onClick={() => {
            setActiveExample('csp');
            setStatusMessage('');
          }}
        >
          槽式太阳能光热
        </button>
      </div>

      <section className="official-thermal-hero">
        <div>
          <p className="official-thermal-kicker">官方热力建模示例</p>
          <h2>{heroTitle}</h2>
          <p>{heroText}</p>
        </div>
        <div className="official-thermal-metrics">
          {activeExample === 'caes' ? (
            <>
              <MetricBox label="循环时长" value={caesCycleHours.toFixed(1)} unit="h" />
              <MetricBox label="压力窗口" value={caesPressureWindow.toFixed(0)} unit="bar" />
              <MetricBox label="空气吞吐" value={caesThroughputTons.toFixed(0)} unit="t/cycle" />
            </>
          ) : (
            <>
              <MetricBox label="储热容量" value={cspStorageCapacity.toFixed(0)} unit="MWh_th" />
              <MetricBox label="额定热需求" value={cspRatedThermalPower.toFixed(0)} unit="MW_th" />
            </>
          )}
        </div>
      </section>

      <div className="official-thermal-grid">
        <section className="official-thermal-editor">
          <h3>参数配置</h3>

          {activeExample === 'caes' ? (
            <CaesParameterEditor config={caesConfig} setConfig={setCaesConfig} />
          ) : (
            <CspParameterEditor config={cspConfig} setConfig={setCspConfig} />
          )}

          <div className="official-thermal-actions">
            <button
              className="official-thermal-button primary"
              disabled={isGenerating}
              onClick={handleGenerate}
              type="button"
            >
              {generateButtonText}
            </button>
            <button
              className="official-thermal-button"
              disabled={isGenerating}
              onClick={handleReset}
              type="button"
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
          {activeExample === 'caes' ? (
            <ol>
              <li><span>环境空气</span><b>环境温度、环境压力与变比热物性入口</b></li>
              <li><span>多级压缩机</span><b>等压比分配、等熵效率、压缩耗功</b></li>
              <li><span>冷却 / 回热</span><b>有效度换热，压缩热进入 TES</b></li>
              <li><span>定容储气罐</span><b>m_tank、T_tank、p_tank 动态更新</b></li>
              <li><span>TES 加热</span><b>储热量、等效温度、环境热损失</b></li>
              <li><span>膨胀发电</span><b>多级膨胀机、发电机效率、往返效率</b></li>
            </ol>
          ) : (
            <ol>
              <li><span>DNI 输入</span><b>24 h 太阳直射辐射谱</b></li>
              <li><span>槽式集热</span><b>光学效率 + 接收器热损失</b></li>
              <li><span>油盐换热</span><b>有效热量进入熔盐系统</b></li>
              <li><span>双罐储热</span><b>热盐罐/冷盐罐液位动态更新</b></li>
              <li><span>汽轮机发电</span><b>额定热需求与部分负荷</b></li>
              <li><span>模式切换</span><b>充热、放热、待机、弃热</b></li>
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
