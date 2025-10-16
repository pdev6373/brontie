import jsPDF from 'jspdf';
import { connectToDatabase } from './mongodb';
import Merchant from '@/models/Merchant';
import Voucher from '@/models/Voucher';
import Transaction from '@/models/Transaction';
import GiftItem from '@/models/GiftItem';
import mongoose from 'mongoose';

export interface ReportData {
  merchant: {
    name: string;
    contactEmail: string;
    logoUrl?: string;
  };
  reportPeriod: {
    from: string;
    to: string;
  };
  totalRevenue: number;
  totalPayoutFromBrontie: number;
  activeVouchers: number;
  redeemedVouchers: number;
  payoutThisPeriod: number;
  topSellers: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  payoutDate: string;
  nextPayoutDate: string;
  manageProductsLink: string;
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addHeader(merchantName: string, logoUrl?: string): void {
    // Brontie header with background
    this.doc.setFillColor(20, 184, 166); // Primary teal color
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Brontie logo text (white on teal background)
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.text('Brontie', this.margin, 30);
    
    
    this.currentY = 70;
    
    // Report title with merchant name
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`${merchantName}`, this.margin, this.currentY);
    
    this.currentY += 8;
    
    // Report subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Weekly Performance Report', this.margin, this.currentY);
    
    this.currentY += 20;
    
    // Report period with styled box
    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // Gray text
    const today = new Date();
    const reportDate = today.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.doc.text(`Report generated: ${reportDate}`, this.margin + 5, this.currentY + 5);
    
