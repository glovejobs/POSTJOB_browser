// Shared validation functions

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidJobTitle = (title: string): boolean => {
  return title.length >= 3 && title.length <= 200;
};

export const isValidJobDescription = (description: string): boolean => {
  return description.length >= 50 && description.length <= 10000;
};

export const isValidCompanyName = (company: string): boolean => {
  return company.length >= 2 && company.length <= 100;
};

export const isValidLocation = (location: string): boolean => {
  return location.length >= 2 && location.length <= 100;
};

export const isValidSalary = (salary: number): boolean => {
  return salary >= 0 && salary <= 10000000; // Max $10M
};

export const validateJobData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || !isValidJobTitle(data.title)) {
    errors.push('Job title must be between 3 and 200 characters');
  }

  if (!data.description || !isValidJobDescription(data.description)) {
    errors.push('Job description must be between 50 and 10,000 characters');
  }

  if (!data.company || !isValidCompanyName(data.company)) {
    errors.push('Company name must be between 2 and 100 characters');
  }

  if (!data.location || !isValidLocation(data.location)) {
    errors.push('Location must be between 2 and 100 characters');
  }

  if (!data.contactEmail || !isValidEmail(data.contactEmail)) {
    errors.push('Please provide a valid contact email');
  }

  if (data.salaryMin !== undefined && !isValidSalary(data.salaryMin)) {
    errors.push('Minimum salary must be a valid amount');
  }

  if (data.salaryMax !== undefined && !isValidSalary(data.salaryMax)) {
    errors.push('Maximum salary must be a valid amount');
  }

  if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
    errors.push('Minimum salary cannot be greater than maximum salary');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};