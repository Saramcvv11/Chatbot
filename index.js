import { Telegraf, Markup } from "telegraf";

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN fehlt");

const bot = new Telegraf(process.env.BOT_TOKEN);

/* =========================
   DEMO PROFILE (nur Beispiel – später DB)
========================= */
const PROFILES = [
  { name: "Anna", age: 23, city: "Berlin", country: "DE", origin: "Deutschland" },
  { name: "Laura", age: 25, city: "Hamburg", country: "DE", origin: "Polen" },
  { name: "Sophie", age: 22, city: "Wien", country: "AT", origin: "Österreich" },
  { name: "Mia", age: 24, city: "Graz", country: "AT", origin: "Kroatien" },
  { name: "Lena", age: 26, city: "Zürich", country: "CH", origin: "Schweiz" },
  { name: "Nina", age: 21, city: "Genf", country: "CH", origin: "Frankreich" }
];

/* =========================
   MAIN MENU
========================= */
const showMainMenu = async (ctx, textPrefix = "👋 Willkommen") => {
  const username = ctx.from.first_name || "User";

  await ctx.reply(
    `${textPrefix}, ${username}!\n\nWähle ein Land:`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🇩🇪 Deutschland", "LAND_DE")],
      [Markup.button.callback("🇦🇹 Österreich", "LAND_AT")],
      [Markup.button.callback("🇨🇭 Schweiz", "LAND_CH")]
    ])
  );
};

bot.start((ctx) => showMainMenu(ctx));

bot.action("MAIN_MENU", async (ctx) => {
  await ctx.answerCbQuery();
  await showMainMenu(ctx, "🏠 Hauptmenü");
});

/* =========================
   STÄDTE
========================= */
const CITIES = {
  DE: ["Berlin", "Hamburg"],
  AT: ["Wien", "Graz"],
  CH: ["Zürich", "Genf"]
};

bot.action(/LAND_(DE|AT|CH)/, async (ctx) => {
  await ctx.answerCbQuery();
  const land = ctx.match[1];

  const buttons = CITIES[land].map(city =>
    [Markup.button.callback(city, `CITY_${land}_${city}`)]
  );

  buttons.push([Markup.button.callback("🏠 Hauptmenü", "MAIN_MENU")]);

  await ctx.reply(
    "🏙 Wähle eine Stadt:",
    Markup.inlineKeyboard(buttons)
  );
});

/* =========================
   PROFILE ANZEIGEN
========================= */
bot.action(/CITY_(DE|AT|CH)_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();

  const land = ctx.match[1];
  const city = ctx.match[2];

  const cityProfiles = PROFILES.filter(
    p => p.country === land && p.city === city
  );

  if (cityProfiles.length === 0) {
    return ctx.reply(
      "Keine Profile in dieser Stadt.",
      Markup.inlineKeyboard([[Markup.button.callback("🏠 Hauptmenü", "MAIN_MENU")]])
    );
  }

  const randomProfile =
    cityProfiles[Math.floor(Math.random() * cityProfiles.length)];

  await ctx.reply(
    `👩 Name: ${randomProfile.name}\n` +
    `🎂 Alter: ${randomProfile.age}\n` +
    `🏙 Stadt: ${randomProfile.city}\n` +
    `🌍 Herkunft: ${randomProfile.origin}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🔎 Anderes Profil", `CITY_${land}_${city}`)],
      [Markup.button.callback("🏠 Hauptmenü", "MAIN_MENU")]
    ])
  );
});

/* =========================
   ERROR HANDLING
========================= */
bot.catch((err) => console.error("Bot Fehler:", err));

/* =========================
   LAUNCH
========================= */
bot.launch();
console.log("🤖 Vermittlungs-Bot läuft");
