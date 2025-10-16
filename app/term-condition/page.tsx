'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const TermCondition = () => {
  return (
    <div className="term-and-condition-page-main !pt-[145px] pb-20 md:py-16">
      <div className="custom-container">
        {/* add tc to scope the Tailwind component styles */}
        <div className="term-and-condition-wrapper tc max-w-4xl mx-auto">
          <div className="mb-8 md:mb-10">
            <h2>Terms &amp; Conditions</h2>
            <p className="mt-4">
              These Terms &amp; Conditions (“Terms”) govern your use of Brontie.
              By using our website, purchasing or redeeming a Brontie, or
              partnering as a cafe, you agree to these Terms.
            </p>
            <p className="mt-3">
              Brontie Limited is registered in Ireland at:
              <br />
              <strong>
                43 Greenfield Drive, Maynooth, Co. Kildare, Ireland.
              </strong>
            </p>
          </div>

          {/* 1. For Customers */}
          <section className="mb-10">
            <h3>1. For Customers</h3>

            <h4 className="mt-6">What Brontie is</h4>
            <p className="mt-2">
              Brontie is Ireland’s first cafe gifting platform. We make it easy
              to send and redeem small gifts like coffees, cakes, and other
              treats. Brontie acts as a facilitator — the actual sale and
              product responsibility belong to the cafe where you redeem.
            </p>

            <h4 className="mt-6">Voucher validity</h4>
            <ul className="tc-list mt-2">
              <li>
                Brontie gifts (“vouchers”) are valid for 5 years from the date
                of purchase (in line with Irish law).
              </li>
              <li>Vouchers cannot be exchanged for cash.</li>
              <li>
                No “change” will be given. For example, if you redeem a €4
                coffee voucher for a €3.50 tea, the remaining €0.50 is not
                refunded.
              </li>
            </ul>

            <h4 className="mt-6">Price changes</h4>
            <ul className="tc-list mt-2">
              <li>
                If the cafe has increased its prices since purchase, you may be
                asked to pay the difference at the till.
              </li>
              <li>
                Cafes can allow swaps (e.g. coffee for tea) at their discretion,
                but they are not obliged to provide a like-for-like exchange.
              </li>
            </ul>

            <h4 className="mt-6">Refunds</h4>
            <ul className="tc-list mt-2">
              <li>
                If the wrong email address is used, contact{' '}
                <a href="mailto:hello@brontie.ie">hello@brontie.ie</a> and we’ll
                fix it.
              </li>
              <li>
                If a cafe closes down or leaves Brontie, we’ll refund your
                unredeemed voucher.
              </li>
              <li>
                If a gift has not been redeemed after 3 months, you can request
                a refund at any time.
              </li>
            </ul>

            <h4 className="mt-6">Limitations</h4>
            <ul className="tc-list mt-2">
              <li>
                Brontie is not responsible for product quality, safety, or cafe
                service. These are the responsibility of the cafe.
              </li>
              <li>
                Our maximum liability is the original value of your voucher.
              </li>
            </ul>
          </section>

          {/* 2. For Cafes */}
          <section className="mb-10">
            <h3>2. For Cafes</h3>

            <h4 className="mt-6">Payments</h4>
            <ul className="tc-list mt-2">
              <li>
                Payouts are made every two weeks (on even-numbered weeks).
              </li>
              <li>
                Payouts are visible in your cafe dashboard, showing total sales
                minus transaction fees &amp; our platform fee.
              </li>
              <li>Payments are processed via Stripe Connect.</li>
            </ul>

            <h4 className="mt-6">VAT &amp; compliance</h4>
            <ul className="tc-list mt-2">
              <li>
                Cafes are responsible for accounting for VAT on all redeemed
                sales.
              </li>
              <li>
                Brontie may request VAT receipts or records to comply with
                Revenue checks.
              </li>
            </ul>

            <h4 className="mt-6">Pricing &amp; flexibility</h4>
            <ul className="tc-list mt-2">
              <li>
                Cafes may raise prices at any time, but suspicious or
                exploitative changes (e.g. during events) may result in a
                warning or suspension.
              </li>
              <li>
                Cafes are free to allow product swaps (e.g. coffee for tea), but
                not required.
              </li>
            </ul>

            <h4 className="mt-6">Obligations</h4>
            <ul className="tc-list mt-2">
              <li>
                Cafes must honour Brontie vouchers during normal trading hours.
              </li>
              <li>
                If a cafe leaves Brontie, Brontie will refund all unredeemed
                vouchers linked to that cafe.
              </li>
            </ul>

            <h4 className="mt-6">Liability</h4>
            <ul className="tc-list mt-2">
              <li>
                Brontie is a facilitator and does not take responsibility for
                food or drink quality, health and safety, or customer service.
              </li>
              <li>
                Fraudulent redemptions, fake chargebacks, or other abuse may
                result in suspension and referral to relevant authorities.
              </li>
            </ul>
          </section>

          {/* 3. General */}
          <section className="mb-10">
            <h3>3. General</h3>

            <h4 className="mt-6">Force majeure</h4>
            <p className="mt-2">
              Brontie is not liable for failure to perform due to events outside
              our reasonable control — including strikes, pandemics, internet
              outages, payment processor failures, or other unexpected
              circumstances.
            </p>

            <h4 className="mt-6">Updates to Terms</h4>
            <p className="mt-2">
              We may update these Terms from time to time. The latest version
              published on www.brontie.ie is binding.
            </p>

            <h4 className="mt-6">Disputes</h4>
            <p className="mt-2">
              If you have a complaint or dispute, contact{' '}
              <a href="mailto:hello@brontie.ie">hello@brontie.ie</a>. Irish law
              governs these Terms.
            </p>
          </section>
        </div>
      </div>

      {/* CTA */}
      <div className="custom-container">
        <div className="site-cts-wrapper-area mt-16 md:mt-20 xl:mt-[129px] -mb-[280px] md:-mb-[210px] lg:-mb-[270px] xl:-mb-[388px] relative z-[999] grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16 lg:gap-20 pt-[30px] md:pt-[47px] pr-[11px] md:pr-10 lg:pr-[56px] pb-[27px] md:pb-[34px] pl-0 md:pl-14 lg:pl-[77px] rounded-[22px]">
          <div className="site-cta-left-cont flex flex-col justify-center items-start pl-[26px] md:pl-0">
            <h2 className="title text-left text-[34px] lg:text-[46px] xl:text-[60px] text-mono-0 font-normal font-primary leading-[120%] max-w-[553px]">
              “Brighten someone’s day. Gift a Brontie today.”
            </h2>
            <div className="button-item relative mt-8 md:mt-9 lg:mt-[50px]">
              <Link
                className="bg-secondary-100 hover:opacity-85 flex relative z-[9] h-[49px] md:h-[60px] lg:h-[79px] items-center max-w-[305px] w-full justify-center py-4 md:py-5 xl:py-[27px] pl-[35px] pr-[19px] rounded-[11px] text-[12px] md:text-[18px] lg:text-[22px] text-center font-secondary font-normal leading-[1]"
                href="/products"
              >
                Gift a Brontie today →
              </Link>
              <Image
                src="/images/icons/shadow-elisp.svg"
                width={233}
                height={41}
                alt="angle arrow model"
                className="absolute -bottom-[45px] -left-[26px] right-0 mx-auto"
              />
            </div>
          </div>
          <div className="site-cta-right-cont">
            <Image
              src="/images/cta-section-model.png"
              alt="cta model image"
              width={626}
              height={480}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermCondition;
