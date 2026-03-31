# Redis - Vedonlyöntisovellus

Tämä kansio sisältää esimerkin Node + Express -sovelluksesta, joka voi tehdä kyselyitä paikalliseen Dockerissa ajettavaan MongoDB-tietokantaan.

Sisältö:
- `package.json` - projektin riippuvuudet ja skriptit
- `src/app.js` - Express-sovellus ja Mongoose-mallit
- `.env.example` - ympäristömuuttujien esimerkki

Pikaohjeet:

1. Kopioi `.env.example` tiedostoksi `.env` ja muokkaa tarvittaessa (esim. MONGO_URI tai PORT).

2. Käynnistä MongoDB Docker-kontti. Esimerkki `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:6.0
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

Käynnistä komennolla (PowerShell):

docker compose up -d

3. Asenna riippuvuudet:

PowerShell:

npm install

4. Käynnistä sovellus:

npm run dev    # kehitys (nodemon)
# tai
npm start      # tuotanto

5. API-endpointit:

GET /                 -> Tervehdys
GET /items            -> Listaa itemit
POST /items           -> Luo uusi body: { "name": "esimerkki", "value": 123 }
GET /items/:id        -> Hae item id:llä
PUT /items/:id        -> Päivitä item
DELETE /items/:id     -> Poista item

Huomioita:
- Oletuksena sovellus yrittää yhdistää `MONGO_URI`-osoitteeseen, joka on `.env`-tiedostossa (esim. `mongodb://localhost:27017/testdb`).
- Käytä Dockerissa porttiforwardausta `27017:27017` niin sovellus löytää MongoDB:n localhostista.

Tarvitsetko, että lisään myös Postman/Insomnia -esimerkit tai docker-compose, joka sisältää sekä MongoDB:n että sovelluksen kontteina?