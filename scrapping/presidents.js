import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const STATIC_PATH = path.join(process.cwd(), './assets/static/presidents')
const DB_PATH = path.join(process.cwd(), './db')
const RAW_PRESIDENTS = await readFile(`${DB_PATH}/raw-presidents.json`, 'utf-8').then(JSON.parse)

const presidents = await Promise.all(
  RAW_PRESIDENTS.map(async (presidentInfo) => {
    const { slug: id, title, _links: links } = presidentInfo
    const { rendered: name } = title
    const { 'wp:attachment': attachment } = links
    const { href: imageApiEndPoint } = attachment[0]

    const responseImageEndPoint = await fetch(imageApiEndPoint)
    const data = await responseImageEndPoint.json()
    const [imageInfo] = data
    const { guid: { rendered: imageUrl } } = imageInfo

    const ext = imageUrl.split('.').at(-1)

    // fetch the image and save it to the file system
    const responseImage = await fetch(imageUrl)
    const arrayBuffer = await responseImage.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const imageFileName = `${id}.${ext}`
    await writeFile(`${STATIC_PATH}/${imageFileName}`, buffer)

    return { id, name, image: imageFileName, teamId: 0 }
  })
)

await writeFile(`${DB_PATH}/presidents.json`, JSON.stringify(presidents, null, 2), 'utf-8')
