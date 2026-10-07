import "dotenv/config";

const API_KEY = process.env.RIOT_API_KEY;
const HOST = "https://americas.api.riotgames.com";

const GAME_NAME = "i miss her";
const TAG_LINE = "RHPA";

async function riotFetch(path: string) {
  const res = await fetch(`${HOST}${path}`, {
    headers: { "X-Riot-Token": API_KEY! },
  });
  
  if (!res.ok) {
    throw new Error(`Error en la solicitud a Riot API: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  // 1. Riot ID -> PUUID
  const account = await riotFetch(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(GAME_NAME)}/${encodeURIComponent(TAG_LINE)}`
  );
  console.log("PUUID:", account.puuid);

  // 2. PUUID -> últimos 5 matchIds
  const matchIds: string[] = await riotFetch(
    `/lol/match/v5/matches/by-puuid/${account.puuid}/ids?start=0&count=5`
  );
  console.log("Partidas:", matchIds);

  // 3. Detalle de la primera partida
  const match = await riotFetch(`/lol/match/v5/matches/${matchIds[0]}`);
  console.log("Duración (seg):", match.info.gameDuration);
  console.log("Participantes:", match.info.participants.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
