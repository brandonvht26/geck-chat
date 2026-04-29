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

export interface InviteResponse {
  ok: boolean;
  msg: string;
}

export const getWorkspaces = async (): Promise<WorkspaceResponse[]> => {
  try {
    const response = await api.get<WorkspaceResponse[]>('/workspaces');
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error obteniendo workspaces:', apiError.message);
    throw error;
  }
};

export const createWorkspace = async (name: string, description: string): Promise<WorkspaceResponse> => {
  try {
    const response = await api.post<WorkspaceResponse>('/workspaces', { name, description });
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error creando workspace:', apiError.message);
    throw error;
  }
};

export const inviteMember = async (workspaceId: string, email: string): Promise<InviteResponse> => {
  try {
    const response = await api.post<InviteResponse>('/api/workspaces/invite', { workspaceId, email });
    return response.data;
  } catch (error) {
    throw error;
  }
};