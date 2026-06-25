import React from 'react';
import {
  AlgebraicFormulaConfig,
  FirstOrderDynamicConfig,
  GenericSimulationConfig,
  LinearSystemConfig,
  OneDimensionalTransferConfig,
  OptimizationDispatchConfig,
  SecondOrderDynamicConfig,
  SimulationConfig,
  TimeSeriesEnergyBalanceConfig
} from '../../templates/types';
import { BaseFields, NumberField, SelectField, TextAreaField, TextField } from '../common/Fields';
import { formatMatrix, formatNumberArray, formatStringArray, parseMatrix, parseNumberArray, parseStringArray } from '../common/inputParsers';

interface ConfigFormProps<TConfig extends SimulationConfig> {
  config: TConfig;
  onChange: (config: SimulationConfig) => void;
}

function GenericSimulationForm(props: ConfigFormProps<GenericSimulationConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <div className="simulation-platform-generic-note">
      <h3 className="simulation-platform-section-title">通用仿真模板</h3>
      <SelectField
        label="编程内核"
        value={config.programmingKernel}
        options={[{ label: 'Python', value: 'python' }, { label: 'Julia', value: 'julia' }]}
        onChange={programmingKernel => onChange({ ...config, programmingKernel: programmingKernel as GenericSimulationConfig['programmingKernel'] })}
      />
      <p>
        该模板不预设具体仿真问题、参数表、公式或规则。生成 Notebook 后，请在 12 个标题下方的代码单元中自行填写各部分仿真代码。
      </p>
    </div>
  );
}

function AlgebraicFormulaForm(props: ConfigFormProps<AlgebraicFormulaConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <>
      <BaseFields config={config} onChange={onChange} />
      <h3 className="simulation-platform-section-title">公式配置</h3>
      <TextField label="输出变量" value={config.outputVariable} onChange={outputVariable => onChange({ ...config, outputVariable })} />
      <TextAreaField label="计算公式" value={config.formula} onChange={formula => onChange({ ...config, formula })} />
      <label className="simulation-platform-field">
        <span>参数扫描</span>
        <input
          type="checkbox"
          checked={config.enableParameterScan}
          onChange={event => onChange({ ...config, enableParameterScan: event.target.checked })}
        />
      </label>
      <div className="simulation-platform-grid">
        <TextField label="扫描参数" value={config.scanParameter} onChange={scanParameter => onChange({ ...config, scanParameter })} />
        <SelectField
          label="图像类型"
          value={config.chartType}
          options={[{ label: '折线图', value: 'line' }, { label: '柱状图', value: 'bar' }]}
          onChange={chartType => onChange({ ...config, chartType: chartType as AlgebraicFormulaConfig['chartType'] })}
        />
        <NumberField label="扫描起点" value={config.scanStart} onChange={scanStart => onChange({ ...config, scanStart })} />
        <NumberField label="扫描终点" value={config.scanEnd} onChange={scanEnd => onChange({ ...config, scanEnd })} />
        <NumberField label="扫描点数" value={config.scanPoints} onChange={scanPoints => onChange({ ...config, scanPoints })} step="1" />
      </div>
    </>
  );
}

function FirstOrderDynamicForm(props: ConfigFormProps<FirstOrderDynamicConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <>
      <BaseFields config={config} onChange={onChange} />
      <h3 className="simulation-platform-section-title">一阶动态配置</h3>
      <div className="simulation-platform-grid">
        <TextField label="状态变量" value={config.stateVariable} onChange={stateVariable => onChange({ ...config, stateVariable })} />
        <NumberField label="初始值" value={config.initialValue} onChange={initialValue => onChange({ ...config, initialValue })} />
        <NumberField label="起始时间" value={config.timeStart} onChange={timeStart => onChange({ ...config, timeStart })} />
        <NumberField label="结束时间" value={config.timeEnd} onChange={timeEnd => onChange({ ...config, timeEnd })} />
        <NumberField label="时间步长" value={config.timeStep} onChange={timeStep => onChange({ ...config, timeStep })} />
      </div>
      <TextAreaField label="状态方程 d(state)/dt" value={config.stateEquation} onChange={stateEquation => onChange({ ...config, stateEquation })} />
    </>
  );
}

