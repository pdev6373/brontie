'use client'
import Image from 'next/image';
import Link from 'next/link';
import React, { useRef } from 'react';
import { XIcon } from 'lucide-react';

type Feature = {
  id: string;
  title: string;
  img: { src: string; width: number; height: number; alt: string };
  excerpt: string;
  full: string;
};

const data: Feature[] = [
  {
    id: 'feature-1',
    title:
      'Community gifting platform launching at Willow & Wild Café in Maynooth',
    img: {
      src: '/images/trust-feature-imag1.jpg',
      width: 661,
      height: 441,
      alt: 'trust feature image',
    },
    // 3–5 line excerpt (card view)
    excerpt:
      'Brontie, a new micro-gifting platform, is officially launching at Willow & Wild Café in Maynooth on Friday, August 29 at 2 PM. Brontie enables customers to send small, thoughtful gifts like a coffee or cake to friends, family, or colleagues directly from their phones with no app download required. The recipient can redeem their gift instantly in-store via QR code…',
    // Full modal copy (your exact text, lightly formatted)
    full: `Brontie, a new micro-gifting platform, is officially launching at Willow & Wild Café in Maynooth on Friday, August 29 at 2 PM.
Brontie enables customers to send small, thoughtful gifts like a coffee or cake to friends, family, or colleagues directly from their phones with no app download required.
This initiative blends tech innovation with local community spirit. The recipient can redeem their gift instantly in-store via QR code and Brontie is live in local cafés in Maynooth and Leixlip and is aiming to drive engagement and support for small businesses.`,
  },
  {
    id: 'feature-2',
    title:
      'New gift-giving platform positively received by locals after Maynooth launch',
    img: {
      src: '/images/trust-feature-imag2.png',
      width: 661,
      height: 441,
      alt: 'trust feature image',
    },
    // 3–5 line excerpt (card view)
    excerpt:
      'SIMPLE, straight-forward, appealing to all ages, and a clever way to deliver a kind gesture: this is how new users described the new gift-giving platform known as ‘Brontie,’ which launched at Willow & Wild in Maynooth on Sunday (31st August). Founded by Kevin Homer, Brontie was inspired by gift-giving culture in South Korea…',
    // Full modal copy (your exact text, as provided)
    full: `SIMPLE, straight-forward, appealing to all ages, and a clever way to deliver a kind gesture: this is how new users described the new gift-giving platform known as ‘Brontie,’ which launched for the first time at Willow & Wild in Maynooth on Sunday (31st August).

Founded by Kevin Homer, the concept of Brontie was inspired by the warm, gift-giving culture that Kevin encountered during his time living in South Korea.

“What I found here in Ireland is that you see people here saying, ‘I’ll get you a coffee’ or ‘I’ll get you a pint’ but there’s no concept of doing that until now,” explained Kevin.

“This offers the option where you may not be able to see the person in the short term because everyone is so busy with their lives, but you still want to be in touch with a person.

“It’s not here to replace behaviour, it’s here to amplify the behaviour, and it’s more of a ‘think about me gesture.’

“Parents who are dropping other kids to school might be gifted a Brontie now as a thank you.

“Local people from Maynooth and Leixlip jumped on board because they also want to help local businesses,” Kevin commented.

David Ball, aged 74, from Lucan was gifted a Brontie that introduced him to Willow & Wild for the first time, as he had not been to the coffee shop before.

“I got the voucher and initially I’m not very up to date with it,” David told Liffey Champion.

David spoke with Kevin, who informed him he had treated him to a drink and a sweet treat at Willow & Wild. He ordered a Cappuccino, an Americano, and a lemon drizzle cake.

While David acknowledged that technology was not his forte, he emphasised the simplicity of the Brontie platform, which makes it easy and accessible to people of all ages. “It’s nice to give to somebody because they have no idea about it,” said David.

“It simply arrives, and you realise someone has bought you a coffee and cake. It’s a wonderful concept.

“I have a sense that this will appeal to older people too,” said David.

David also said when his older brother too simply arrives, he sees it, and he can just press it, and he gets the coffee in question.

“My wife said I had never been here before and Carmel said to me, ‘you must come back.’ So, this has introduced two new customers,” remarked David.

Kate Collins from Willow & Wild is delighted about Brontie’s collaboration with her coffee shop.

“I think it’s a brilliant idea and the minute I found out, I was delighted to get behind it,” she said.

“It’s a thoughtful little gift, and so far, the feedback of people coming in has been great.

“Everything has gotten so expensive, like you could nearly spend €40 on a bouquet of flowers,” added Kate.

“This is more affordable, but you’re still giving the thought to it,” she said.`,
  },
];

