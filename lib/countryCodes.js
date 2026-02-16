export const countryCodes = [
    { code: '+1', country: 'USA/Canada' },
    { code: '+91', country: 'India' },
    { code: '+44', country: 'UK' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+7', country: 'Russia' },
    { code: '+61', country: 'Australia' },
    { code: '+55', country: 'Brazil' },
    // Add more as needed
].sort((a, b) => a.country.localeCompare(b.country));
