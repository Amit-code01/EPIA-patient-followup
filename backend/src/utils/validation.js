const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function validatePatient(body = {}) {
  const errors = [];
  for (const field of ['name', 'phone', 'consultation_date', 'next_followup_date']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) errors.push(`${field} is required`);
  }
  if (body.name && body.name.trim().length > 100) errors.push('name must be 100 characters or fewer');
  if (body.phone && !/^\+?[0-9][0-9\s().-]{6,19}$/.test(body.phone.trim())) errors.push('phone must be a valid phone number');
  for (const field of ['consultation_date', 'next_followup_date']) if (body[field] && !validDate(body[field])) errors.push(`${field} must be a valid YYYY-MM-DD date`);
  if (validDate(body.consultation_date) && validDate(body.next_followup_date) && body.consultation_date > body.next_followup_date) errors.push('consultation_date cannot be after next_followup_date');
  return errors;
}
module.exports = { validDate, validatePatient };
