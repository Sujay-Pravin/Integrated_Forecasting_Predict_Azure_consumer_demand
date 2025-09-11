const BASE_URL = 'http://localhost:5000/api/features';

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const feature_endpoints = {
  // Existing endpoints
  dates: "dates",
  months: "months",
  datesInMonth: (month) => `dates/${month}`,

  // Single-date endpoints
  cpu: (date) => `${date}/cpu`,
  storage: (date) => `${date}/storage`,
  users: (date) => `${date}/users`,
  economy: (date) => `${date}/economy`,
  summary: (date) => `${date}/summary`,


  cpuRange: (date, days) => `range/${date}/${days}/cpu`,
  storageRange: (date, days) => `range/${date}/${days}/storage`,
  usersRange: (date, days) => `range/${date}/${days}/users`,
  economyRange: (date, days) => `range/${date}/${days}/economy`,
  holidaysRange: (date, days) => `range/${date}/${days}/holidays`,
  summaryRange: (date, days) => `range/${date}/${days}/summary`,
  cpuInsights: (date, days) => `range/${date}/${days}/insights/cpu`,
  storageInsights: (date, days) => `range/${date}/${days}/insights/storage`,
  usersInsights: (date, days) => `range/${date}/${days}/insights/users`,

  cpuRoll: (window) => `cpu/rolling/${window}`,
  storageRoll: (window) => `storage/rolling/${window}`,
  usersRoll: (window) => `users/rolling/${window}`,
};
