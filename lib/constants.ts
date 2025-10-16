// Ireland Counties List
export const IRELAND_COUNTIES = [
  'Carlow',
  'Cavan', 
  'Clare',
  'Cork',
  'Donegal',
  'Dublin',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow'
] as const;

export type IrelandCounty = typeof IRELAND_COUNTIES[number];

// Business Categories
export const BUSINESS_CATEGORIES = [
  'Café & Treats',
  'Tickets & Passes', 
  'Dining & Meals',
  'Other'
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

