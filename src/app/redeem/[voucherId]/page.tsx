import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RedeemVoucherClient from './RedeemVoucherClient';

export async function generateMetadata({ }: { params: Promise<{ voucherId: string }> }): Promise<Metadata> {
  try {
    // Return basic metadata to avoid errors
    return {
      title: 'Gift Voucher Redemption',
      description: 'Redeem your gift voucher',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Gift Voucher',
      description: 'Gift voucher redemption page',
    };
  }
}

export default async function RedeemVoucherPage({ params }: { params: Promise<{ voucherId: string }> }) {
  try {
    const { voucherId } = await params;
    
    // For now, just pass the voucherId to the client component
    // The client component will handle the API call
    return <RedeemVoucherClient voucherId={voucherId} initialData={null} />;
    
  } catch (error) {
    console.error('Error in RedeemVoucherPage:', error);
    notFound();
  }
}