// ============================================
// OZOBATH - Shiprocket Configuration
// ============================================
const env = require('./env');

class ShiprocketClient {
  constructor() {
    this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: env.SHIPROCKET_EMAIL,
          password: env.SHIPROCKET_PASSWORD,
        }),
      });

      const data = await response.json();
      if (!data.token) throw new Error('Shiprocket auth failed');

      this.token = data.token;
      this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 10 days validity, refresh at 9
      return this.token;
    } catch (error) {
      console.error('❌ Shiprocket auth error:', error.message);
      throw error;
    }
  }

  async request(method, endpoint, body = null) {
    const token = await this.getToken();
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    return response.json();
  }

  // Create a Shiprocket order
  async createOrder(orderData) {
    return this.request('POST', '/orders/create/adhoc', orderData);
  }

  // Generate AWB for shipment
  async generateAWB(shipmentId, courierCompanyId) {
    return this.request('POST', '/courier/assign/awb', {
      shipment_id: shipmentId,
      courier_id: courierCompanyId,
    });
  }

  // Get available couriers for a shipment
  async getAvailableCouriers(pickupPincode, deliveryPincode, weight, cod = false) {
    return this.request('GET',
      `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod ? 1 : 0}`
    );
  }

  // Track shipment by AWB
  async trackByAWB(awbCode) {
    return this.request('GET', `/courier/track/awb/${awbCode}`);
  }

  // Track shipment by Shiprocket shipment ID
  async trackByShipmentId(shipmentId) {
    return this.request('GET', `/courier/track/shipment/${shipmentId}`);
  }

  // Cancel an order
  async cancelOrder(orderIds) {
    return this.request('POST', '/orders/cancel', { ids: orderIds });
  }

  // Generate shipping label
  async generateLabel(shipmentId) {
    return this.request('POST', '/courier/generate/label', {
      shipment_id: [shipmentId],
    });
  }

  // Generate invoice
  async generateInvoice(orderIds) {
    return this.request('POST', '/orders/print/invoice', {
      ids: orderIds,
    });
  }

  // Schedule a pickup
  async schedulePickup(shipmentId) {
    return this.request('POST', '/courier/generate/pickup', {
      shipment_id: [shipmentId],
    });
  }
}

module.exports = new ShiprocketClient();
