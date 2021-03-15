// import Telegraf
const {Telegraf , Markup} = require('telegraf');
// import cron
const cron = require('node-cron');
// import ranidb
const ranidb = require('ranidb');
// import function
let {getRandomItem , addUsers , removeUsers , sendAzkar, send, replayId, makeMessage , updateJson, Supporter , adminID} = require("./src/lib");
// import Json Data
let jsonData = require('./db/azkar.json');
const db = new ranidb('./db/users.json' , { idType: "empty" });
// config .env file
require('dotenv').config();
// make new bot
const bot = new Telegraf(process.env.BOT_TOKEN || getApi());
// import fetch
const fetch = require('node-fetch');
// import plugin to make pull
const git = require('git-pull-or-clone')
// make vars
let hDate = "";
let ramadan = "";
let about = `بوت عبود هو لنشر اذكار الصباح والمساء بشكل دوري في المجموعات 
البوت مجاني تماما و مفتوح المصدر

لذالك نروج منك دعمنا حتى نستمر
    `;
let reAbout = Markup.inlineKeyboard([
    [Markup.button.callback("رجوع", "about")]
]);
const licenseUrl = "https://ojuba.org/waqf-2.0:%D8%B1%D8%AE%D8%B5%D8%A9_%D9%88%D9%82%D9%81_%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9";

const buttons = Markup.inlineKeyboard([
    [
        Markup.button.url('المطور', 'https://t.me/superastorh'),
        Markup.button.url("الرخصة", licenseUrl)
    ],
    [
        Markup.button.callback("ادعمنا", "supportMe"),
        Markup.button.callback("الداعمين", "Supporter")
    ],
])

bot.command("about", ctx => {
    if (ctx.message.chat.type !== 'supergroup') {
        ctx.reply(about, buttons);
    } else {
        ctx.reply("لاتعمل الرساله في المجموعات تواصل معي خاص" + " @" + bot.botInfo.username)
    }
})

bot.action("Supporter", ctx => {
    let keyBord = Markup.inlineKeyboard([
        [
            Markup.button.callback("ادعمنا", "supportMe"),
            Markup.button.callback("رجوع", "about")
        ]
    ]);
    action(ctx, "الداعمين هم السبب الرائيسي في عمل البوت الخاص بنا وهم" + "\n\n" + Supporter(), keyBord)
})

bot.action("supportMe", ctx => {
    action(ctx, "اذا كنت ترغب بدعمنا نرجو منك التواصل مع مطور البوت لمعرفة التفاضيل الازمة \n مطور البوت : @superastorh"
    , reAbout)
})
bot.action("about", ctx => {
    action(ctx, about, buttons)
})

// when start chat on bot
bot.start((ctx) => addUsers(db, ctx, bot));
// when some one need bot start in this chat
bot.command("on", ctx => {
        addUsers(db, ctx, bot)
    }
);
// when some one need bot stop in this chat
bot.command("off", ctx =>
    removeUsers(db, ctx, bot)
);
//get new Message
bot.command("new", (ctx) => {

    let mas = getRandomItem(jsonData);

    replayId(ctx, makeMessage(mas));

})
//get hdate
bot.command("date", ctx => {
    ctx.reply(hDate);
})
//get time
bot.command("ramadan" , ctx =>{

    ramadan = new Date( 2021 , 3, 13)

    let difference = ramadan.getTime() - new Date().getTime()

    let days = Math.ceil(difference / (1000 * 3600 * 24))

    replayId( ctx ," يتبقى على شهر رمضان " + days + " يوم  تقريبا ")

})

// for admin command

//send message to all users
bot.command("send" , ctx =>{
    if((ctx.message.reply_to_message) && ctx.chat.id === 635096382){
        send(e => {
            bot.telegram.sendMessage(e.id, ctx.message.reply_to_message.text)
        });
    }
})
//set json file for users
bot.command("set" , ctx =>{
    if((ctx.message.reply_to_message) && ctx.chat.id === 635096382 && ctx.message.reply_to_message.document){
        updateJson(ctx , db).then(
            ()=> ctx.reply("تم بنجاح")
        ).catch(
            err=>{
                ctx.reply("حصل خطاء")
                ctx.reply(JSON.stringify(err , null , 2))
            }
        )
    }
})
//update h date
bot.command("update" , ctx =>{

})

//get users for admin
bot.command("user" , ctx =>{
    if((ctx.message.reply_to_message) && ctx.chat.id === 635096382){
        bot.telegram.sendDocument(adminID , {source: "./db/users.json"});
    }
})

//send when bot start
bot.launch().then(() => start());

function start(){
    adminSend( "اشتغل بوت" + "\n @" + bot.botInfo.username);
}
function stop(stop){
    if (stop) bot.stop(stop);
    adminSend( "تقفل بوت" + "\n @" + bot.botInfo.username);
}
process.once('SIGINT', () => stop('SIGINT'));

process.once('SIGTERM', () => stop('SIGTERM'));

const options = {
    scheduled: true,
    timezone: "Asia/Kuwait"
};
sendAzkar(bot, "أذكار الصباح");

cron.schedule('50 3 * * *', () => {
    sendAzkar(bot, "أذكار الصباح");
}, options);

cron.schedule('0 17,20,23 * * *', () => {
    sendAzkar(bot, "أذكار المساء");
}, options);

cron.schedule('0 9 * * 5', () => {
    send(e => {
        sendMessage(e.id, getRandomItem(require("./db/friDay.json")).zekr)
    });
}, options);

cron.schedule('0 1,5,10 * * *', () => {
    getDate();
}, options);

getDate()

async function getDate(){

    try{
        const response = await fetch('http://api.aladhan.com/v1/gToH');
        const json = await response.json();
        const date = json.data.hijri;
        hDate = `${date.weekday.ar} ${date.day} ${date.month.ar} ${date.year}`;
    }catch (err){
        adminSend("حصل خطاء")
        adminSend( JSON.stringify(err , null , 2))
    }
}
function adminSend(txt){
    sendMessage(adminID , txt )
}

function action(ctx , message , extra = {}){
    let chat = ctx.update.callback_query.message.chat.id;
    let messageId = ctx.update.callback_query.message.message_id;
    deleteMessage(chat, messageId)
    sendMessage(chat, message , extra)
}


function deleteMessage(chat_id, message_id) {
    bot.telegram.deleteMessage(chat_id, message_id).then()
}

function sendMessage(chatId , text , extra = {} ) {
    bot.telegram.sendMessage(chatId, text, extra).then()
}

function getApi() {

    const prompt = require('prompt-sync')();

    const fs = require('fs');

    const api = prompt('What is your api bot? => ');

    const content = 'BOT_TOKEN=' + api ;

    fs.writeFile('.env', content , err => {});

    return api;

}
