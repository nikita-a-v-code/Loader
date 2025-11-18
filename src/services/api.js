const getApiBaseUrl = () => {
  // Проверяем localStorage для переопределения URL
  const savedUrl = localStorage.getItem("REACT_APP_API_URL");
  return savedUrl || process.env.REACT_APP_API_URL || "http://localhost:3001";
};

/* Единый класс, через который в компонентах будет вызываться любая функция api сервиса */
class ApiService {
  /* Основной переиспользуемый другими запросами ниже запрос */
  static async request(endpoint, options = {}) {
    const url = `${getApiBaseUrl()}/api/${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /* Запросы получения данных */
  static async get(endpoint) {
    return this.request(endpoint);
  }

  /* Запросы создания данных */
  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /* Запросы обновления данных */
  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /* Запросы удаления данных */
  static async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  /* Итоговые методы */
  /* Методы для типов абонентов */
  static async getAbonentTypes() {
    return this.get("abonent-types");
  }

  static async createAbonentType(data) {
    return this.post("abonent-types", data);
  }

  static async updateAbonentType(id, data) {
    return this.put(`abonent-types/${id}`, data);
  }

  static async deleteAbonentType(id) {
    return this.delete(`abonent-types/${id}`);
  }

  /* Методы для типов статусов */
  static async getStatuses() {
    return this.get("statuses");
  }

  static async createStatus(data) {
    return this.post("statuses", data);
  }

  static async updateStatus(id, data) {
    return this.put(`statuses/${id}`, data);
  }

  static async deleteStatus(id) {
    return this.delete(`statuses/${id}`);
  }

  /* Методы для организационной структуры */
  /* Методы для МПЭС */
  static async getMpes() {
    return this.get("mpes");
  }

  static async createMpes(data) {
    return this.post("mpes", data);
  }

  static async updateMpes(id, data) {
    return this.put(`mpes/${id}`, data);
  }

  static async deleteMpes(id) {
    return this.delete(`mpes/${id}`);
  }

  /* Методы для РКЭС */
  static async getRkes() {
    return this.get("rkes");
  }

  static async createRkes(data) {
    return this.post("rkes", data);
  }

  static async updateRkes(id, data) {
    return this.put(`rkes/${id}`, data);
  }

  static async deleteRkes(id) {
    return this.delete(`rkes/${id}`);
  }

  /* Методы для МУ */
  static async getMasterUnits() {
    return this.get("master-units");
  }

  static async createMasterUnit(data) {
    return this.post("master-units", data);
  }

  static async updateMasterUnit(id, data) {
    return this.put(`master-units/${id}`, data);
  }

  static async deleteMasterUnit(id) {
    return this.delete(`master-units/${id}`);
  }

  /* Методы для моделей счетчиков и их паролей */
  static async getDevices() {
    return this.get("device");
  }

  static async createDevice(data) {
    return this.post("device", data);
  }

  static async updateDevice(id, data) {
    return this.put(`device/${id}`, data);
  }

  static async deleteDevice(id) {
    return this.delete(`device/${id}`);
  }

  /* Методы для IP адресов */
  static async getIpAddresses() {
    return this.get("ip");
  }

  static async createIpAddress(data) {
    return this.post("ip", data);
  }

  static async updateIpAddress(id, data) {
    return this.put(`ip/${id}`, data);
  }

  static async deleteIpAddress(id) {
    return this.delete(`ip/${id}`);
  }

  /* Методы для протоколов */
  static async getProtocols() {
    return this.get("protocols");
  }

  static async createProtocol(data) {
    return this.post("protocols", data);
  }

  static async updateProtocol(id, data) {
    return this.put(`protocols/${id}`, data);
  }

  static async deleteProtocol(id) {
    return this.delete(`protocols/${id}`);
  }
}

export default ApiService;
