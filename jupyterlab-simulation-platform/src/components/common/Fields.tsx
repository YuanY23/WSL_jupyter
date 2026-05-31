import React from 'react';
import { ParameterDefinition, SimulationConfig } from '../../templates/types';
import { formatStringArray, parseStringArray } from './inputParsers';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

export function TextField(props: TextFieldProps): React.ReactElement {
  return (
    <div className="simulation-platform-field">
      <label>{props.label}</label>
      <input
        value={props.value}
        placeholder={props.placeholder}
        onChange={event => props.onChange(event.target.value)}
      />
    </div>
  );
}

export function TextAreaField(props: TextFieldProps): React.ReactElement {
  return (
    <div className="simulation-platform-field">
      <label>{props.label}</label>
      <textarea
        value={props.value}
        placeholder={props.placeholder}
        onChange={event => props.onChange(event.target.value)}
      />
    </div>
  );
}

export function NumberField(props: NumberFieldProps): React.ReactElement {
  return (
    <div className="simulation-platform-field">
      <label>{props.label}</label>
      <input
        type="number"
        step={props.step || 'any'}
        value={Number.isNaN(props.value) ? '' : props.value}
        onChange={event => props.onChange(event.target.value === '' ? NaN : Number(event.target.value))}
      />
    </div>
  );
}

export function SelectField(props: SelectFieldProps): React.ReactElement {
  return (
    <div className="simulation-platform-field">
      <label>{props.label}</label>
      <select value={props.value} onChange={event => props.onChange(event.target.value)}>
        {props.options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

interface BaseFieldsProps {
  config: SimulationConfig;
  onChange: (config: SimulationConfig) => void;
}

function emptyParameter(): ParameterDefinition {
  return {
    name: 'new_parameter',
    label: '新参数',
    value: 1,
    unit: '-',
    description: '可编辑参数'
  };
}

export function BaseFields(props: BaseFieldsProps): React.ReactElement {
  const { config, onChange } = props;

  const updateParameter = (index: number, patch: Partial<ParameterDefinition>): void => {
    const parameters = config.parameters.map((parameter, currentIndex) => (
      currentIndex === index ? { ...parameter, ...patch } : parameter
    ));
    onChange({ ...config, parameters } as SimulationConfig);
  };

  return (
    <>
      <div className="simulation-platform-grid">
        <TextField
          label="仿真名称"
          value={config.simulationName}
          onChange={simulationName => onChange({ ...config, simulationName } as SimulationConfig)}
        />
        <TextField
          label="输出结果"
          value={formatStringArray(config.outputs)}
          onChange={value => onChange({ ...config, outputs: parseStringArray(value) } as SimulationConfig)}
        />
      </div>
      <TextAreaField
        label="仿真问题说明"
        value={config.problemDescription}
        onChange={problemDescription => onChange({ ...config, problemDescription } as SimulationConfig)}
      />
      <TextAreaField
        label="模型假设"
        value={config.assumptions.join('\n')}
        onChange={value => onChange({
          ...config,
          assumptions: value.split('\n').map(item => item.trim()).filter(Boolean)
        } as SimulationConfig)}
      />

      <h3 className="simulation-platform-section-title">参数和变量</h3>
      <div className="simulation-platform-table-scroll" role="region" aria-label="参数和变量">
        <table className="simulation-platform-table">
          <thead>
            <tr>
              <th>变量名</th>
              <th>显示名</th>
              <th>数值</th>
              <th>单位</th>
              <th>说明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {config.parameters.map((parameter, index) => (
              <tr key={`${parameter.name}-${index}`}>
                <td><input value={parameter.name} onChange={event => updateParameter(index, { name: event.target.value })} /></td>
                <td><input value={parameter.label} onChange={event => updateParameter(index, { label: event.target.value })} /></td>
                <td><input type="number" step="any" value={Number.isNaN(parameter.value) ? '' : parameter.value} onChange={event => updateParameter(index, { value: event.target.value === '' ? NaN : Number(event.target.value) })} /></td>
                <td><input value={parameter.unit} onChange={event => updateParameter(index, { unit: event.target.value })} /></td>
                <td><input value={parameter.description} onChange={event => updateParameter(index, { description: event.target.value })} /></td>
                <td>
                  <button
                    className="simulation-platform-button"
                    onClick={() => onChange({
                      ...config,
                      parameters: config.parameters.filter((_parameter, currentIndex) => currentIndex !== index)
                    } as SimulationConfig)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="simulation-platform-button"
        onClick={() => onChange({ ...config, parameters: [...config.parameters, emptyParameter()] } as SimulationConfig)}
      >
        添加参数
      </button>
    </>
  );
}
