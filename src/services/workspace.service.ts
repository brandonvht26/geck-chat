import { api } from './api';

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

export interface WorkspaceListResponse {
  ok: boolean;
  workspaces: WorkspaceResponse[];
}

export const getWorkspaces = async (): Promise<WorkspaceResponse[]> => {
  try {
    // 🚀 CORREGIDO: Ahora apunta exactamente a la ventanilla de obtención del backend
    const response = await api.get<WorkspaceListResponse>('/api/workspaces/fetch-user-workspaces');
    if (!response.data.ok) {
      throw new Error('Error del servidor al obtener workspaces');
    }
    return response.data.workspaces;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error desconocido:', error);
    }
    throw error;
  }
};

export const createWorkspace = async (name: string, description: string): Promise<WorkspaceResponse> => {
  try {
    // 🚀 CORREGIDO: Ahora apunta exactamente a la oficina de creación del backend
    const response = await api.post<WorkspaceResponse>('/api/workspaces/create', { name, description });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error desconocido:', error);
    }
    throw error;
  }
};

export const inviteMember = async (workspaceId: string, email: string): Promise<InviteResponse> => {
  try {
    const response = await api.post<InviteResponse>('/api/workspaces/invite', { workspaceId, email });
    return response.data;
  } catch (error) {
    console.error('Error invitando miembro:', error);
    throw error;
  }
};

export const getWorkspaceMessages = async (workspaceId: string): Promise<WorkspaceMessage[]> => {
  try {
    const response = await api.get<{ messages: WorkspaceMessage[] }>('/api/workspaces/' + workspaceId + '/messages');
    return response.data.messages;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error desconocido:', error);
    }
    throw error;
  }
};

export const leaveWorkspace = async (workspaceId: string): Promise<void> => {
  try {
    await api.delete(`/api/workspaces/${workspaceId}/leave`);
  } catch (error) {
    console.error('Error abandonando workspace:', error);
    throw error;
  }
};