    this.currentY += 35;
  }

  private addSection(title: string): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Section background
    this.doc.setFillColor(249, 250, 251); // Very light gray
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 25, 'F');
    
    // Section border
    this.doc.setDrawColor(20, 184, 166); // Teal border
    this.doc.setLineWidth(2);
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 25, 'S');

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, this.margin + 10, this.currentY + 8);
    
    this.currentY += 30;
  }

  private addMetricRow(label: string, value: string, color: [number, number, number] = [0, 0, 0]): void {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Metric background
    this.doc.setFillColor(255, 255, 255); // White background
    this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), 20, 'F');
    
    // Metric border
    this.doc.setDrawColor(229, 231, 235); // Light gray border
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), 20, 'S');

    // Label
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // Gray text
    this.doc.text(label + ':', this.margin + 10, this.currentY + 8);
    
    // Value
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.text(value, this.pageWidth - this.margin - this.doc.getTextWidth(value) - 10, this.currentY + 8);
    
    this.currentY += 25;
  }

  private addTopSellersTable(topSellers: ReportData['topSellers']): void {
    if (this.currentY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.addSection('Top Selling Items (Last 30 Days)');
    
    if (topSellers.length === 0) {
      // No data message with styling
      this.doc.setFillColor(254, 242, 242); // Light red background
      this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 25, 'F');
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(127, 29, 29); // Red text
      this.doc.text('No sales data available for this period', this.margin + 10, this.currentY + 8);
      this.currentY += 35;
      return;
    }

    // Table header with background
    this.doc.setFillColor(20, 184, 166); // Teal background
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), 20, 'F');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255); // White text
    
    this.doc.text('Item', this.margin + 10, this.currentY + 8);
    this.doc.text('Sales', this.margin + 100, this.currentY + 8);
    this.doc.text('Revenue', this.margin + 140, this.currentY + 8);
    
    this.currentY += 25;
    
    // Table rows with alternating colors
    topSellers.slice(0, 5).forEach((item, index) => {
      if (this.currentY > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(249, 250, 251); // Light gray
      } else {
        this.doc.setFillColor(255, 255, 255); // White
      }
      this.doc.rect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), 18, 'F');

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      
      // Rank with number for top 3
      const rankText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}.`;
      this.doc.text(`${rankText} ${item.name}`, this.margin + 10, this.currentY + 8);
      this.doc.text(item.sales.toString(), this.margin + 100, this.currentY + 8);
      this.doc.text(`€${item.revenue.toFixed(2)}`, this.margin + 140, this.currentY + 8);
      
      this.currentY += 20;
    });
    
    this.currentY += 15;
  }

  private addFooter(manageProductsLink: string): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.currentY += 20;
    
    // Footer section with background
    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.rect(this.margin, this.currentY - 10, this.pageWidth - (this.margin * 2), 80, 'F');
    
    // Border
    this.doc.setDrawColor(20, 184, 166); // Teal border
    this.doc.setLineWidth(2);
    this.doc.rect(this.margin, this.currentY - 10, this.pageWidth - (this.margin * 2), 80, 'S');
    
    // Manage products section
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(20, 184, 166);
    this.doc.text('Manage Your Products:', this.margin + 10, this.currentY + 5);
    
    this.currentY += 12;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(59, 130, 246); // Blue link color
    this.doc.text(manageProductsLink, this.margin + 10, this.currentY);
    
    this.currentY += 20;
    
    // Footer note - split long text into multiple lines
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // Gray text
    
    // Split the long text into multiple lines
    const longText = 'This report is automatically generated every Wednesday before your Friday payout.';
    const words = longText.split(' ');
    let currentLine = '';
    let lineCount = 0;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (this.doc.getTextWidth(testLine) > (this.pageWidth - this.margin * 2 - 20)) {
        if (currentLine) {
          this.doc.text(currentLine, this.margin + 10, this.currentY);
          this.currentY += 8;
          lineCount++;
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      this.doc.text(currentLine, this.margin + 10, this.currentY);
      this.currentY += 8;
    }
    
    this.doc.text('For support, contact hello@brontie.com', this.margin + 10, this.currentY);
  }

  public generateReport(data: ReportData): Buffer {
    this.addHeader(data.merchant.name, data.merchant.logoUrl);
    
    this.addSection('Financial Summary');
    this.addMetricRow('Total Revenue', `€${data.totalRevenue.toFixed(2)}`, [20, 184, 166]); // Teal
    this.addMetricRow('Total Payout from Brontie', `€${data.totalPayoutFromBrontie.toFixed(2)}`, [34, 197, 94]); // Green
    this.addMetricRow('Payout This Period', `€${data.payoutThisPeriod.toFixed(2)}`, [245, 158, 11]); // Amber
    
    this.currentY += 10;
    
    this.addSection('Voucher Activity');
    this.addMetricRow('Active Vouchers', data.activeVouchers.toString(), [59, 130, 246]); // Blue
    this.addMetricRow('Redeemed Vouchers', data.redeemedVouchers.toString(), [34, 197, 94]); // Green
    
    this.currentY += 10;
    
    this.addSection('Payout Schedule');
    this.addMetricRow('Payout Date', data.payoutDate, [245, 158, 11]); // Amber
    this.addMetricRow('Next Payout Date', data.nextPayoutDate, [34, 197, 94]); // Green
    
    this.addTopSellersTable(data.topSellers);
    this.addFooter(data.manageProductsLink);
    
    return Buffer.from(this.doc.output('arraybuffer'));
  }
}

// Helper function to get next payout date (2nd and 4th Friday) - same as dashboard
function getNextPayoutDate(): string {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 5 = Friday
  
  // Find next Friday
  let daysUntilFriday = 5 - currentDay;
  if (daysUntilFriday <= 0) daysUntilFriday += 7;
  
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + daysUntilFriday);
  
  // Check if it's 2nd or 4th Friday of the month
  const weekOfMonth = Math.ceil((nextFriday.getDate() - 1) / 7);
  
  if (weekOfMonth === 2 || weekOfMonth === 4) {
    return nextFriday.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }
  
  // Find the next 2nd or 4th Friday
  let targetWeek = weekOfMonth < 2 ? 2 : 4;
  if (weekOfMonth > 4) {
    targetWeek = 2;
    nextFriday.setMonth(nextFriday.getMonth() + 1);
  }
  
  const targetDate = new Date(nextFriday);
  targetDate.setDate(1 + (targetWeek - 1) * 7);
  
  // Adjust to Friday
  while (targetDate.getDay() !== 5) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  return targetDate.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
}

export async function generateCafeReport(merchantId: string): Promise<Buffer> {
  await connectToDatabase();
  
  const merchantObjectId = new mongoose.Types.ObjectId(merchantId);
  
  // Get merchant details
  const merchant = await Merchant.findById(merchantObjectId);
  if (!merchant) {
    throw new Error('Merchant not found');
  }

  // Get date range for last 30 days (same as dashboard)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Enforce minimum start date: Sep 26, 2025 08:16 AM UTC (same as dashboard)
  const MIN_START_ISO = '2025-09-26T08:16:00.000Z';
  const minStartDate = new Date(MIN_START_ISO);
  const effectiveStartDate = new Date(Math.max(thirtyDaysAgo.getTime(), minStartDate.getTime()));

  // Get active vouchers (unredeemed, valid) - same logic as dashboard
  const activeVouchers = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: { $in: ['issued', 'pending', 'unredeemed'] },
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalValue: { $sum: '$giftItem.price' }
      }
    }
  ]);

  // Get redeemed vouchers - same logic as dashboard
  const redeemedVouchers = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: 'redeemed',
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalValue: { $sum: '$giftItem.price' }
      }
    }
  ]);

  // Get top selling items (last 30 days) - based on vouchers (active + redeemed) - same logic as dashboard
  const topSellingItems = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: { $in: ['issued', 'pending', 'unredeemed', 'redeemed'] },
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: '$giftItemId',
        name: { $first: '$giftItem.name' },
        sales: { $sum: 1 },
        revenue: { $sum: '$giftItem.price' }
      }
    },
    {
      $sort: { sales: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // Calculate revenue based on vouchers (active + redeemed) - this represents actual sales - same as dashboard
  const voucherSales = await Voucher.aggregate([
    {
      $lookup: {
        from: 'giftitems',
        localField: 'giftItemId',
        foreignField: '_id',
        as: 'giftItem'
      }
    },
    {
      $unwind: '$giftItem'
    },
    {
      $match: {
        'giftItem.merchantId': merchantObjectId,
        status: { $in: ['issued', 'pending', 'unredeemed', 'redeemed'] },
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$giftItem.price' },
        totalSales: { $sum: 1 }
      }
    }
  ]);

  // Calculate payout (net after fees) using completed transactions
  const completedPurchases = await Transaction.aggregate([
    {
      $match: {
        merchantId: merchantObjectId,
        type: 'purchase',
        status: 'completed',
        createdAt: { $gte: minStartDate }
      }
    },
    {
      $lookup: {
        from: 'vouchers',
        localField: 'voucherId',
        foreignField: '_id',
        as: 'voucher'
      }
    },
    { $unwind: '$voucher' },
    { $match: { 'voucher.createdAt': { $gte: minStartDate } } },
    {
      $group: {
        _id: null,
        totalPayout: { $sum: '$amount' },
        totalStripeFees: { $sum: { $multiply: ['$amount', 0.029] } }, // 2.9% Stripe fee
        totalBrontieFees: { $sum: { $multiply: ['$amount', 0.05] } }, // 5% Brontie fee
        netToCafe: { $sum: { $subtract: ['$amount', { $multiply: ['$amount', 0.079] }] } } // Net after all fees
      }
    }
  ]);

  const totalRevenue = voucherSales[0]?.totalRevenue || 0;
  const totalPayoutFromBrontie = completedPurchases[0]?.netToCafe || 0;
  const payoutThisPeriod = redeemedVouchers[0]?.totalValue || 0;

  const topSellers = topSellingItems.map(item => ({
    name: item.name,
    sales: item.sales,
    revenue: item.revenue
  }));

  const reportData: ReportData = {
    merchant: {
      name: merchant.name,
      contactEmail: merchant.contactEmail,
      logoUrl: merchant.logoUrl
    },
    reportPeriod: {
      from: effectiveStartDate.toLocaleDateString('en-GB'),
      to: new Date().toLocaleDateString('en-GB')
    },
    totalRevenue,
    totalPayoutFromBrontie,
    activeVouchers: activeVouchers[0]?.total || 0,
    redeemedVouchers: redeemedVouchers[0]?.total || 0,
    payoutThisPeriod,
    topSellers,
    payoutDate: getNextPayoutDate(),
    nextPayoutDate: getNextPayoutDate(), // Same function for both
    manageProductsLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.com'}/cafes/items`
  };

  const generator = new PDFReportGenerator();
  return generator.generateReport(reportData);
}