function SecondOrderDynamicForm(props: ConfigFormProps<SecondOrderDynamicConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <>
      <BaseFields config={config} onChange={onChange} />
      <h3 className="simulation-platform-section-title">二阶动态配置</h3>
      <div className="simulation-platform-grid">
        <TextField label="位移变量" value={config.displacementVariable} onChange={displacementVariable => onChange({ ...config, displacementVariable })} />
        <TextField label="速度变量" value={config.velocityVariable} onChange={velocityVariable => onChange({ ...config, velocityVariable })} />
        <NumberField label="初始位移" value={config.initialDisplacement} onChange={initialDisplacement => onChange({ ...config, initialDisplacement })} />
        <NumberField label="初始速度" value={config.initialVelocity} onChange={initialVelocity => onChange({ ...config, initialVelocity })} />
        <NumberField label="仿真时间" value={config.timeEnd} onChange={timeEnd => onChange({ ...config, timeEnd })} />
        <NumberField label="时间步长" value={config.timeStep} onChange={timeStep => onChange({ ...config, timeStep })} />
      </div>
      <TextAreaField label="外部激励 F(t)" value={config.forcingExpression} onChange={forcingExpression => onChange({ ...config, forcingExpression })} />
    </>
  );
}

function LinearSystemForm(props: ConfigFormProps<LinearSystemConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <>
      <BaseFields config={config} onChange={onChange} />
      <h3 className="simulation-platform-section-title">矩阵方程配置</h3>
      <TextField label="未知量名称" value={formatStringArray(config.unknowns)} onChange={value => onChange({ ...config, unknowns: parseStringArray(value) })} />
      <TextAreaField label="系数矩阵 A" value={formatMatrix(config.matrix)} onChange={value => onChange({ ...config, matrix: parseMatrix(value) })} />
      <TextField label="右端项 b" value={formatNumberArray(config.rhs)} onChange={value => onChange({ ...config, rhs: parseNumberArray(value) })} />
      <TextAreaField
        label="方程含义说明"
        value={config.equationDescriptions.join('\n')}
        onChange={value => onChange({ ...config, equationDescriptions: value.split('\n').map(item => item.trim()).filter(Boolean) })}
      />
      <label className="simulation-platform-field">
        <span>绘制节点结果图</span>
        <input type="checkbox" checked={config.plotNodes} onChange={event => onChange({ ...config, plotNodes: event.target.checked })} />
      </label>
    </>
  );
}

function OneDimensionalTransferForm(props: ConfigFormProps<OneDimensionalTransferConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <>
      <BaseFields config={config} onChange={onChange} />
      <h3 className="simulation-platform-section-title">一维传热 / 扩散配置</h3>
      <div className="simulation-platform-grid">
        <SelectField
          label="问题类型"
          value={config.problemType}
          options={[{ label: '稳态', value: 'steady' }, { label: '瞬态', value: 'transient' }]}
          onChange={problemType => onChange({ ...config, problemType: problemType as OneDimensionalTransferConfig['problemType'] })}
        />
        <NumberField label="空间长度" value={config.length} onChange={length => onChange({ ...config, length })} />
        <NumberField label="网格数量" value={config.nodes} onChange={nodes => onChange({ ...config, nodes })} step="1" />
        <TextField label="系数名称" value={config.coefficientName} onChange={coefficientName => onChange({ ...config, coefficientName })} />
        <NumberField label="系数数值" value={config.coefficientValue} onChange={coefficientValue => onChange({ ...config, coefficientValue })} />
        <NumberField label="初始条件" value={config.initialCondition} onChange={initialCondition => onChange({ ...config, initialCondition })} />
        <NumberField label="左边界" value={config.leftBoundary} onChange={leftBoundary => onChange({ ...config, leftBoundary })} />
        <NumberField label="右边界" value={config.rightBoundary} onChange={rightBoundary => onChange({ ...config, rightBoundary })} />
        <NumberField label="仿真时间" value={config.timeEnd} onChange={timeEnd => onChange({ ...config, timeEnd })} />
        <NumberField label="时间步长" value={config.timeStep} onChange={timeStep => onChange({ ...config, timeStep })} />
      </div>
    </>
  );
}

