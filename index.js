import { Telegraf, Markup, session } from "telegraf";

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN fehlt");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// ---------------- STÄDTE ----------------
const CITIES = {
  DE: ["Berlin","Hamburg","München","Köln"],
  AT: ["Wien","Graz","Salzburg"],
  CH: ["Zürich","Genf","Bern"]
};

// ---------------- PROFIL STORAGE (Demo - später DB) ----------------
const profiles = [];

// ---------------- START ----------------
bot.start(async (ctx) => {
  ctx.session = {};

  await ctx.reply(
    "👋 Willkommen beim Vermittlungs-Bot\n\nHier kannst du Profile aus deiner Region entdecken.",
    Markup.inlineKeyboard([
      [Markup.button.callback("🔎 Profile ansehen","VIEW_COUNTRY")],
      [Markup.button.callback("➕ Profil erstellen","CREATE_PROFILE")]
    ])
  );
});

// ---------------- LAND AUSWÄHLEN ----------------
bot.action("VIEW_COUNTRY", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "🌍 Wähle ein Land:",
    Markup.inlineKeyboard([
      [Markup.button.callback("🇩🇪 Deutschland","LAND_DE")],
      [Markup.button.callback("🇦🇹 Österreich","LAND_AT")],
      [Markup.button.callback("🇨🇭 Schweiz","LAND_CH")]
    ])
  );
});

// ---------------- PROFILE ZEIGEN ----------------
bot.action(/LAND_(DE|AT|CH)/, async (ctx) => {
  await ctx.answerCbQuery();
  const land = ctx.match[1];

  const results = profiles.filter(p => p.land === land);

  if (results.length === 0) {
    return ctx.reply("Noch keine Profile in diesem Land.");
  }

  const randomProfile = results[Math.floor(Math.random() * results.length)];

  await ctx.reply(
    `👩 Name: ${randomProfile.name}\n` +
    `🎂 Alter: ${randomProfile.age}\n` +
    `🏙 Stadt: ${randomProfile.city}\n` +
    `🌍 Herkunft: ${randomProfile.origin}`
  );
});

// ---------------- PROFIL ERSTELLEN ----------------
bot.action("CREATE_PROFILE", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.step = "name";
  await ctx.reply("Wie heißt du?");
});

bot.on("text", async (ctx) => {
  const step = ctx.session.step;

  if (!step) return;

  if (step === "name") {
    ctx.session.name = ctx.message.text;
    ctx.session.step = "age";
    return ctx.reply("Wie alt bist du?");
  }

  if (step === "age") {
    ctx.session.age = ctx.message.text;
    ctx.session.step = "origin";
    return ctx.reply("Was ist deine Herkunft?");
  }

  if (step === "origin") {
    ctx.session.origin = ctx.message.text;
    ctx.session.step = "country";

    return ctx.reply(
      "Wähle dein Land:",
      Markup.inlineKeyboard([
        [Markup.button.callback("🇩🇪 Deutschland","REG_DE")],
        [Markup.button.callback("🇦🇹 Österreich","REG_AT")],
        [Markup.button.callback("🇨🇭 Schweiz","REG_CH")]
      ])
    );
  }
});

// ---------------- LAND BEI REG ----------------
bot.action(/REG_(DE|AT|CH)/, async (ctx) => {
  await ctx.answerCbQuery();

  const land = ctx.match[1];
  ctx.session.land = land;
  ctx.session.step = "city";

  const buttons = CITIES[land].map(city =>
    [Markup.button.callback(city, `CITY_${city}`)]
  );

  await ctx.editMessageText(
    "Wähle deine Stadt:",
    Markup.inlineKeyboard(buttons)
  );
});

// ---------------- STADT BEI REG ----------------
bot.action(/CITY_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();

  ctx.session.city = ctx.match[1];

  profiles.push({
    name: ctx.session.name,
    age: ctx.session.age,
    origin: ctx.session.origin,
    land: ctx.session.land,
    city: ctx.session.city
  });

  ctx.session = {};

  await ctx.reply("✅ Dein Profil wurde gespeichert!");
});

// ---------------- ERROR ----------------
bot.catch(err => console.error("Bot Fehler:", err));

// ---------------- LAUNCH ----------------
bot.launch();
console.log("🤖 Vermittlungs-Bot läuft");
