// Auto-select API base URL: use local API when running on localhost
export const BaseUrl = (typeof window !== 'undefined' && window.location.hostname.match(/^(localhost|127\.0\.0\.1)$/))
  ? "http://localhost:5000"
  : "https://bharathaimain.onrender.com";
 
