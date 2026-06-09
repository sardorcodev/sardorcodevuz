import { EvidenceImage } from '@/components/evidence-image'
import { Icon } from '@/components/icons'
import { Eyebrow, PageHero, TelegramCallout } from '@/components/ui'
import { createPageMetadata, focusAreas } from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'About',
  description: 'Learn about sardorcodev and its founder, Sardorbek Musurmonov.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow='About sardorcodev'
        title='Practical technology, built with purpose.'
        text='sardorcodev is an independent technology brand founded by Sardorbek Musurmonov. It explores and shares practical ways to apply modern software and artificial intelligence.'
      />
      <section className='mx-auto grid max-w-7xl gap-8 px-5 py-18 sm:px-8 lg:grid-cols-[1.15fr_.85fr]'>
        <div>
          <Eyebrow>Our mission</Eyebrow>
          <h2 className='mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950'>
            Make useful technology easier to understand and apply.
          </h2>
          <div className='mt-6 space-y-5 text-base leading-7 text-slate-600'>
            <p>
              The work focuses on practical technology content, AI agents,
              Telegram bots, automation, and software development. Each area is
              approached with an emphasis on clear reasoning, real use cases,
              and maintainable implementation.
            </p>
            <p>
              sardorcodev also studies developer productivity, prompt
              engineering, web platforms, and SaaS product ideas as connected
              parts of modern digital work.
            </p>
          </div>
        </div>
        <aside className='rounded-3xl border border-slate-200 bg-white p-3'>
          <EvidenceImage
            alt='Sardorbek Musurmonov, founder of sardorcodev'
            caption='Sardorbek Musurmonov, founder of sardorcodev.'
            height={1536}
            imageClassName='aspect-[4/3] object-cover object-top'
            sizes='(max-width: 1023px) calc(100vw - 64px), 31vw'
            src='/images/founder-sardorbek-musurmonov.png'
            width={1024}
          />
          <div className='px-3 pb-3 pt-5'>
            <p className='text-xs font-bold uppercase tracking-[0.18em] text-blue-600'>
              Founder
            </p>
            <h2 className='mt-3 text-2xl font-bold text-slate-950'>
              SARDORBEK Musurmonov
            </h2>
            <p className='mt-3 leading-7 text-slate-600'>
              Founder of sardorcodev and the person behind its technology
              research, development work, and public content.
            </p>
          </div>
        </aside>
      </section>
      <section className='border-y border-slate-200 bg-white'>
        <div className='mx-auto grid max-w-7xl gap-8 px-5 py-18 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center'>
          <div>
            <Eyebrow>Public context</Eyebrow>
            <h2 className='mt-4 text-3xl font-bold tracking-[-0.05em] text-slate-950'>
              National AI Hackathon participation.
            </h2>
            <p className='mt-4 leading-7 text-slate-600'>
              This event image is included as factual public context for
              Sardorbek Musurmonov. Public source links related to the Termez
              stage are listed on the Public Mentions page.
            </p>
          </div>
          <EvidenceImage
            alt='Sardorbek Musurmonov at the National AI Hackathon Termez stage'
            caption='Sardorbek Musurmonov during the National AI Hackathon Termez stage.'
            height={3648}
            imageClassName='aspect-[16/10] object-cover'
            sizes='(max-width: 1023px) calc(100vw - 40px), 52vw'
            src='/images/sardorbek-national-ai-hackathon-event.png'
            width={3648}
          />
        </div>
      </section>
      <section className='border-b border-slate-200 bg-white'>
        <div className='mx-auto max-w-7xl px-5 py-18 sm:px-8'>
          <Eyebrow>Areas of focus</Eyebrow>
          <div className='mt-8 grid gap-4 sm:grid-cols-2'>
            {focusAreas.map(area => (
              <article
                className='flex gap-4 rounded-2xl border border-slate-200 p-5'
                key={area.title}
              >
                <div className='grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600'>
                  <Icon className='size-5' name={area.icon} />
                </div>
                <div>
                  <h3 className='font-bold text-slate-950'>{area.title}</h3>
                  <p className='mt-2 text-sm leading-6 text-slate-600'>
                    {area.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <TelegramCallout />
    </>
  )
}
