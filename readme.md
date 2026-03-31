# Redis - Vedonlyöntisovellus
Tämä kansio sisältää esimerkin Node + Express -sovelluksesta, joka voi tehdä kyselyitä mongodb tietokantaan ja nopeuttaa niitä käyttäen redistä.
(HUOM! Tarvitset tämän projektin testaamista varten toisen oppimistehtäväni Mongo_oppimistyo https://github.com/AuvinenEetu/mongo_oppimistyo)
1. docker compose up -d
2. avaa http://localhost:5540 selaimella
3. määrittele uusi redis kanta seuraavilla tiedoilla:
 Add database
 Conenection settings:
 Database alias: vedonlyonti
Host: tkredis
Select logical Database: 1
4. Asenna riippuvuudet: npm install
5. Käynnistä sovellus: npm run dev:all
6. avaa http://localhost:8080/ selaimessa
7. testaa hakujen nopeutta klikkailemalla bets, events, users ja top events painikkeita. Painikkeiden alla näkyy haun nopeus ja tieto siitä kummasta kannasta data on palautettu