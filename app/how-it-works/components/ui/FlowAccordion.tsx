'use client';
import { ReactNode, useState } from 'react';
import Image from 'next/image';

type Section = {
  icon: string;
  title: string;
  content: ReactNode;
};

const sections: Section[] = [
  {
    title: 'Onboarding',
    icon: '/images/pngs/onboarding.png',
    content: (
      <ul className="list-disc pl-6 space-y-1 text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
        <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          Click the link to get started — add your café details and first
          product (optional).
        </li>
        <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          Brontie reviews your application within 24 hours. Once approved, you
          can:
          <ul className="list-decimal pl-6 space-y-1">
            <li className="text-[#4B5563]">Update your profile</li>
            <li className="text-[#4B5563]">Add your IBAN for payouts</li>
            <li className="text-[#4B5563]">Manage products and prices</li>
          </ul>
        </li>
        <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          ✅ And that's it — your café is live and ready for gifting!
        </li>
      </ul>
    ),
  },
  {
    title: 'Dashboard',
    icon: '/images/pngs/trend.png',
    content: (
      <div>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          Every café on Brontie gets access to their own simple dashboard — a
          clear overview of how gifts and redemptions are performing.
        </p>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          You can easily:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            See all active and redeemed vouchers (with timestamps and café
            details for multi-location partners)
          </li>
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            Track sales and redemption trends over time
          </li>
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            View upcoming payouts and summaries at a glance
          </li>
        </ul>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          All key info is also shared automatically before each payout, so it's
          easy to stay on top of everything — even on your busiest days.
        </p>
      </div>
    ),
  },
  {
    title: 'Redeeming',
    icon: '/images/pngs/dashboard.png',
    content: (
      <div>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          When someone comes in to use their Brontie gift, it's quick and secure
          — no codes or confusion.
        </p>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          Here's how it works:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            The customer opens their Brontie gift link and taps Redeem — this
            activates their phone camera.
          </li>
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            They simply scan your café's Brontie QR plaque on the counter.
          </li>
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            The system instantly verifies the voucher and marks it as redeemed
            in your dashboard.
          </li>
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            Each voucher is single-use, timestamped, and can't be reused or
            shared — even if someone screenshots it.
          </li>
        </ul>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          💡 For cafés with a POS scanner, there's also the option to scan the
          customer's code directly from their phone instead.
        </p>
      </div>
    ),
  },
  {
    title: 'Getting Paid',
    icon: '/images/pngs/money.png',
    content: (
      <div>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          Joining Brontie is completely free — there are no setup or monthly
          fees.
        </p>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          You only pay a small commission when a Brontie gift is redeemed, so
          you earn before you ever pay.
        </p>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          Here's how payments work:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            Payouts: Every 2nd and 4th Friday of the month, cafés are paid
            automatically through Stripe Connect.
          </li>
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            Reports: Before each payout, you'll receive a clear summary showing
            all redeemed and active vouchers.
          </li>
          <li className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
            Fees: Standard Stripe transaction fees apply, plus a small Brontie
            platform commission — both deducted automatically.
          </li>
        </ul>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          It's transparent, secure, and designed so you can focus on your coffee
          — not admin☕
        </p>
      </div>
    ),
  },
  {
    title: 'Support & Next Steps',
    icon: '/images/pngs/support.png',
    content: (
      <div>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          Getting started with Brontie is quick and simple — and you're never on
          your own.
        </p>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          From setup to your very first redemption, our team is here to help
          with any questions.
        </p>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563]">
          We'll guide you through listing your café, uploading products, and
          making the most of your Brontie dashboard.
        </p>
        <p className="text-sm sm:text-sm sm:leading-[30px] text-[#4B5563] mt-2.5">
          As your café grows, we'll be right beside you — helping you attract
          new customers, feature in local campaigns, and get noticed for the
          great work you do. 💛
        </p>
      </div>
    ),
  },
];

export default function FlowAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  return (
    <section className="bg-white pt-[clamp(16px,2.2vw,32px)] pb-2 rounded-2xl">
      <div className="divide-y divide-[#CFCFCF] rounded-2xl">
        {sections.map((section, index) => (
          <div key={index} className="flex flex-col">
            <button
              onClick={() => toggle(index)}
              className="w-full flex justify-between items-center focus:outline-none px-[clamp(16px,2.7vw,40px)] py-3 cursor-pointer"
            >
              <div className="flex items-center gap-3 lg:gap-4">
                {section.icon.includes('money') ? (
                  <Image
                    width={14}
                    height={14}
                    alt={'icon'}
                    src={section.icon}
                  />
                ) : (
                  <Image
                    width={20}
                    height={20}
                    alt={'icon'}
                    src={section.icon}
                  />
                )}
                <p className="text-lg lg:text-xl font-medium text-[#008080]">
                  {section.title}
                </p>
              </div>

              <Image
                width={32}
                height={32}
                alt={'icon'}
                src={'/images/pngs/up-arrow.png'}
                className={`w-5 sm:w-6 lg:w-7 xl:w-8 aspect-square transition-transform duration-300 ${
                  openIndex !== index ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className="grid transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                gridTemplateRows: openIndex === index ? '1fr' : '0fr',
              }}
            >
              <div className="min-w-0 overflow-hidden">
                <div className="px-[clamp(16px,2.7vw,40px)] pb-[clamp(16px,2.2vw,32px)]">
                  {section.content}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