const TrustFeature = () => {
  const modals = useRef<Record<string, HTMLDialogElement | null>>({});

  const openModal = (id: string) => {
    const dlg = modals.current[id];
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
  };

  return (
    <section
      className="trust-features-section relative pt-16 md:pt-20 pb-16 md:pb-20 xl:pt-[135px] xl:pb-[121px] bg-mono-0"
      id="featured-in"
    >
      <div className="custom-container">
        <div className="section-content relative z-[99] mb-[25px] md:mb-[73px]">
          <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center font-normal font-primary text-mono-100 leading-[100%]">
            Trusted & Featured By
          </h2>
          <p className="desc text-[14px] md:text-[18px] lg:text-[22px] xl:text-[26px] font-bold text-center font-secondary text-mono-100 leading-[140%] mt-[14px]">
            As seen on{' '}
            <span className="color-text">The Ian Dempsey Breakfast Show</span>{' '}
            and other leading media outlets.
          </p>
        </div>

        <div className="trust-feature-wrapper grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-6 lg:gap-10 xl:gap-20 relative z-[99]">
          {data.map(item => (
            <article
              key={item.id}
              className="trust-feature-cards-item h-full bg-mono-0 rounded-[16px] overflow-hidden"
            >
              <div className="card-image-box rounded-[9px] md:rounded-[16px] overflow-hidden">
                <Image
                  src={item.img.src}
                  width={item.img.width}
                  height={item.img.height}
                  alt={item.img.alt}
                  className="rounded-[9px] md:rounded-[16px] w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="trust-feature-cont pb-[19px] px-[16px] md:pb-[25px] lg:pb-[35px] xl:pb-[51px] md:px-[19px] pt-[15px] md:pt-[29px] bg-mono-0">
                <h3 className="text-[16px] md:text-[22px] lg:text-[26px] xl:text-[32px] text-left text-mono-100 font-bold font-secondary leading-[120%]">
                  {item.title}
                </h3>

                {/* Clamped excerpt on card */}
                <p className="mt-4 text-[14px] md:text-[18px] lg:text-[19px] xl:text-[21px] text-mono-1000 text-left font-normal font-secondary leading-[130%] clamp-4">
                  {item.excerpt}
                </p>

                <button
                  type="button"
                  onClick={() => openModal(item.id)}
                  className="type-read-more hover:text-secondary-100 mt-[16px] cursor-pointer text-primary-100 underline text-[14px] md:text-[16px] lg:text-[19px] xl:text-[21px] text-left font-bold font-secondary leading-[130%]"
                  aria-haspopup="dialog"
                  aria-controls={item.id}
                >
                  Read more
                </button>

                {/* DaisyUI modal */}
                <dialog
                  id={item.id}
                  className="modal py-10 px-6"
                  ref={el => {
                    modals.current[item.id] = el;
                  }}
                >
                  <div className="modal-box bg-mono-0  !h-full max-w-3xl p-0 overflow-hidden overflow-y-scroll rounded-[12px]">
                    {/* Close icon */}
                    <form method="dialog">
                      <button
                        className="btn btn-md btn-circle btn-ghost absolute bg-mono-0 hover:bg-secondary-100 hover:border-mono-0 right-3 top-3"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </form>

                    {/* Image */}
                    <div className="w-full">
                      <Image
                        src={item.img.src}
                        width={item.img.width}
                        height={item.img.height}
                        alt={item.img.alt}
                        className="w-full max-h-[310px] object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Full content */}
                    <div className="pb-[19px] px-[10px] md:pb-[25px] lg:pb-[35px] xl:pb-[51px] md:px-[19px] pt-[15px] md:pt-[29px] whitespace-pre-line">
                      <h3 className="text-[20px] md:text-[26px] lg:text-[30px] text-mono-100 font-bold font-secondary leading-[120%]">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-[14px] md:text-[18px] lg:text-[19px] xl:text-[21px] text-mono-1000 font-secondary leading-[150%]">
                        {item.full}
                      </p>
                    </div>
                  </div>

                  {/* Click outside to close */}
                  <form method="dialog" className="modal-backdrop">
                    <button aria-label="Close modal by clicking backdrop">
                      <XIcon className="w-6 h-6" />
                    </button>
                  </form>
                </dialog>
              </div>
            </article>
          ))}
        </div>

        <Link
          href="/products"
          className="font-secondary hover:opacity-70 relative z-[99] mx-auto font-normal mt-[37px] md:mt-[42px] xl:h-[84px] h-[50px] md:h-[58px] flex items-center justify-center leading-[1] text-[14px] md:text-[20px] xl:text-[22px] text-center text-mono-100 bg-secondary-100 max-w-[162px] md:max-w-[230px] xl:max-w-[272px] w-full rounded-[10px] md:rounded-[12px] xl:rounded-[18px] py-3 xl:py-[27px] pl-[32px] pr-[17px]"
        >
          Go to Gifts →
        </Link>
      </div>

      {/* Clamp utility without plugin */}
      <style jsx>{`
        .clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .clamp-4 {
            -webkit-line-clamp: 4;
          }
        }
        @media (min-width: 1024px) {
          .clamp-4 {
            -webkit-line-clamp: 5;
          }
        }
      `}</style>
    </section>
  );
};

export default TrustFeature;
