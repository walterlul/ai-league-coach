import "dotenv/config";
import { pool } from "./db.js";

const API_KEY = process.env.RIOT_API_KEY;
const HOST = "https://americas.api.riotgames.com";

const GAME_NAME = "i miss her";
const TAG_LINE = "RHPA";
const COUNT = 10;

async function riotFetch(path: string) {
  const res = await fetch(`${HOST}${path}`, {
    headers: { "X-Riot-Token": API_KEY! },
  });
  if (!res.ok) {
    throw new Error(`Riot API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function saveMatch(match: any) {
  const info = match.info;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO partida (id, cola, duracion_seg, jugada_en, parche, raw_data)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        match.metadata.matchId,
        info.queueId,
        info.gameDuration,
        info.gameCreation,
        info.gameVersion,
        JSON.stringify(match),
      ]
    );

    for (const p of info.participants) {
      await client.query(
        `INSERT INTO campeon (id, nombre) VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [p.championId, p.championName]
      );

      await client.query(
        `INSERT INTO jugador (puuid, riot_name, riot_tag)
         VALUES ($1, $2, $3)
         ON CONFLICT (puuid) DO UPDATE
           SET riot_name = EXCLUDED.riot_name,
               riot_tag = EXCLUDED.riot_tag,
               actualizado_en = now()`,
        [p.puuid, p.riotIdGameName ?? "", p.riotIdTagline ?? ""]
      );

      await client.query(
        `INSERT INTO jugador_partida
           (puuid, partida_id, campeon_id, equipo, gano,
            kills, muertes, asistencias, cs, oro)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (puuid, partida_id) DO NOTHING`,
        [
          p.puuid,
          match.metadata.matchId,
          p.championId,
          p.teamId,
          p.win,
          p.kills,
          p.deaths,
          p.assists,
          p.totalMinionsKilled + p.neutralMinionsKilled,
          p.goldEarned,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function main() {
  const account = await riotFetch(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(GAME_NAME)}/${encodeURIComponent(TAG_LINE)}`
  );

  const matchIds: string[] = await riotFetch(
    `/lol/match/v5/matches/by-puuid/${account.puuid}/ids?start=0&count=${COUNT}`
  );

  for (const id of matchIds) {
    const exists = await pool.query("SELECT 1 FROM partida WHERE id = $1", [id]);
    if (exists.rowCount) {
      console.log(`Ya existe ${id}, salto`);
      continue;
    }
    const match = await riotFetch(`/lol/match/v5/matches/${id}`);
    await saveMatch(match);
    console.log(`Guardada ${id}`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});