import { Bot, webhookCallback } from "grammy";
import { Hono } from 'hono'
import { fileTypeFromBuffer } from 'file-type'


import config from "./config.json";
const host = config.host
const tgBotToken = config.tgBotToken
const position = config.position



const app = new Hono()
const bot = new Bot(tgBotToken)



bot.on(":photo", async (ctx) => {
  const photos = ctx.msg.photo
  const fileId = photos[photos.length-1].file_id
  await ctx.reply(`直链:\n<code>${host}/${position}/${fileId}</code>\nmarkdown:\n<code>![${fileId}]/(${host}/${position}/${fileId}/)</code>`,{parse_mode:"HTML"})
})
bot.on(":document", async (ctx) => {
  const fileId = ctx.msg.document.file_id
  await ctx.reply(`直链:\n<code>${host}/${position}/${fileId}</code>\nmarkdown:\n<code>![${fileId}]/(${host}/${position}/${fileId}/)</code>`,{parse_mode:"HTML"})
})



app.post('/bot', webhookCallback(bot, 'hono'));
app.get('/', (ctx) =>
  ctx.text('hello')
)
app.get(`/${position}/:fileId`, async (ctx) => {
  const fileId = ctx.req.param('fileId')
  const filePath = (await bot.api.getFile(fileId)).file_path
  const imgurl = `https://api.telegram.org/file/bot${tgBotToken}/${filePath}`
  const res = await fetch(imgurl)
  if (!res.ok) {
    ctx.status(400)
  }
  const bf = await res.arrayBuffer()
  const fileType = await fileTypeFromBuffer(bf)
  return ctx.body(bf, 200, {
    'Content-Type': fileType?.mime ?? '',
  });
})
export default app