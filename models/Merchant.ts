import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchant extends Document {
  name: string;
  description?: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  address: string;
  county: 'Carlow' | 'Cavan' | 'Clare' | 'Cork' | 'Donegal' | 'Dublin' | 'Galway' | 'Kerry' | 'Kildare' | 'Kilkenny' | 'Laois' | 'Leitrim' | 'Limerick' | 'Longford' | 'Louth' | 'Mayo' | 'Meath' | 'Monaghan' | 'Offaly' | 'Roscommon' | 'Sligo' | 'Tipperary' | 'Waterford' | 'Westmeath' | 'Wexford' | 'Wicklow';
  businessCategory: 'Café & Treats' | 'Tickets & Passes' | 'Dining & Meals' | 'Other';
  adminUserId?: string;
  isActive: boolean;
  status: 'pending' | 'approved' | 'denied';
  tags: string[];
  payoutDetails?: {
    accountHolderName?: string;
    iban?: string;
    bic?: string;
  };
  tempPassword?: string;
  password?: string;
  
  // Novos campos para Stripe Connect
  stripeConnectSettings?: {
    accountId?: string;
    isConnected: boolean;
    onboardingCompleted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  };
  
  // Configurações de comissão
  brontieFeeSettings?: {
    isActive?: boolean;
    activatedAt?: Date;
    deactivatedAt?: Date;
    deactivatedBy?: string;
    deactivationReason?: string;
    commissionRate: number; // 10%
    commissionActivateFrom?: Date; // 90 dias após criação
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    logoUrl: { type: String },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    website: { type: String },
    address: { type: String, required: true },
    county: { 
      type: String, 
      required: true,
      enum: ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'],
      default: 'Dublin'
    },
    businessCategory: { 
      type: String, 
      required: true,
      enum: ['Café & Treats', 'Tickets & Passes', 'Dining & Meals', 'Other'],
      default: 'Café & Treats'
    },
    adminUserId: { type: String }, // Will be used for merchant portal authentication
    isActive: { type: Boolean, default: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'denied'], 
      default: 'pending' 
    },
    tags: [{ type: String }],
    payoutDetails: {
      accountHolderName: { type: String, required: false },
      iban: { type: String, required: false },
      bic: { type: String, required: false }
    },
    tempPassword: { type: String },
    password: { type: String },
    
    // Novos campos para Stripe Connect
    stripeConnectSettings: {
      accountId: { type: String },
      isConnected: { type: Boolean, default: false },
      onboardingCompleted: { type: Boolean, default: false },
      chargesEnabled: { type: Boolean, default: false },
      payoutsEnabled: { type: Boolean, default: false },
      detailsSubmitted: { type: Boolean, default: false },
    },
    
    // Configurações de comissão
    brontieFeeSettings: {
      isActive: { type: Boolean, default: false },
      commissionRate: { type: Number, default: 0.10 }, // 10%
      commissionActivateFrom: { type: Date },
      activatedAt: { type: Date },
      deactivatedAt: { type: Date },
      deactivatedBy: { type: String },
      deactivationReason: { type: String },
    },
  },
  { timestamps: true }
);

// Index for faster lookups
MerchantSchema.index({ adminUserId: 1 });
MerchantSchema.index({ isActive: 1 });
MerchantSchema.index({ status: 1 });
MerchantSchema.index({ tags: 1 });
MerchantSchema.index({ county: 1 });

export default mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', MerchantSchema);
