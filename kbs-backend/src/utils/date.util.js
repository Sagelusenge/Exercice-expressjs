// Date utility
module.exports = {
  now: () => new Date(),
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  formatDate: (date, format = 'YYYY-MM-DD') => {
    // Date formatting logic
    return date.toISOString().split('T')[0];
  },
};
