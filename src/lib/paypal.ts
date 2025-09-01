
import axios from 'axios';

const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const getAuthToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(`${PAYPAL_API_BASE}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get PayPal auth token:', error);
    throw new Error('PayPal authentication failed');
  }
};

export const createOrder = async (planId: string) => {
  const accessToken = await getAuthToken();
  
  // This is a simplified example. In a real app, you would fetch plan details from your database
  // and calculate the amount based on the planId.
  const amount = planId === 'PRO' ? '9.99' : '29.99'; // Example prices

  try {
    const response = await axios.post(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount,
          },
        },
      ],
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create PayPal order:', error);
    throw new Error('Failed to create PayPal order');
  }
};

export const captureOrder = async (orderId: string) => {
  const accessToken = await getAuthToken();

  try {
    const response = await axios.post(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to capture PayPal order:', error);
    throw new Error('Failed to capture PayPal order');
  }
};
