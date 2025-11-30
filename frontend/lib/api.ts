const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Position {
  x: number;
  y: number;
}

export interface Scale {
  width: number;
  height: number;
}

export interface Model3D {
  id: string;
  url: string;
  position: Position;
  scale: Scale;
}

export interface Store {
  id: string;
  _id: string;
  name: string;
  backgroundImage: string;
  models: Model3D[];
  activeUsers: number;
}

export const api = {
  async getStores(): Promise<Store[]> {
    const response = await fetch(`${API_URL}/api/stores`);
    if (!response.ok) throw new Error("Failed to fetch stores");
    return response.json();
  },

  async getStore(id: string): Promise<Store> {
    const response = await fetch(`${API_URL}/api/stores/${id}`);
    if (!response.ok) throw new Error("Failed to fetch store");
    return response.json();
  },

  async updateModelPosition(
    storeId: string,
    modelId: string,
    position: Position
  ) {
    const response = await fetch(
      `${API_URL}/api/stores/${storeId}/models/${modelId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update model position: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};
