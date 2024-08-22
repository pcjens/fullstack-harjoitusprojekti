# Fullstack Open harjoitustyö

Tässä repositoriossa on projektini kurssille [Full Stack -websovelluskehitys
harjoitustyö](https://github.com/fullstack-hy2020/misc/blob/master/harjoitustyo.md).
Kyseessä on websovellus, jolla useampi käyttäjä voi luoda portfolio-nettisivuja
järkevällä käyttöliittymällä, erityisellä fokuksella sellaisiin portfolioihin,
jotka koostuvat peleistä ja/tai muista sovelluksista. Sovellus on toteutettu
frontendin osalta Reactilla, Bootstrapilla ja Typescriptillä, ja backendin
puolelta Axumilla, Sqlx:llä ja Rustilla.

## Sisällys

- [Työaikakirjanpito](#työaikakirjanpito)
- [Linkki ja ohjeet](#linkki-ja-ohjeet)
  - [Ylläpitohuomioita](#ylläpitohuomioita)
- [Kuvakaappauksia](#kuvakaappauksia)
- [Lisenssi](#lisenssi)

## Työaikakirjanpito

Alla kirjanpito tähän projektiin käyttämistäni tunneista, kurssin
työtuntivaatimuksien seuraamista varten.

| Päivä | Alku&nbsp;ja&nbsp;loppu | Käytetty&nbsp;aika | Yhteensä | Kuvaus |
| :----:|:------------|--------:|--------:|:-------|
| 18.7. | 00.06–02.44 |  2h 38m |  2h 38m | Npm/vite/typescript/cargo/docker/ym. järjestelyä |
| 18.7. | 22.17–23.40 |  1h 23m |  4h  1m | Sovelluksen ydintoimintojen suunnittelua |
| 19.7. | 01.04–03.29 |  2h 25m |  6h 26m | Kunnon readme:n kirjoittaminen, tietokantayhteyksien lisääminen backendiin |
| 19.7. | 16.53–02.54 | 10h  1m | 16h 27m | Kirjautumis- ja rekisteröintilomakkeiden toteutus frontendissä, käyttäjien lisäys ja salasanojen tarkistuksen toteuttaminen backendissä (ei vielä sessioita) |
| 20.7. | 17.00–19.13 |  2h 13m | 18h 40m | Sessioiden lisäys backendiin, vielä vaiheessa frontissa |
| 21.7. | 00.00–00.54 |     54m | 19h 34m | Sessiot toimintaan myös frontin osalta |
| 21.7. | 17.23–21.51 |  4h 28m | 24h  2m | Frontendin bäkkärikutsujen tekemistä varten olevan hookin refaktorointi, nyt integroi paljon paremmin Reactin state-systeemien kanssa, login-kontekstin lisäys, sessioiden vanhentuminen backendiin |
| 22.7. | 09.17–11.17 |  2h     | 26h  2m | Käännösten (ja niiden vaatimien systeemien) lisäämistä frontendiin, navipalkki, routeeminen |
| 22.7. | 14.09–14.57 |     48m | 26h 50m | Käännösten viimeistely, faviconin/"brand ikonin" etsintää ja lisäystä |
| 23.7. | 10.22–11.10 |     48m | 27h 38m | Portfolio-listaus-näkymän työstämistä frontendissä |
| 24.7. | 21.03–23.00 |  1h 57m | 29h 35m | Portfolio-listaus-näkymän viimeistelyä, portfolio-skeeman suunnittelua backendiin |
| 26.7. | 18.33–21.56 |  3h 23m | 32h 58m | Portfolioiden haun toteutus backendissä, portfolioiden haku backendista sekä esimerkkipohjaisen tyyppitarkistussysteemin toteutus frontendissä |
| 29.7. | 13.34–17.22 |  3h 48m | 36h 46m | Api-kutsujen korjailua hitaan netin kanssa tunnistettujen ongelmien osalta, portfolioiden luonti/muokkaus-lomakkeen kehitystä |
| 29.7. | 22.16–23.35 |  1h 19m | 38h  5m | Portfolioiden luomis-ominaisuus (vielä ilman itse teoksia) valmiiksi |
|  1.8. | 19.31–20.21 |     50m | 38h 55m | Portfolioiden muokkaamis-näkymä frontendissä |
|  2.8. | 15.43–17.24 |  1h 41m | 40h 36m | Portfolioiden muokkaamisen lisäys backendiin ja yleisesti toimimaan, jatkon suunnittelua |
|  2.8. | 19.11–21.46 |  2h 35m | 43h 11m | Portfolio-näkymä työn alle, tarvitut refaktoroinnit että julkaistut portfoliot näkee kirjautumatta (ja silloin ilman navia) |
|  5.8. | 13.53–19.20 |  5h 27m | 48h 38m | Portfolioiden julkaisu-ominaisuuden lisäys, teos-kategorioiden lisääminen tietokantaan ja niiden muokkaus-näkymän aloitus frontendissä |
| 10.8. | 16.36–19.26 |  2h 50m | 51h 28m | Teoksien haun lisääminen backendiin, teoslistauksen aloittelua frontendissä |
| 11.8. | 14.22–21.50 |  7h 28m | 58h 56m | Teoksien muokkausnäkymän lisääminen frontendiin |
| 12.8. | 14.33–16.54 |  2h 21m | 61h 17m | Teoksien muokkaus-endpointtien lisääminen backendiin, frontin korjailua |
| 16.8. | 15.50–18.21 |  2h 31m | 63h 48m | Teoksien muokkaus mvp valmiiksi (nyt myös tagit, kuvat) |
| 22.8. | 19.20–20.48 |  1h 28m | 65h 16m | Selkeämmän virheilmoituksen lisääminen tilanteille missä slug on jo käytössä |

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
