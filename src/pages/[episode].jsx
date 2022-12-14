import { useMemo } from 'react'
import Head from 'next/head'
import Parser from 'rss-parser'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from "rehype-raw"
import { useAudioPlayer } from '@/components/AudioProvider'
import { Container } from '@/components/Container'
import { FormattedDate } from '@/components/FormattedDate'
import { PlayButton } from '@/components/player/PlayButton'

export default function Episode({ episode }) {
  let date = new Date(episode.published)

  let audioPlayerData = useMemo(
    () => ({
      title: episode.title,
      audio: {
        src: episode.audio.src,
        type: episode.audio.type,
      },
      link: `/${episode.id}`,
    }),
    [episode]
  )
  let player = useAudioPlayer(audioPlayerData)
  return (
    <>
      <Head>
        <title>{`${episode.title} - Periférico`}</title>
        <meta name="description" content={episode.description} />
      </Head>
      <article className="py-16 lg:py-36">
        <Container>
          <header className="flex flex-col">
            <div className="flex items-center gap-6">
              <PlayButton player={player} size="large" />
              <div className="flex flex-col">
                <h1 className="mt-2 text-4xl font-bold text-slate-900">
                  {episode.title}
                </h1>
                <FormattedDate
                  date={date}
                  className="order-first font-mono text-sm leading-7 text-slate-500"
                />
              </div>
            </div>
            <p className="ml-24 mt-3 text-lg font-medium leading-8 text-slate-700">
              {episode.description}
            </p>
          </header>
          <hr className="my-12 border-gray-200" />
          <ReactMarkdown
            className="prose prose-slate mt-14 [&>h2]:mt-12 [&>h2]:flex [&>h2]:items-center [&>h2]:font-mono [&>h2]:text-sm [&>h2]:font-medium [&>h2]:leading-7 [&>h2]:text-slate-900 [&>ul]:mt-6 [&>ul]:list-['\2013\20'] [&>ul]:pl-5"
            rehypePlugins={[rehypeRaw]}
          >
            {episode.content}
          </ReactMarkdown>
        </Container>
      </article>
    </>
  )
}

export async function getStaticProps({ params }) {
  const parser = new Parser()
  const feed = await parser.parseURL('https://anchor.fm/s/54719978/podcast/rss')

  const episodes = feed.items.map(
    ({ title, contentSnippet, content, enclosure, pubDate }, index) => ({
      id: (feed.items.length - index).toString(),
      title,
      description: contentSnippet.split('\n')[0],
      content,
      published: pubDate,
      audio: {
        src: enclosure.url,
        type: enclosure.type,
      },
    })
  )

  const episode = episodes.find(({ id }) => id === params.episode)

  if (!episode) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  return {
    props: {
      episode,
    },
    revalidate: 10,
  }
}

export async function getStaticPaths() {
  const parser = new Parser()
  const feed = await parser.parseURL('https://anchor.fm/s/54719978/podcast/rss')

  const paths = feed.items.map((_, index) => ({
    params: {
      episode: (feed.items.length - index).toString(),
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}