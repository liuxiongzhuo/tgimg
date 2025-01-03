// 导入模块
import { Bot, webhookCallback } from "grammy";
import { Hono } from 'hono'
import { fileTypeFromBuffer } from 'file-type'

// 导入配置
import config from "./config.json";
const host = config.host
const tgBotToken = config.tgBotToken
const position = config.position

// 新建 hono 和 bot
const app = new Hono()
const bot = new Bot(tgBotToken)

// bot 监听 photo 和 document
bot.on(":photo", async (ctx) => {
  const photos = ctx.msg.photo
  const fileId = photos[photos.length-1].file_id
  await ctx.reply(`直链:\n<code>${host}/${position}/${fileId}</code>\nmarkdown:\n<code>![${fileId}]/(${host}/${position}/${fileId}/)</code>`,{parse_mode:"HTML"})
})
bot.on(":document", async (ctx) => {
  const fileId = ctx.msg.document.file_id
  await ctx.reply(`直链:\n<code>${host}/${position}/${fileId}</code>\nmarkdown:\n<code>![${fileId}]/(${host}/${position}/${fileId}/)</code>`,{parse_mode:"HTML"})
})

// hono 接受 tg bot 的 webhooks
app.post('/bot', webhookCallback(bot, 'hono'));

// hono 接受图片 file_id
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

// 导出 app
export default app