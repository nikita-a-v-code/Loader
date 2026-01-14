const getApiBaseUrl = () => {
  // Проверяем localStorage для переопределения URL
  const savedUrl = localStorage.getItem("REACT_APP_API_URL");
  return savedUrl || process.env.REACT_APP_API_URL || "http://localhost:3001";
};

// Получить токен из localStorage
const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

/* Единый класс, через который в компонентах будет вызываться любая функция api сервиса */
class ApiService {
  /* Основной переиспользуемый другими запросами ниже запрос */
  static async request(endpoint, options = {}) {
    const url = `${getApiBaseUrl()}/api/${endpoint}`;
    const token = getAuthToken();

    const config = {
      headers: {
        "Content-Type": "application/json",
        // Добавляем токен авторизации к каждому запросу
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Если токен невалидный - выбрасываем специальную ошибку
      if (response.status === 401) {
        const error = new Error("Unauthorized");
        error.status = 401;
        throw error;
      }

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

  static async getRkesByMpes(mpesId) {
    return this.get(`rkes/by-mpes/${mpesId}`);
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

  static async getMasterUnitsByRkes(rkesId) {
    return this.get(`master-units/by-rkes/${rkesId}`);
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

  static async setDefaultIpAddress(id) {
    return this.post(`ip/${id}/default`);
  }

  static async clearDefaultIpAddress() {
    return this.post("ip/default/clear");
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

  static async setDefaultProtocol(id) {
    return this.post(`protocols/${id}/default`);
  }

  static async clearDefaultProtocol() {
    return this.post("protocols/default/clear");
  }

  /* Методы для населенных пунктов */
  static async getSettlements() {
    return this.get("settlements");
  }

  static async createSettlement(data) {
    return this.post("settlements", data);
  }

  static async updateSettlement(id, data) {
    return this.put(`settlements/${id}`, data);
  }

  static async deleteSettlement(id) {
    return this.delete(`settlements/${id}`);
  }

  /* Методы для улиц */
  static async getStreets() {
    return this.get("streets");
  }

  static async getStreetsBySettlement(settlementId) {
    return this.get(`streets/by-settlement/${settlementId}`);
  }

  static async createStreet(data) {
    return this.post("streets", data);
  }

  static async updateStreet(id, data) {
    return this.put(`streets/${id}`, data);
  }

  static async deleteStreet(id) {
    return this.delete(`streets/${id}`);
  }

  /* Метод для выгрузки в Excel */
  static async exportToExcel(data) {
    const url = `${getApiBaseUrl()}/api/excel/export`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Получаем blob для скачивания файла
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `loader_data_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  /* Метод для отправки Excel на email */
  static async sendExcelToEmail(data, email) {
    return this.post("excel/send-email", { data, email });
  }

  /* Настройки */
  static async getEmails() {
    return this.get("settings/emails");
  }

  static async createEmail(data) {
    return this.post("settings/emails", data);
  }

  static async updateEmail(id, data) {
    return this.put(`settings/emails/${id}`, data);
  }

  static async deleteEmail(id) {
    return this.delete(`settings/emails/${id}`);
  }

  static async setDefaultEmailById(id) {
    return this.post(`settings/emails/${id}/default`);
  }

  static async getDefaultEmail() {
    return this.get("settings/default-email");
  }

  static async setDefaultEmail(defaultEmail) {
    return this.post("settings/default-email", { defaultEmail });
  }

  /* Методы для портов */
  static async getNextPort() {
    return this.get("ports/next");
  }

  static async createPort(data) {
    return this.post("ports", data);
  }

  static async getPorts() {
    return this.get("ports");
  }

  /* Методы для пользователей */
  static async getUsers() {
    return this.get("users");
  }

  static async getUser(id) {
    return this.get(`users/${id}`);
  }

  static async createUser(data) {
    return this.post("users", data);
  }

  static async updateUser(id, data) {
    return this.put(`users/${id}`, data);
  }

  static async deleteUser(id) {
    return this.delete(`users/${id}`);
  }

  /* Методы для ролей пользователей */
  static async getUserRoles() {
    return this.get("users/roles");
  }

  /* Методы авторизации */
  static async login(login, password) {
    return this.post("users/login", { login, password });
  }

  // Получить текущего пользователя по токену
  static async getCurrentUser() {
    return this.get("users/me");
  }
}

export default ApiService;
