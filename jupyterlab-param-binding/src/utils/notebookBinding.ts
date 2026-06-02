import {
  BINDING_METADATA_KEY,
  createEmptyBindingMetadata,
  IBindingMetadata,
  IParamControlConfig,
  IParsedParam,
  updateAssignmentSource
} from './parameterBinding';

export function getNotebookBindingMetadata(notebookModel: any): IBindingMetadata {
  const metadata = notebookModel?.getMetadata
    ? notebookModel.getMetadata(BINDING_METADATA_KEY)
    : notebookModel?.metadata?.[BINDING_METADATA_KEY];

  if (metadata && typeof metadata === 'object') {
    return {
      ...createEmptyBindingMetadata(),
      ...metadata,
      parameters: metadata.parameters || {}
    };
  }

  return createEmptyBindingMetadata();
}

export function setNotebookBindingMetadata(notebookModel: any, metadata: IBindingMetadata): void {
  if (notebookModel?.setMetadata) {
    notebookModel.setMetadata(BINDING_METADATA_KEY, metadata);
    return;
  }

  if (notebookModel?.metadata) {
    notebookModel.metadata[BINDING_METADATA_KEY] = metadata;
  }
}

function cleanConfig(config: IParamControlConfig): IParamControlConfig {
  const cleaned: Record<string, any> = {};
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned as IParamControlConfig;
}

export function updateNotebookBindingConfig(
  notebookModel: any,
  variableName: string,
  patch: Record<string, any>
): IBindingMetadata {
  const metadata = getNotebookBindingMetadata(notebookModel);
  const previous = metadata.parameters[variableName] || { type: 'number', label: variableName };
  const nextConfig = cleanConfig({
    ...previous,
    ...patch
  });
  const next = {
    ...metadata,
    parameters: {
      ...metadata.parameters,
      [variableName]: nextConfig
    }
  };

  setNotebookBindingMetadata(notebookModel, next);
  return next;
}

export function updateNotebookParamValue(
  notebook: any,
  param: IParsedParam,
  newValue: any
): boolean {
  if (!notebook?.widgets) {
    return false;
  }

  const cell = notebook.widgets.find((candidate: any, index: number) => {
    const idMatches = param.cellId && candidate?.model?.id === param.cellId;
    return idMatches || index === param.cellIndex;
  });

  if (!cell?.model?.sharedModel) {
    return false;
  }

  const source = cell.model.sharedModel.getSource() || '';
  let updated = '';
  try {
    updated = updateAssignmentSource(source, param, newValue);
  } catch (error) {
    console.error('Failed to update parameter assignment:', error);
    return false;
  }

  cell.model.sharedModel.setSource(updated);
  return true;
}
