import { GERMAN_STATES, type GermanStateCode } from "../types";
import { fold } from "./text";

export const GERMAN_CITIES: { name: string; state: GermanStateCode; aliases: string[] }[] = [
  { name: "Berlin", state: "BE", aliases: [] },
  { name: "Hamburg", state: "HH", aliases: [] },
  { name: "Munich", state: "BY", aliases: ["München", "Muenchen"] },
  { name: "Cologne", state: "NW", aliases: ["Köln", "Koeln"] },
  { name: "Frankfurt", state: "HE", aliases: ["Frankfurt am Main", "Frankfurt a. M."] },
  { name: "Stuttgart", state: "BW", aliases: [] },
  { name: "Düsseldorf", state: "NW", aliases: ["Duesseldorf", "Dusseldorf"] },
  { name: "Leipzig", state: "SN", aliases: [] },
  { name: "Dortmund", state: "NW", aliases: [] },
  { name: "Essen", state: "NW", aliases: [] },
  { name: "Bremen", state: "HB", aliases: [] },
  { name: "Dresden", state: "SN", aliases: [] },
  { name: "Hannover", state: "NI", aliases: ["Hanover"] },
  { name: "Nuremberg", state: "BY", aliases: ["Nürnberg", "Nuernberg"] },
  { name: "Duisburg", state: "NW", aliases: [] },
  { name: "Bochum", state: "NW", aliases: [] },
  { name: "Wuppertal", state: "NW", aliases: [] },
  { name: "Bielefeld", state: "NW", aliases: [] },
  { name: "Bonn", state: "NW", aliases: [] },
  { name: "Münster", state: "NW", aliases: ["Muenster", "Munster"] },
  { name: "Karlsruhe", state: "BW", aliases: [] },
  { name: "Mannheim", state: "BW", aliases: [] },
  { name: "Augsburg", state: "BY", aliases: [] },
  { name: "Wiesbaden", state: "HE", aliases: [] },
  { name: "Aachen", state: "NW", aliases: [] },
  { name: "Mönchengladbach", state: "NW", aliases: ["Moenchengladbach"] },
  { name: "Gelsenkirchen", state: "NW", aliases: [] },
  { name: "Braunschweig", state: "NI", aliases: [] },
  { name: "Kiel", state: "SH", aliases: [] },
  { name: "Chemnitz", state: "SN", aliases: [] },
  { name: "Halle", state: "ST", aliases: ["Halle (Saale)"] },
  { name: "Magdeburg", state: "ST", aliases: [] },
  { name: "Freiburg", state: "BW", aliases: ["Freiburg im Breisgau"] },
  { name: "Krefeld", state: "NW", aliases: [] },
  { name: "Mainz", state: "RP", aliases: [] },
  { name: "Lübeck", state: "SH", aliases: ["Luebeck"] },
  { name: "Erfurt", state: "TH", aliases: [] },
  { name: "Rostock", state: "MV", aliases: [] },
  { name: "Potsdam", state: "BB", aliases: [] },
  { name: "Saarbrücken", state: "SL", aliases: ["Saarbruecken"] },
  { name: "Heidelberg", state: "BW", aliases: [] },
  { name: "Darmstadt", state: "HE", aliases: [] },
  { name: "Regensburg", state: "BY", aliases: [] },
  { name: "Würzburg", state: "BY", aliases: ["Wuerzburg"] },
  { name: "Göttingen", state: "NI", aliases: ["Goettingen"] },
  { name: "Ulm", state: "BW", aliases: [] },
  { name: "Paderborn", state: "NW", aliases: [] },
  { name: "Ingolstadt", state: "BY", aliases: [] },
  { name: "Wolfsburg", state: "NI", aliases: [] },
  { name: "Offenbach", state: "HE", aliases: [] },
  { name: "Pforzheim", state: "BW", aliases: [] },
  { name: "Heilbronn", state: "BW", aliases: [] },
  { name: "Tübingen", state: "BW", aliases: ["Tuebingen"] },
  { name: "Konstanz", state: "BW", aliases: [] },
  { name: "Jena", state: "TH", aliases: [] },
  { name: "Aschaffenburg", state: "BY", aliases: [] },
  { name: "Kaiserslautern", state: "RP", aliases: [] },
  { name: "Passau", state: "BY", aliases: [] },
  { name: "Bayreuth", state: "BY", aliases: [] },
  { name: "Bamberg", state: "BY", aliases: [] },
  { name: "Erlangen", state: "BY", aliases: [] },
  { name: "Ilmenau", state: "TH", aliases: [] },
];

const CITY_INDEX = new Map<string, (typeof GERMAN_CITIES)[number]>();
for (const city of GERMAN_CITIES) {
  CITY_INDEX.set(fold(city.name), city);
  for (const alias of city.aliases) CITY_INDEX.set(fold(alias), city);
}

const STATE_INDEX = new Map<string, GermanStateCode>();
for (const state of GERMAN_STATES) {
  STATE_INDEX.set(fold(state.code), state.code);
  STATE_INDEX.set(fold(state.name), state.code);
  if ("aliases" in state) {
    for (const alias of state.aliases ?? []) STATE_INDEX.set(fold(alias), state.code);
  }
}

export function parseLocation(raw: string | null | undefined): {
  city: string | null;
  stateCode: GermanStateCode | null;
  country: string;
  looksGerman: boolean;
} {
  if (!raw || !raw.trim()) {
    return { city: null, stateCode: null, country: "DE", looksGerman: false };
  }

  const folded = fold(raw);
  const looksGerman =
    /\b(germany|deutschland|bundesrepublik|de)\b/.test(folded) ||
    Array.from(CITY_INDEX.keys()).some((city) => folded.includes(city)) ||
    Array.from(STATE_INDEX.keys()).some((state) => state.length > 2 && folded.includes(state));

  let city: string | null = null;
  let stateCode: GermanStateCode | null = null;

  for (const [key, entry] of CITY_INDEX) {
    if (folded.includes(key)) {
      city = entry.name;
      stateCode = entry.state;
      break;
    }
  }

  if (!stateCode) {
    for (const [key, code] of STATE_INDEX) {
      if (key.length >= 2 && folded.includes(key)) {
        stateCode = code;
        break;
      }
    }
  }

  const country = looksGerman || city || stateCode ? "DE" : guessCountry(folded);
  return { city, stateCode, country, looksGerman: country === "DE" };
}

function guessCountry(folded: string): string {
  if (/\b(austria|osterreich|österreich|wien|vienna)\b/.test(folded)) return "AT";
  if (/\b(switzerland|schweiz|zurich|zürich|zurich|geneva|basel)\b/.test(folded)) return "CH";
  if (/\b(netherlands|holland|amsterdam|rotterdam)\b/.test(folded)) return "NL";
  if (/\b(united states|usa|u\.s\.|new york|san francisco|seattle)\b/.test(folded)) return "US";
  if (/\b(united kingdom|england|london|uk)\b/.test(folded)) return "GB";
  if (/\b(france|paris|lyon)\b/.test(folded)) return "FR";
  if (/\b(spain|madrid|barcelona)\b/.test(folded)) return "ES";
  return "UN";
}

export function isGermanCountry(value: string | null | undefined): boolean {
  if (!value) return false;
  const folded = fold(value);
  return (
    folded === "de" ||
    folded === "deu" ||
    folded === "ger" ||
    folded === "germany" ||
    folded === "deutschland" ||
    folded.includes("germany") ||
    folded.includes("deutschland")
  );
}
