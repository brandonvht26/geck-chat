import { api, ApiError } from './api';

export interface CreateWorkspacePayload {
  name: string;
  description: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const getWorkspaces = async (): Promise<WorkspaceResponse[]> => {
  try {
    const response = await api.get<WorkspaceResponse[]>('api/workspaces');
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error obteniendo workspaces:', apiError.message);
    throw error;
  }
};

export const createWorkspace = async (name: string, description: string): Promise<WorkspaceResponse> => {
  try {
    const response = await api.post<WorkspaceResponse>('api/workspaces', { name, description });
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error creando workspace:', apiError.message);
    throw error;
  }
};