function TimeSeriesEnergyBalanceForm(props: ConfigFormProps<TimeSeriesEnergyBalanceConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <>
      <BaseFields config={config} onChange={onChange} />
      <h3 className="simulation-platform-section-title">时序能量平衡配置</h3>
      <div className="simulation-platform-grid">
        <NumberField label="时间步长" value={config.timeStep} onChange={timeStep => onChange({ ...config, timeStep })} />
        <NumberField label="储能容量" value={config.storageCapacity} onChange={storageCapacity => onChange({ ...config, storageCapacity })} />
        <NumberField label="最大充电功率" value={config.maxChargePower} onChange={maxChargePower => onChange({ ...config, maxChargePower })} />
        <NumberField label="最大放电功率" value={config.maxDischargePower} onChange={maxDischargePower => onChange({ ...config, maxDischargePower })} />
        <NumberField label="初始 SOC" value={config.initialSoc} onChange={initialSoc => onChange({ ...config, initialSoc })} />
        <NumberField label="SOC 下限" value={config.socMin} onChange={socMin => onChange({ ...config, socMin })} />
        <NumberField label="SOC 上限" value={config.socMax} onChange={socMax => onChange({ ...config, socMax })} />
        <NumberField label="充电效率" value={config.chargeEfficiency} onChange={chargeEfficiency => onChange({ ...config, chargeEfficiency })} />
        <NumberField label="放电效率" value={config.dischargeEfficiency} onChange={dischargeEfficiency => onChange({ ...config, dischargeEfficiency })} />
      </div>
      <TextField label="发电功率序列" value={formatNumberArray(config.generationSeries)} onChange={value => onChange({ ...config, generationSeries: parseNumberArray(value), duration: parseNumberArray(value).length })} />
      <TextField label="负荷功率序列" value={formatNumberArray(config.loadSeries)} onChange={value => onChange({ ...config, loadSeries: parseNumberArray(value) })} />
      <TextAreaField label="运行规则" value={config.operationRule} onChange={operationRule => onChange({ ...config, operationRule })} />
    </>
  );
}

function OptimizationDispatchForm(props: ConfigFormProps<OptimizationDispatchConfig>): React.ReactElement {
  const { config, onChange } = props;
  return (
    <>
      <BaseFields config={config} onChange={onChange} />
      <h3 className="simulation-platform-section-title">优化调度配置</h3>
      <TextField label="优化目标" value={config.objective} onChange={objective => onChange({ ...config, objective })} />
      <div className="simulation-platform-grid">
        <NumberField label="时间步长" value={config.timeStep} onChange={timeStep => onChange({ ...config, timeStep })} />
        <NumberField label="储能容量" value={config.storageCapacity} onChange={storageCapacity => onChange({ ...config, storageCapacity })} />
        <NumberField label="最大充电功率" value={config.maxChargePower} onChange={maxChargePower => onChange({ ...config, maxChargePower })} />
        <NumberField label="最大放电功率" value={config.maxDischargePower} onChange={maxDischargePower => onChange({ ...config, maxDischargePower })} />
        <NumberField label="初始 SOC" value={config.initialSoc} onChange={initialSoc => onChange({ ...config, initialSoc })} />
        <NumberField label="SOC 下限" value={config.socMin} onChange={socMin => onChange({ ...config, socMin })} />
        <NumberField label="SOC 上限" value={config.socMax} onChange={socMax => onChange({ ...config, socMax })} />
        <NumberField label="充电效率" value={config.chargeEfficiency} onChange={chargeEfficiency => onChange({ ...config, chargeEfficiency })} />
        <NumberField label="放电效率" value={config.dischargeEfficiency} onChange={dischargeEfficiency => onChange({ ...config, dischargeEfficiency })} />
      </div>
      <TextField label="电价序列" value={formatNumberArray(config.priceSeries)} onChange={value => onChange({ ...config, priceSeries: parseNumberArray(value), timeHorizon: parseNumberArray(value).length })} />
      <TextField label="发电功率序列" value={formatNumberArray(config.generationSeries)} onChange={value => onChange({ ...config, generationSeries: parseNumberArray(value) })} />
      <TextField label="负荷功率序列" value={formatNumberArray(config.loadSeries)} onChange={value => onChange({ ...config, loadSeries: parseNumberArray(value) })} />
    </>
  );
}

export function TemplateForm(props: ConfigFormProps<SimulationConfig>): React.ReactElement {
  switch (props.config.templateId) {
    case 'generic-simulation':
      return <GenericSimulationForm config={props.config} onChange={props.onChange} />;
    case 'algebraic-formula':
      return <AlgebraicFormulaForm config={props.config} onChange={props.onChange} />;
    case 'first-order-dynamic':
      return <FirstOrderDynamicForm config={props.config} onChange={props.onChange} />;
    case 'second-order-dynamic':
      return <SecondOrderDynamicForm config={props.config} onChange={props.onChange} />;
    case 'linear-system':
      return <LinearSystemForm config={props.config} onChange={props.onChange} />;
    case 'one-dimensional-transfer':
      return <OneDimensionalTransferForm config={props.config} onChange={props.onChange} />;
    case 'time-series-energy-balance':
      return <TimeSeriesEnergyBalanceForm config={props.config} onChange={props.onChange} />;
    case 'optimization-dispatch':
      return <OptimizationDispatchForm config={props.config} onChange={props.onChange} />;
    default:
      return <div className="simulation-platform-error">未知模板类型</div>;
  }
}
