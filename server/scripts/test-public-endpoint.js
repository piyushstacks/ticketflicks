import axios from 'axios';

async function testPublicEndpoint() {
  try {
    const theatreId = '697b7e398e1404979c6db9f9';
    console.log('Testing public endpoint with theatre ID:', theatreId);
    
    const response = await axios.get(`http://localhost:3000/api/public/screens/theatre/${theatreId}`);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing public endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testPublicEndpoint();