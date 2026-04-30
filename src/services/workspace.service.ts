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

export interface WorkspaceMessage {
  _id: string;
  senderId: string;
  workspaceId: string;
  contenido: string;
  createdAt: string;
}

export interface InviteResponse {
  ok: boolean;
  msg: string;
}

export const getWorkspaces = async (): Promise<WorkspaceResponse[]> => {
  try {
    const response = await api.get<WorkspaceResponse[]>('/api/workspaces');
    return response.data;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error obteniendo workspaces:', apiError.message);
    throw error;
  }
};

export const createWorkspace = async (name: string, description: string): Promise<WorkspaceResponse> => {
  try {
    const response = await api.post<WorkspaceResponse>('/api/workspaces', { name, description });
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

export const getWorkspaceMessages = async (workspaceId: string): Promise<WorkspaceMessage[]> => {
  try {
    const response = await api.get<{ messages: WorkspaceMessage[] }>('/api/workspaces/' + workspaceId + '/messages');
    return response.data.messages;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error obteniendo mensajes:', apiError.message);
    throw error;
  }
};