const axios = require('axios')
const fs = require('fs')
const readline = require('readline-sync')
const cheerio = require('cheerio')
const Telebot = require('telebot')
require('dotenv').config()

const listLinksOn = []

async function start() {
    telegramSendBot()

}

function askActressName() {//Use this function only if you want to search on CMD intead Telegram Bot.
    return readline.question('[+] Type here the actress name: ')
}

async function searchActressName(name) {
    const replacedTagName = []
    const urlName = `https://fapello.com/search/${name}`
    const options = {
        method: 'get',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive'
        },
        url: urlName,
    }


    await axios(options).then(function (response) {
        const htmlTag = response.data
        const $ = cheerio.load(htmlTag)
        const tagName = $('.bg-red-400').find('a')
        replacedTagName.unshift(tagName.attr('href'))

    })

    let tagGirlName = replacedTagName[0]

    if (tagGirlName === undefined) {
        return "nothing"
    } else {
        return replacedTagName[0].replace('https://fapello.com/', '').replace('/', '')
    }



}

async function generateUrlImage(actress) {
    let leter = `${actress}`
    for (let i = 1; i < 10; i++) {
        let linkUrl = `https://fapello.com/content/${leter.charAt(0)}/${leter.charAt(1)}/${actress}/1000/${actress}.REPLACE`
        listLinksOn.unshift(linkUrl.replace('.REPLACE', `_000${i}.jpg`))
    }

    for (let i = 10; i < 51; i++) {
        let linkUrl = `https://fapello.com/content/${leter.charAt(0)}/${leter.charAt(1)}/${actress}/1000/${actress}.REPLACE`
        listLinksOn.unshift(linkUrl.replace('.REPLACE', `_00${i}.jpg`))
    }

    console.log('[+] The urls on gererated are: ')
    console.log(listLinksOn)
}

function downloadImages(actress) {//Use this function only if you want to save the images on your PC.
    const dirActress = `./${actress}`
    if (!fs.existsSync(dirActress)) {
        fs.mkdirSync(dirActress)
    }
    for (let i of listLinks) {
        const options = {
            method: 'get',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Connection': 'keep-alive'
            },
            url: `${i}`,
            responseType: 'stream'
        }
        axios(options).then(function (response) {
            console.log(`[-] Downloading: ${i}`)
            response.data.pipe(fs.createWriteStream(`./${actress}\\${actress}-${listLinks.indexOf(i)}.jpg`))
        }).catch(console.error)
    }
}

async function telegramSendBot() {
    const listTag = {}
    const token = process.env.TELEGRAM_TOKEN
    const bot = new Telebot({
        token: token,
        polling: {
            interval: 1000,
            timeout: 0,
            limit: 100,
            retryTimeout: 4000,
        }
    })

    bot.on('/search', (msg) => {
        try {
            async function telegramTerm() {
                listTag.searchTerm = msg.text
                listTag.tagName = await searchActressName(listTag.searchTerm.replace('/search ', ''))

                if (listTag.tagName === "nothing") {
                    msg.reply.text("[-] Não consegui encontrar nada dessa mina, foi mal!")
                } else {
                    generateUrlImage(listTag.tagName)
                    //await downloadImages(listTag.tagName) //<- Use this function only if you want to save the images on your PC.
                    const actress = listTag.tagName.toUpperCase()
                    const inputMediaArrayOne = [{
                        type: "photo",
                        media: listLinksOn[0],
                        caption: `[+] Bot da putaria apresenta: ${actress} -> ${process.env.CHANNEL_ONE}`

                    }]

                    for (let i = 1; i < 50; i++) {
                        inputMediaArrayOne.push({
                            type: "photo",
                            media: listLinksOn[i],
                            caption: `[+] Bot da putaria apresenta: ${actress} -> ${process.env.CHANNEL_ONE}`
                        })
                    }

                    const idList = [process.env.CHANNEL_ONE, process.env.CHANNEL_TWO, `${msg.from.id}`]

                    async function sendMediaOne(id) {
                        await bot.sendMediaGroup(id, inputMediaArrayOne.slice(0, 9)).then(console.log).catch(console.error)
                        await bot.sendMediaGroup(id, inputMediaArrayOne.slice(10, 19)).then(console.log).catch(console.error)
                        await bot.sendMediaGroup(id, inputMediaArrayOne.slice(20, 29)).then(console.log).catch(console.error)
                        await bot.sendMediaGroup(id, inputMediaArrayOne.slice(30, 39)).then(console.log).catch(console.error)
                        await bot.sendMediaGroup(id, inputMediaArrayOne.slice(40, 9)).then(console.log).catch(console.error)
                    }


                    await sendMediaOne(idList[2])
                }


            }

            telegramTerm()

        } catch (err) {
            console.log(err)
        }

    })

    bot.start()
}

start()
