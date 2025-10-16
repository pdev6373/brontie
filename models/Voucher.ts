import mongoose, { Schema, Document } from 'mongoose';

export interface IVoucher extends Document {
  giftItemId: mongoose.Types.ObjectId;
  status: 'redeemed' | 'unredeemed' | 'refunded' | 'pending' | 'issued' | 'expired' | 'disputed';
  createdAt: Date;
  redeemedAt?: Date;
  refundedAt?: Date;
  confirmedAt?: Date;
  issuedAt?: Date;
  expiresAt?: Date;
  recipientName?: string;
  senderName?: string;
  email?: string; // Customer email for sending payment success emails
  redemptionLink: string;
  validLocationIds: mongoose.Types.ObjectId[];
  paymentIntentId?: string;
  amount?: number;
  amountGross?: number;
  stripeFee?: number;
  productSku?: string;
  redemptionCode?: string;
  // Viral loop fields
  recipientToken?: string;
  recipientBecameSender?: boolean;
  recipientLinkedSenderEmail?: string;
  recipientEmail?: string;
}

const VoucherSchema: Schema = new Schema(
  {
    giftItemId: { type: Schema.Types.ObjectId, ref: 'GiftItem', required: true },
    status: { 
      type: String, 
      enum: ['redeemed', 'unredeemed', 'refunded', 'pending', 'issued', 'expired', 'disputed'], 
      default: 'pending',
      required: true 
    },
    redeemedAt: { type: Date },
    refundedAt: { type: Date },
    confirmedAt: { type: Date },
    issuedAt: { type: Date },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) }, // 5 years from now
    recipientName: { type: String },
    senderName: { type: String },
    email: { type: String }, // Customer email for sending payment success emails
    redemptionLink: { type: String, required: true, unique: true },
    validLocationIds: [{ type: Schema.Types.ObjectId, ref: 'MerchantLocation' }],
    paymentIntentId: { type: String, unique: true },
    amount: { type: Number },
    amountGross: { type: Number },
    stripeFee: { type: Number },
    productSku: { type: String },
    redemptionCode: { type: String },
    // Viral loop fields
    recipientToken: { type: String, unique: true, sparse: true },
    recipientBecameSender: { type: Boolean, default: false },
    recipientLinkedSenderEmail: { type: String },
    recipientEmail: { type: String },
  },
  { timestamps: true }
);

// Index for faster lookups
VoucherSchema.index({ giftItemId: 1 });
VoucherSchema.index({ status: 1 });
VoucherSchema.index({ recipientToken: 1 });
VoucherSchema.index({ issuedAt: 1 });
VoucherSchema.index({ redeemedAt: 1 });
VoucherSchema.index({ productSku: 1 });
VoucherSchema.index({ expiresAt: 1 });

// Check if the model exists before creating it to prevent overwriting during hot reloads
export default mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', VoucherSchema);
