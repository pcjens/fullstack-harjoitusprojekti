# Fullstack Open harjoitustyö

Tässä repositoriossa on Full Stack -websovelluskehitys harjoitustyöni. Kyseessä
on websovellus, jolla useampi käyttäjä voi luoda portfolio-nettisivuja järkevällä
käyttöliittymällä, erityisellä fokuksella sellaisiin portfolioihin, jotka
koostuvat peleistä ja/tai muista sovelluksista. Sovellus on toteutettu
frontendin osalta Reactilla, Bootstrapilla ja Typescriptillä, ja backendin
puolelta Axumilla, Sqlx:llä ja Rustilla.

## Työaikakirjanpito

Alla kirjanpito tähän projektiin käyttämistäni tunneista, kurssin
työtuntivaatimuksien seuraamista varten.

| Päivä | Alku&nbsp;ja&nbsp;loppu | Käytetty&nbsp;aika | Yhteensä | Kuvaus |
| :----:|:------------|:-----|:--------|:-------|
| 18.7. | 00.06–02.44 | 2h 38m | 2h 38m  | Npm/vite/typescript/cargo/docker/ym. järjestelyä |
| 18.7. | 22.17–23.40 | 1h 23m | 4h 1m   | Sovelluksen ydintoimintojen suunnittelua |
| 19.7. | 01.04–03.29 | 2h 25m | 6h 26m  | Kunnon readme:n kirjoittaminen, tietokantayhteyksien lisääminen backendiin |
| 19.7. | 16.53–02.54 | 10h 1m | 16h 27m | Kirjautumis- ja rekisteröintilomakkeiden toteutus frontendissä, käyttäjien lisäys ja salasanojen tarkistuksen toteuttaminen backendissä (ei vielä sessioita) |
| 20.7. | 17.00–19.13 | 2h 13m | 18h 40m | Sessioiden lisäys backendiin, vielä vaiheessa frontissa |
| 21.7. | 00.00–00.54 | 54m    | 19h 34m | Sessiot toimintaan myös frontin osalta |
| 21.7. | 17.23–21.51 | 4h 28m | 24h 2m  | Frontendin bäkkärikutsujen tekemistä varten olevan hookin refaktorointi, nyt integroi paljon paremmin Reactin state-systeemien kanssa, login-kontekstin lisäys, sessioiden vanhentuminen backendiin |
| 22.7. | 09.17–11.17 | 2h     | 26h 2m  | Käännösten (ja niiden vaatimien systeemien) lisäämistä frontendiin, navipalkki, routeeminen |
| 22.7. | 14.09–14.57 | 48m    | 26h 50m | Käännösten viimeistely, faviconin/"brand ikonin" etsintää ja lisäystä |
| 23.7. | 10.22–11.10 | 48m    | 27h 38m | Portfolio-listaus-näkymän työstämistä frontendissä |
| 24.7. | 21.03–23.00 | 1h 57m | 29h 35m | Portfolio-listaus-näkymän viimeistelyä, portfolio-skeeman suunnittelua backendiin |
| 26.7. | 18.33–21.56 | 3h 23m | 32h 58m | Portfolioiden haun toteutus backendissä, portfolioiden haku backendista sekä esimerkkipohjaisen tyyppitarkistussysteemin toteutus frontendissä |
| 29.7. | 13.34–17.22 | 3h 48m | 36h 46m | Api-kutsujen korjailua hitaan netin kanssa tunnistettujen ongelmien osalta, portfolioiden luonti/muokkaus-lomakkeen kehitystä |
| 29.7. | 22.16–23.35 | 1h 19m | 38h 5m  | Portfolioiden luomis-ominaisuus (vielä ilman itse teoksia) valmiiksi |

## Linkki ja ohjeet

*TODO: Linkki deployattuun versioon*

*TODO: Perus käyttöohjeet testaamista varten*

### Ylläpitohuomioita

#### Tietokantayhteydet

Tämän sovelluksen backend voi käyttää MySQL, PostgreSQL, tai SQLite
-tietokantaa. Käytetty tietokanta riippuu backendin saamasta DATABASE_URL
ympäristömuuttujasta, jonka muodostamiseen löytyy ohjeet seuraavista linkeistä:
[MySQL](https://docs.rs/sqlx/latest/sqlx/mysql/struct.MySqlConnectOptions.html),
[PostgreSQL](https://docs.rs/sqlx/latest/sqlx/postgres/struct.PgConnectOptions.html),
[SQLite](https://docs.rs/sqlx/latest/sqlx/sqlite/struct.SqliteConnectOptions.html).

Kehitysympäristön docker compose -konfiguraatiossa käytetään SQLite-tietokantaa,
joka tallentuu bind-mountattuun tiedostoon
[backend/dev-compose-data.db](backend/dev-compose-data.db).

## Kuvakaappauksia

*TODO: Kuvia sovelluksen käyttöliittymästä ja sillä luodusta portfoliosivusta, kunhan nämä on valmiita*

## Lisenssi

Tätä websovellusta saa käyttää, tutkia, kopioda ja muokata [GNU AGPL
3.0](LICENSE.md) lisenssin ehtojen mukaisesti.
